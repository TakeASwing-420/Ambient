import * as Tonal from '@tonaljs/tonal';
import { Time } from 'tone/build/esm/core/type/Units';
import { Instrument } from './instruments';

/**
 * A sample loop with timing information
 */
class SampleLoop {
  /** Name of the sample group */
  sampleGroupName: string;

  /** Index within sample group */
  sampleIndex: number;

  /** Onset time in Tone.js */
  startTime: Time;

  /** Stop time in Tone.js */
  stopTime: Time;

  public constructor(sample: string, sampleIndex: number, startTime: Time, stopTime: Time) {
    this.sampleGroupName = sample;
    this.sampleIndex = sampleIndex;
    this.startTime = startTime;
    this.stopTime = stopTime;
  }
}

/**
 * Precise timing of a single note played by an instrument
 */
class InstrumentNote {
  /** Instrument that should play the note */
  instrument: Instrument;

  /** Pitch(es) to play, e.g. 'D#1' or ['C', 'E', 'G'] */
  pitch: string | string[];

  /** Duration in Tone.js time, if null, play entire note */
  duration: Time;

  /** Onset time in Tone.js */
  time: Time;

  /** Velocity of the note, between 0 and 1 (defaults to 1) */
  velocity?: number;

  public constructor(
    instrument: Instrument,
    pitch: string | string[],
    duration: Time,
    time: Time,
    velocity?: number
  ) {
    this.instrument = instrument;
    this.pitch =
      typeof pitch === 'string'
        ? Tonal.Note.simplify(pitch)
        : pitch.map((p) => Tonal.Note.simplify(p));
    this.duration = duration;
    this.time = time;
    this.velocity = velocity;
  }
}

/**
 * A Track contains the full information required to play a lofi track,
 * including sample loops, instrument notes, and metadata
 */
export class Track {
  /** Track title */
  title: string;

  /** Beats per minute */
  bpm: number;

  /** Track length in seconds */
  length: number;

  /** Map of sample group name to sample index */
  samples: Map<string, number>;

  /** List of unique instruments used in this track */
  instruments: Set<Instrument>;

  /** List of all sample loops in this track */
  sampleLoops: SampleLoop[];

  /** List of all instrument notes in this track */
  instrumentNotes: InstrumentNote[];

  /** Track color for visualization */
  color: string;

  constructor(
    title: string,
    bpm: number,
    length: number,
    samples: Map<string, number>,
    instruments: Set<Instrument>,
    sampleLoops: SampleLoop[],
    instrumentNotes: InstrumentNote[],
    color: string
  ) {
    this.title = title;
    this.bpm = bpm;
    this.length = length;
    this.samples = samples;
    this.instruments = instruments;
    this.sampleLoops = sampleLoops;
    this.instrumentNotes = instrumentNotes;
    this.color = color;
  }
}

export { SampleLoop, InstrumentNote };