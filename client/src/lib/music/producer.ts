import * as Tonal from '@tonaljs/tonal';
import { Time } from 'tone/build/esm/core/type/Units';
import { InstrumentNote, SampleLoop, Track } from './track';
import { OutputParams } from '@/types';
import {
  Chord,
  keyNumberToString,
  mapNote,
  randomColor,
  randomFromInterval,
} from './helper';
import { SAMPLEGROUPS, selectDrumbeat } from './samples';
import { Instrument } from './instruments';

/**
 * Producer preset configurations
 */
interface ProducerPreset {
  name: string;
  trackLength: number;
  instrumentProbabilities: Map<Instrument, number>;
  sampleProbabilities: Map<string, number>;
}

const DEFAULT_PRESET: ProducerPreset = {
  name: "Default",
  trackLength: 120,
  instrumentProbabilities: new Map([
    [Instrument.Piano, 0.8],
    [Instrument.SoftPiano, 0.6],
    [Instrument.ElectricPiano, 0.4],
    [Instrument.AcousticGuitar, 0.3],
    [Instrument.BassGuitar, 0.5],
    [Instrument.Harp, 0.2],
    [Instrument.Synth, 0.3]
  ]),
  sampleProbabilities: new Map([
    ['vinyl', 0.7],
    ['rain', 0.4],
    ['cafe', 0.3]
  ])
};

/**
 * The producer takes OutputParams to produce a Track.
 * The production process is deterministic, i.e. the same input will always yield the same output.
 */
class Producer {
  tonic: string;
  keyNum: number;
  mode: string;
  modeNum: number;
  energy: number;
  valence: number;
  swing: number;
  preset: ProducerPreset;
  notesInScale: string[];
  notesInScalePitched: string[];
  chords: Chord[];
  melodies: number[][];
  bpm: number;
  title: string;

  constructor(params: OutputParams) {
    this.keyNum = params.key;
    this.tonic = keyNumberToString(this.keyNum);
    this.modeNum = params.mode;
    this.mode = this.getModeString(this.modeNum);
    this.energy = params.energy;
    this.valence = params.valence;
    this.swing = params.swing;
    this.bpm = params.bpm;
    this.title = params.title || "Untitled";
    this.preset = DEFAULT_PRESET;
    
    // Process chords and melodies
    this.chords = params.chords.map(chordNum => new Chord(this.processChord(chordNum)));
    this.melodies = params.melodies;
    
    // Generate scale
    this.notesInScale = Tonal.Scale.get(`${this.tonic} ${this.mode}`).notes;
  }

  private getModeString(modeNum: number): string {
    const modes = ['', 'ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];
    return modes[modeNum] || 'ionian';
  }

  private processChord(chordNum: number): any {
    // Convert chord number to actual chord
    const scaleDegree = chordNum % 7;
    const chordRoot = this.notesInScale[scaleDegree];
    const chordName = `${chordRoot}m`; // Simple minor chord for lofi
    return Tonal.Chord.get(chordName);
  }

  produce(): Track {
    const trackLength = this.preset.trackLength;
    const samples = this.generateSamples();
    const instruments = this.generateInstruments();
    const sampleLoops = this.generateSampleLoops(samples, trackLength);
    const instrumentNotes = this.generateInstrumentNotes(instruments, trackLength);
    const color = randomColor(this.keyNum + this.modeNum);

    return new Track(
      this.title,
      this.bpm,
      trackLength,
      samples,
      instruments,
      sampleLoops,
      instrumentNotes,
      color
    );
  }

  private generateSamples(): Map<string, number> {
    const samples = new Map<string, number>();
    
    // Always include a drum loop
    const drumbeat = selectDrumbeat(this.bpm);
    samples.set(drumbeat, 0);
    
    // Add other samples based on energy and valence
    Array.from(this.preset.sampleProbabilities).forEach(([sampleName, probability]) => {
      const adjustedProbability = probability * (this.energy * 0.5 + this.valence * 0.5);
      if (Math.random() < adjustedProbability) {
        const sampleGroup = SAMPLEGROUPS.get(sampleName);
        if (sampleGroup) {
          const sampleIndex = sampleGroup.getRandomSample(this.keyNum + this.modeNum);
          samples.set(sampleName, sampleIndex);
        }
      }
    });

    return samples;
  }

  private generateInstruments(): Set<Instrument> {
    const instruments = new Set<Instrument>();
    
    Array.from(this.preset.instrumentProbabilities).forEach(([instrument, probability]) => {
      const adjustedProbability = probability * (this.energy * 0.7 + 0.3);
      if (Math.random() < adjustedProbability) {
        instruments.add(instrument);
      }
    });

    // Ensure at least one instrument
    if (instruments.size === 0) {
      instruments.add(Instrument.Piano);
    }

    return instruments;
  }

  private generateSampleLoops(samples: Map<string, number>, trackLength: number): SampleLoop[] {
    const sampleLoops: SampleLoop[] = [];
    
    Array.from(samples).forEach(([sampleGroupName, sampleIndex]) => {
      // Most samples loop for the entire track
      sampleLoops.push(new SampleLoop(
        sampleGroupName,
        sampleIndex,
        "0" as Time,
        `${trackLength}` as Time
      ));
    });

    return sampleLoops;
  }

  private generateInstrumentNotes(instruments: Set<Instrument>, trackLength: number): InstrumentNote[] {
    const notes: InstrumentNote[] = [];
    const measuresPerChord = 4;
    const beatsPerMeasure = 4;
    const totalMeasures = Math.floor((trackLength * this.bpm) / (60 * beatsPerMeasure));
    
    // Generate chord progression
    for (let measure = 0; measure < totalMeasures; measure += measuresPerChord) {
      const chordIndex = Math.floor(measure / measuresPerChord) % this.chords.length;
      const chord = this.chords[chordIndex];
      const startTime = (measure * beatsPerMeasure * 60) / this.bpm;
      
      Array.from(instruments).forEach(instrument => {
        // Generate notes based on instrument type
        if (instrument === Instrument.BassGuitar) {
          // Bass plays root notes
          const bassNote = chord.root + '2';
          for (let beat = 0; beat < measuresPerChord * beatsPerMeasure; beat += 2) {
            const noteTime = startTime + (beat * 60) / this.bpm;
            notes.push(new InstrumentNote(
              instrument,
              bassNote,
              "2n" as Time,
              `${noteTime}` as Time,
              0.8
            ));
          }
        } else {
          // Melody instruments play chord tones and melodies
          const melodyIndex = Math.floor(measure / measuresPerChord) % this.melodies.length;
          const melody = this.melodies[melodyIndex];
          
          melody.forEach((noteNum, index) => {
            if (noteNum >= 0) {
              const scaleDegree = noteNum % 7;
              const octave = Math.floor(noteNum / 7);
              const pitch = this.notesInScale[scaleDegree] + (octave + 4);
              const noteTime = startTime + (index * 60) / (this.bpm * 2); // Eighth notes
              
              notes.push(new InstrumentNote(
                instrument,
                pitch,
                "8n" as Time,
                `${noteTime}` as Time,
                randomFromInterval(6, 10) / 10
              ));
            }
          });
        }
      });
    }

    return notes;
  }
}

export { Producer };