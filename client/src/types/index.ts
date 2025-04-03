export interface AudioFile {
  file: File;
  name: string;
  size: string;
  duration: string;
  url: string;
}

export interface LofiParameters {
  chillLevel: number;
  beatIntensity: number;
  vintageEffect: number;
  mood: 'relaxed' | 'focus' | 'sleep';
}

export interface GeneratedAudio {
  id: string;
  url: string;
  filename: string;
  duration: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}
