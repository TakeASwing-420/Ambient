export interface VideoFile {
  file: File;
  name: string;
  size: string;
  duration: string;
  url: string;
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

export interface GeneratedVideo {
  url: string;
  filename: string;
  originalFileName: string;
  musicParameters: OutputParams;
}

export interface ProcessingResult {
  success: boolean;
  data?: string;
  error?: string;
}