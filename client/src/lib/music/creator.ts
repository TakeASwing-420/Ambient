import * as Tone from "tone";
import { getInstrumentFilters, getInstrument, Instrument } from "./instruments";
import * as Samples from "./samples";
import { Track } from "./track";

export class Creator {
  currentTrack: Track;
  gain: Tone.Gain;
  samplePlayers: Map<string, Tone.Player[]>;
  instruments: Map<Instrument, any>;
  recorder: Tone.Recorder;

  constructor(currentTrack: Track) {
    this.currentTrack = currentTrack;
    this.gain = new Tone.Gain();
    this.samplePlayers = new Map();
    this.instruments = new Map();
    this.recorder = new Tone.Recorder();
  }

  async load(): Promise<Blob> {
    await Tone.start();
    Tone.getTransport().bpm.value = this.currentTrack.bpm;

    this.samplePlayers = new Map();
    this.instruments = new Map();

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
        `Loading sample: ${sampleGroupName} at index ${sampleIndex} with URL: ${sampleGroup.getSampleUrl(sampleIndex)}`
      );
      player.chain(
        ...sampleGroup.getFilters(),
        this.gain
      );
      player.sync();

      if (!this.samplePlayers.has(sampleGroupName)) {
        this.samplePlayers.set(sampleGroupName, Array(sampleGroup.size));
      }
      this.samplePlayers.get(sampleGroupName)![sampleIndex] = player;
    }

    // load instruments
    const instrumentVolumes = new Map();
    for (const instrument of this.currentTrack.instruments) {
      const toneInstrument = getInstrument(instrument)
        .chain(
          ...getInstrumentFilters(instrument),
          this.gain
        )
        .sync();
      this.instruments.set(instrument, toneInstrument);
      instrumentVolumes.set(toneInstrument, toneInstrument.volume.value);
      console.log(
        `Loading instrument: ${instrument} with volume: ${toneInstrument.volume.value}`
      );
    }

    // set up swing
    Tone.getTransport().swing = this.currentTrack.swing ? 2 / 3 : 0;

    // wait until all samples are loaded
    await Tone.loaded();

    for (const sampleLoop of this.currentTrack.sampleLoops) {
      const samplePlayer = this.samplePlayers.get(sampleLoop.sampleGroupName)[
        sampleLoop.sampleIndex
      ];
      samplePlayer.start(sampleLoop.startTime);
      samplePlayer.stop(sampleLoop.stopTime);
      console.log(
        `Starting sample loop: ${sampleLoop.sampleGroupName} at index ${sampleLoop.sampleIndex} from ${sampleLoop.startTime} to ${sampleLoop.stopTime}`
      );
    }

    for (const noteTiming of this.currentTrack.instrumentNotes) {
      const instrumentSampler = this.instruments.get(noteTiming.instrument);
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
    this.gain.connect(this.recorder);

    const fadeOutBegin =
      this.currentTrack.length - this.currentTrack.fadeOutDuration;

    // schedule events to do every 100ms
    Tone.getTransport().scheduleRepeat((time) => {
      const seconds = Tone.getTransport().getSecondsAtTime(time);
      // schedule fade out in the last seconds
      const volumeOffset =
        seconds < fadeOutBegin ? 0 : (seconds - fadeOutBegin) * 4;
      instrumentVolumes.forEach((volume, sampler) => {
        sampler.volume.value = volume - volumeOffset;
      });
    }, 0.1);
    
    console.log(
      `Transport scheduled to repeat every 100ms with fade out starting at ${fadeOutBegin} seconds`
    );
    // Record and return audio blob
    return await this.recordAndSave();
  }

  private async recordAndSave(): Promise<Blob> {
    await Tone.start();
    console.log("Starting audio recording...");
    this.recorder.start();
    console.log("Audio recording started");
    Tone.getTransport().start();
    console.log("Transport started");
    return new Promise((resolve) => {
      setTimeout(async () => {
        const recording = await this.recorder.stop();
        Tone.getTransport().stop();
        Tone.getTransport().cancel();
        resolve(recording);
      }, this.currentTrack.length * 1000);
    });
  }

  dispose() {
    // Clean up Tone.js objects
    this.samplePlayers.forEach((players) => {
      players.forEach((player) => {
        if (player) {
          player.dispose();
        }
      });
    });

    this.instruments.forEach((instrument) => {
      instrument.dispose();
    });

    this.gain.dispose();
    this.recorder.dispose();
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
  }
}
