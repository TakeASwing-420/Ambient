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
    for (const [sampleGroupName, sampleIndex] of Array.from(this.currentTrack.samples)) {
      const sampleGroup = Samples.SAMPLEGROUPS.get(sampleGroupName);
      if (!sampleGroup) continue;

      const player = new Tone.Player({
        url: sampleGroup.getSampleUrl(sampleIndex),
        volume: sampleGroup.volume,
        loop: true,
        fadeIn: "8n",
        fadeOut: "8n",
      })
        .chain(...sampleGroup.getFilters(), this.gain, Tone.getDestination())
        .sync();

      if (!this.samplePlayers.has(sampleGroupName)) {
        this.samplePlayers.set(sampleGroupName, Array(sampleGroup.size));
      }
      this.samplePlayers.get(sampleGroupName)![sampleIndex] = player;
    }

    // Load instruments
    const instrumentVolumes = new Map();
    for (const instrument of Array.from(this.currentTrack.instruments)) {
      const toneInstrument = getInstrument(instrument);
      const filters = getInstrumentFilters(instrument);
      
      toneInstrument.chain(...filters, this.gain, Tone.getDestination());
      this.instruments.set(instrument, toneInstrument);
      instrumentVolumes.set(toneInstrument, toneInstrument.volume.value);
    }

    // Schedule sample loops
    for (const sampleLoop of this.currentTrack.sampleLoops) {
      const players = this.samplePlayers.get(sampleLoop.sampleGroupName);
      if (players && players[sampleLoop.sampleIndex]) {
        const player = players[sampleLoop.sampleIndex];
        player.start(sampleLoop.startTime);
        player.stop(sampleLoop.stopTime);
      }
    }

    // Schedule instrument notes
    for (const note of this.currentTrack.instrumentNotes) {
      const instrument = this.instruments.get(note.instrument);
      if (instrument) {
        instrument.triggerAttackRelease(
          note.pitch,
          note.duration,
          note.time,
          note.velocity || 1
        );
      }
    }

    // Connect recorder
    this.gain.connect(this.recorder);

    // Fade out effect
    const fadeOutBegin = this.currentTrack.length - 10;
    const fadeOutInterval = setInterval(() => {
      const seconds = Tone.getTransport().seconds;
      if (seconds >= this.currentTrack.length) {
        clearInterval(fadeOutInterval);
        return;
      }

      const volumeOffset = seconds < fadeOutBegin ? 0 : (seconds - fadeOutBegin) * 4;
      instrumentVolumes.forEach((volume, sampler) => {
        sampler.volume.value = volume - volumeOffset;
      });
    }, 100);

    // Record and return audio blob
    return await this.recordAndSave();
  }

  private async recordAndSave(): Promise<Blob> {
    await Tone.start();
    this.recorder.start();
    Tone.getTransport().start();

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
    this.samplePlayers.forEach(players => {
      players.forEach(player => {
        if (player) {
          player.dispose();
        }
      });
    });

    this.instruments.forEach(instrument => {
      instrument.dispose();
    });

    this.gain.dispose();
    this.recorder.dispose();
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
  }
}