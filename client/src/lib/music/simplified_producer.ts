import { OutputParams } from '@/types';
import { Track } from './track';
import { Instrument } from './instruments';
import { InstrumentNote, SampleLoop } from './track';
import { Time } from 'tone/build/esm/core/type/Units';

/**
 * Simplified producer that creates basic lofi tracks from AI parameters
 */
export class SimplifiedProducer {
  produce(params: OutputParams): Track {
    const bpm = Math.max(70, Math.min(100, Math.round(params.bpm / 5) * 5));
    const key = this.getKeyString(params.key);
    const mode = params.mode === 1 ? 'major' : 'minor';
    
    const track = new Track({
      title: params.title || `LoFi Track in ${key} ${mode}`,
      key,
      keyNum: params.key,
      mode,
      modeNum: params.mode,
      bpm,
      swing: params.swing > 0.5,
      numMeasures: 32,
      fadeOutDuration: 5,
      samples: [['vinyl', 0]],
      sampleLoops: [
        new SampleLoop('vinyl', 0, '0:0' as Time, '32:0' as Time)
      ],
      instruments: [Instrument.Piano, Instrument.BassGuitar],
      instrumentNotes: this.generateSimpleNotes(params, key, mode, bpm),
      color: this.generateColor(params.energy, params.valence),
      outputParams: params
    });

    return track;
  }

  private getKeyString(keyNum: number): string {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return keys[keyNum % 12];
  }

  private generateSimpleNotes(params: OutputParams, key: string, mode: string, bpm: number): InstrumentNote[] {
    const notes: InstrumentNote[] = [];
    
    // Simple bass pattern
    for (let measure = 0; measure < 32; measure++) {
      notes.push(new InstrumentNote(
        Instrument.BassGuitar,
        `${key}2`,
        '1m' as Time,
        `${measure}:0` as Time,
        0.6
      ));
    }

    // Simple chord progression on piano
    const chordPattern = params.chords.length > 0 ? params.chords : [1, 4, 5, 1];
    for (let measure = 0; measure < 32; measure++) {
      const chordIndex = measure % chordPattern.length;
      const chordRoot = this.getChordRoot(key, chordPattern[chordIndex], mode);
      
      notes.push(new InstrumentNote(
        Instrument.Piano,
        [chordRoot, this.getThird(chordRoot, mode), this.getFifth(chordRoot)],
        '1m' as Time,
        `${measure}:0` as Time,
        0.4
      ));
    }

    return notes;
  }

  private getChordRoot(key: string, degree: number, mode: string): string {
    const scales = {
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10]
    };
    
    const keyNum = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(key);
    const scalePattern = scales[mode as keyof typeof scales] || scales.major;
    const noteNum = (keyNum + scalePattern[(degree - 1) % 7]) % 12;
    
    return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][noteNum] + '3';
  }

  private getThird(root: string, mode: string): string {
    const rootNote = root.slice(0, -1);
    const octave = root.slice(-1);
    const rootNum = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(rootNote);
    const thirdInterval = mode === 'major' ? 4 : 3;
    const thirdNum = (rootNum + thirdInterval) % 12;
    
    return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][thirdNum] + octave;
  }

  private getFifth(root: string): string {
    const rootNote = root.slice(0, -1);
    const octave = root.slice(-1);
    const rootNum = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(rootNote);
    const fifthNum = (rootNum + 7) % 12;
    
    return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][fifthNum] + octave;
  }

  private generateColor(energy: number, valence: number): string {
    const hue = Math.floor((energy + valence) * 180);
    const saturation = Math.floor(30 + valence * 40);
    const lightness = Math.floor(60 + energy * 20);
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
}