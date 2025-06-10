import { Instrument } from './instruments';

export interface ProducerPreset {
  bassLine?: {
    instrument: Instrument;
    octaveShift: number;
    volume?: number;
  };
  harmony?: {
    instrument: Instrument;
    octaveShift: number;
    volume?: number;
  };
  firstBeatArpeggio?: {
    instrument: Instrument;
    octaveShift: number;
    volume?: number;
  };
  melody?: {
    instrument: Instrument;
    octaveShift: number;
    volume?: number;
  };
  firstBeatArpeggioPattern: number[];
  melodyOctaves?: boolean;
}

export const BassPatterns: [number, number][][] = [
  [[0, 4]], // whole note on beat 1
  [[0, 2], [2, 2]], // half notes on beats 1 and 3
  [[0, 1], [1, 1], [2, 1], [3, 1]], // quarter notes on all beats
  [[0, 2], [2.5, 1], [3.5, 0.5]], // syncopated pattern
  [[0, 1], [2, 1]], // quarter notes on beats 1 and 3
];

const PRESETS: ProducerPreset[] = [
  // Preset 0: Minimal and chill (low valence, low energy)
  {
    bassLine: {
      instrument: Instrument.BassGuitar,
      octaveShift: 0,
      volume: 0.6
    },
    harmony: {
      instrument: Instrument.ElectricPiano,
      octaveShift: 0,
      volume: 0.4
    },
    melody: {
      instrument: Instrument.Piano,
      octaveShift: 1,
      volume: 0.5
    },
    firstBeatArpeggioPattern: [1, 3, 5],
    melodyOctaves: false
  },
  
  // Preset 1: Warm and cozy (medium valence, low energy)
  {
    bassLine: {
      instrument: Instrument.BassGuitar,
      octaveShift: 0,
      volume: 0.7
    },
    harmony: {
      instrument: Instrument.Piano,
      octaveShift: 0,
      volume: 0.5
    },
    firstBeatArpeggio: {
      instrument: Instrument.Harp,
      octaveShift: 1,
      volume: 0.4
    },
    melody: {
      instrument: Instrument.ElectricPiano,
      octaveShift: 1,
      volume: 0.6
    },
    firstBeatArpeggioPattern: [1, 3, 5, 3],
    melodyOctaves: true
  },
  
  // Preset 2: Upbeat and jazzy (high valence, medium energy)
  {
    bassLine: {
      instrument: Instrument.BassGuitar,
      octaveShift: 0,
      volume: 0.8
    },
    harmony: {
      instrument: Instrument.ElectricGuitar,
      octaveShift: 0,
      volume: 0.5
    },
    firstBeatArpeggio: {
      instrument: Instrument.Piano,
      octaveShift: 1,
      volume: 0.6
    },
    melody: {
      instrument: Instrument.Synth,
      octaveShift: 1,
      volume: 0.7
    },
    firstBeatArpeggioPattern: [1, 3, 5, 7],
    melodyOctaves: true
  },
  
  // Preset 3: Energetic and bright (high valence, high energy)
  {
    bassLine: {
      instrument: Instrument.BassGuitar,
      octaveShift: 0,
      volume: 0.9
    },
    harmony: {
      instrument: Instrument.ElectricGuitar,
      octaveShift: 0,
      volume: 0.6
    },
    firstBeatArpeggio: {
      instrument: Instrument.AcousticGuitar,
      octaveShift: 1,
      volume: 0.7
    },
    melody: {
      instrument: Instrument.Piano,
      octaveShift: 1,
      volume: 0.8
    },
    firstBeatArpeggioPattern: [1, 5, 3, 7, 5],
    melodyOctaves: true
  }
];

export function selectPreset(valence: number, energy: number): ProducerPreset {
  // Select preset based on valence and energy quadrants
  if (valence < 0.5 && energy < 0.5) {
    return PRESETS[0]; // low valence, low energy
  } else if (valence >= 0.5 && energy < 0.5) {
    return PRESETS[1]; // high valence, low energy
  } else if (valence >= 0.5 && energy >= 0.5) {
    return PRESETS[3]; // high valence, high energy
  } else {
    return PRESETS[2]; // low valence, high energy
  }
}