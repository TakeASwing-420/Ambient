import * as Tone from "tone";
import { getInstrumentFilters, getInstrument, Instrument } from "./instruments";
import * as Samples from "./samples";
import { Track } from "./track";

export class Creator {
  currentTrack: Track;

  constructor(currentTrack: Track) {
    this.currentTrack = currentTrack;
  }

  async load(): Promise<Blob> {
    // Use Tone.Offline for faster-than-realtime rendering
    const buffer = await Tone.Offline(async (context) => {
      // Set up transport settings
      context.transport.bpm.value = this.currentTrack.bpm;
      context.transport.swing = this.currentTrack.swing ? 2 / 3 : 0;

      // Create main gain node for mixing
      const mainGain = new Tone.Gain(0.8).toDestination();

      // Maps to store our audio sources
      const samplePlayers = new Map<string, Tone.Player[]>();
      const instruments = new Map<Instrument, any>();

      // Load sample players
      for (const [sampleGroupName, sampleIndex] of Array.from(
        this.currentTrack.samples
      )) {
        const sampleGroup = Samples.SAMPLEGROUPS.get(sampleGroupName);
        if (!sampleGroup) continue;

        const player = new Tone.Player({
          url: sampleGroup.getSampleUrl(sampleIndex),
          volume: sampleGroup.volume,
          loop: true,
          fadeIn: "8n",
          fadeOut: "8n",
        });

        console.log(
          `Loading sample: ${sampleGroupName} at index ${sampleIndex} with URL: ${sampleGroup.getSampleUrl(
            sampleIndex
          )}`
        );

        // Create filters with context - temporarily set context for filter creation
        const originalContext = Tone.getContext();
        Tone.setContext(context);

        const filters = sampleGroup.getFilters().map((filterConfig) => {
          // Recreate filters with the offline context
          if (filterConfig instanceof Tone.Filter) {
            return new Tone.Filter({
              type: filterConfig.type,
              frequency: filterConfig.frequency.value,
              Q: filterConfig.Q.value,
            });
          } else if (filterConfig instanceof Tone.Reverb) {
            const reverb = new Tone.Reverb({
              decay: Tone.Time(filterConfig.decay).toSeconds(),
              wet: filterConfig.wet.value,
              preDelay: Tone.Time(filterConfig.preDelay).toSeconds(),
            });
            return reverb;
          }
          // Add other filter types as needed
          return filterConfig;
        });

        // Restore original context
        Tone.setContext(originalContext);

        player.chain(...filters, mainGain);

        if (!samplePlayers.has(sampleGroupName)) {
          samplePlayers.set(sampleGroupName, Array(sampleGroup.size));
        }
        samplePlayers.get(sampleGroupName)![sampleIndex] = player;
      }

      // Load instruments - pass context
      const instrumentVolumes = new Map();
      for (const instrument of this.currentTrack.instruments) {
        const toneInstrument = getInstrument(instrument, context).chain(
          ...getInstrumentFilters(instrument, context),
          mainGain
        );

        instruments.set(instrument, toneInstrument);
        instrumentVolumes.set(toneInstrument, toneInstrument.volume.value);

        console.log(
          `Loading instrument: ${instrument} with volume: ${toneInstrument.volume.value}`
        );
      }

      // Wait for all samples to load
      await Tone.loaded();

      // Schedule sample loops
      for (const sampleLoop of this.currentTrack.sampleLoops) {
        const samplePlayer = samplePlayers.get(sampleLoop.sampleGroupName)?.[
          sampleLoop.sampleIndex
        ];

        if (samplePlayer) {
          samplePlayer.start(sampleLoop.startTime);
          samplePlayer.stop(sampleLoop.stopTime);

          console.log(
            `Scheduling sample loop: ${sampleLoop.sampleGroupName} at index ${sampleLoop.sampleIndex} from ${sampleLoop.startTime} to ${sampleLoop.stopTime}`
          );
        }
      }

      // Schedule instrument notes
      for (const noteTiming of this.currentTrack.instrumentNotes) {
        const instrumentSampler = instruments.get(noteTiming.instrument);
        if (!instrumentSampler) continue;

        if (noteTiming.duration) {
          instrumentSampler.triggerAttackRelease(
            noteTiming.pitch,
            noteTiming.duration,
            noteTiming.time,
            noteTiming.velocity !== undefined ? noteTiming.velocity : 1
          );
        } else {
          instrumentSampler.triggerAttack(
            noteTiming.pitch,
            noteTiming.time,
            noteTiming.velocity !== undefined ? noteTiming.velocity : 1
          );
        }

        console.log(
          `Scheduling note: ${noteTiming.instrument} playing ${noteTiming.pitch} at ${noteTiming.time} with duration ${noteTiming.duration} and velocity ${noteTiming.velocity}`
        );
      }

      // Schedule fade out automation
      const fadeOutBegin =
        this.currentTrack.length - this.currentTrack.fadeOutDuration;

      // Create automation for fade out
      context.transport.scheduleRepeat((time) => {
        const seconds = context.transport.getSecondsAtTime(time);
        if (seconds >= fadeOutBegin) {
          const fadeProgress =
            (seconds - fadeOutBegin) / this.currentTrack.fadeOutDuration;
          const volumeReduction = fadeProgress * 60; // 60dB fade

          instrumentVolumes.forEach((originalVolume, sampler) => {
            sampler.volume.setValueAtTime(
              originalVolume - volumeReduction,
              time
            );
          });
        }
      }, 0.1);

      console.log(
        `Scheduled fade out starting at ${fadeOutBegin} seconds for duration ${this.currentTrack.fadeOutDuration} seconds`
      );

      // Start transport for offline rendering
      context.transport.start(0);
    }, this.currentTrack.length);

    // Convert ToneAudioBuffer to Blob
    return this.toneAudioBufferToBlob(buffer);
  }

  private toneAudioBufferToBlob(buffer: Tone.ToneAudioBuffer): Blob {
    // Get the underlying AudioBuffer from ToneAudioBuffer
    const audioBuffer = buffer.get();

    if (!audioBuffer) {
      throw new Error("Failed to get AudioBuffer from ToneAudioBuffer");
    }

    // Convert AudioBuffer to WAV format
    const length = audioBuffer.length;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;

    // Calculate buffer size for WAV file
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV file header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true); // byte rate
    view.setUint16(32, numberOfChannels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, "data");
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(
          -1,
          Math.min(1, audioBuffer.getChannelData(channel)[i])
        );
        view.setInt16(offset, sample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  }

  // No longer needed since we're not using real-time rendering
  dispose() {
    // Cleanup is handled automatically by Tone.Offline
    console.log("Creator disposed");
  }
}