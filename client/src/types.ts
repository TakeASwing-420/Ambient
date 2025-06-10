export interface VideoFile {
  file: File;
  name: string;
  size: string;
  duration: string;
  url: string;
}

export interface GeneratedVideo {
  url: string;
  filename: string;
  originalFileName: string;
  musicParameters: any;
  videoId: number;
}

export interface OutputParams {
  title?: string;
  key: number;
  mode: number;
  bpm: number;
  energy: number;
  valence: number;
  swing: number;
  chords: number[];
  melodies: number[][];
}

export interface LofiParameters {
  chillLevel: number;
  beatIntensity: number;
  vintageEffect: number;
  mood: string;
}