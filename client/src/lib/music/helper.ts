import * as Tonal from '@tonaljs/tonal';
import { Time } from 'tone/build/esm/core/type/Units';

/** Wraps inaccessible Tonal.Chord class */
export class Chord {
  empty: boolean;
  name: string;
  aliases: string[];
  tonic: string | null;
  type: string;
  root: string;
  rootDegree: number;
  symbol: string;
  notes: Tonal.NoteName[];

  constructor(chord: any) {
    this.empty = chord.empty;
    this.name = chord.name;
    this.aliases = chord.aliases;
    this.tonic = chord.tonic;
    this.type = chord.type;
    this.root = chord.root;
    this.rootDegree = chord.rootDegree;
    this.symbol = chord.symbol;
    this.notes = chord.notes;
  }
}

/** Shifts a given note by a number of octaves */
export const octShift = (note: string, octaves: number) => {
  const noteObj = Tonal.Note.get(note);
  return Tonal.Note.fromMidi(Tonal.Note.midi(noteObj.name + noteObj.oct) + octaves * 12);
};

/** Shifts given notes by a number of octaves */
export const octShiftAll = (notes: string[], octaves: number) =>
  notes.map((note) => octShift(note, octaves));

/** Maps a given note number to a scale degree and octave, e.g. 8 -> [0, 1] */
export const mapNote = (note: number) => {
  const scaleDegree = note % 7;
  const octave = Math.floor(note / 7);
  return [scaleDegree, octave];
};

/** Mounts given note numbers on a given scale */
export const mountNotesOnScale = (offsetScaleDegree: number, notes: number[], scale: string[]) =>
  notes.map((note) => {
    const [scaleDegree, octave] = mapNote(note + offsetScaleDegree);
    return octShift(scale[scaleDegree], octave);
  });

/** Converts a key number to string, e.g. 2 => 'C#' */
export const keyNumberToString = (key: number): string => {
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return keys[key - 1] || 'C';
};

/** Adds two Tone.js Time objects together */
export const addTime = (time1: Time, time2: Time) => {
  return `${parseFloat(time1.toString()) + parseFloat(time2.toString())}`;
};

/** Subtracts one Tone.js Time objects from another */
export const subtractTime = (time1: Time, time2: Time) => {
  return `${parseFloat(time1.toString()) - parseFloat(time2.toString())}`;
};

/** Converts a number of measures to seconds */
export const measuresToSeconds = (measures: number, bpm: number) => {
  return (measures * 4 * 60) / bpm;
};

/** Returns a number sampled from a standard normal distribution using the Box–Muller transform */
export const randn = () => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
};

/** Returns a quasi-random number between min-max based on given seed number */
export const randomFromInterval = (min: number, max: number, seed?: number) => {
  if (seed !== undefined) {
    const x = Math.sin(seed) * 10000;
    const random = x - Math.floor(x);
    return Math.floor(random * (max - min + 1)) + min;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/** Returns a quasi-random number between 0-1 based on given seed number */
export const random = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

/** Generates a random pastel color based on seed */
export const randomColor = (seed: number) => {
  const hue = random(seed) * 360;
  return `hsl(${hue}, 70%, 80%)`;
};