import * as Tonal from '@tonaljs/tonal';
import * as Tone from 'tone';
import { OutputParams } from '@/types';

export interface Track {
  title: string;
  swing: boolean;
  key: string;
  keyNum: number;
  mode: string;
  modeNum: number;
  numMeasures: number;
  bpm: number;
  color: string;
  outputParams: OutputParams;
  audioBuffer?: AudioBuffer;
}

export class MusicProducer {
  private audioContext: AudioContext;
  private isInitialized = false;

  constructor() {
    this.audioContext = new AudioContext();
  }

  async initialize() {
    if (!this.isInitialized) {
      await Tone.start();
      this.isInitialized = true;
    }
  }

  keyNumberToString(keyNum: number): string {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return keys[keyNum % 12];
  }

  async produceTrack(params: OutputParams): Promise<Track> {
    await this.initialize();

    const tonic = this.keyNumberToString(params.key);
    const mode = Tonal.Mode.names()[params.mode - 1] || 'major';
    const bpm = Math.max(70, Math.min(100, Math.round(params.bpm / 5) * 5));

    const track: Track = {
      title: params.title || `Lofi track in ${tonic} ${mode}`,
      swing: params.swing > 0.5,
      key: tonic,
      keyNum: params.key,
      mode: mode,
      modeNum: params.mode,
      numMeasures: params.chords.length * 3, // intro + main + outro
      bpm: bpm,
      color: this.generateColor(params.energy + params.valence),
      outputParams: params,
    };

    // Generate audio
    track.audioBuffer = await this.generateAudio(params);
    
    return track;
  }

  private async generateAudio(params: OutputParams): Promise<AudioBuffer> {
    const bpm = Math.max(70, Math.min(100, Math.round(params.bpm / 5) * 5));
    const measureDuration = (60 / bpm) * 4; // 4/4 time signature
    const totalDuration = params.chords.length * measureDuration * 3; // 3 iterations

    // Create offline audio context for rendering
    const offlineContext = new OfflineAudioContext(2, totalDuration * 44100, 44100);
    
    // Set up Tone.js to use offline context
    Tone.setContext(offlineContext as any);

    try {
      // Create instruments
      const bass = new Tone.FMSynth({
        harmonicity: 0.5,
        modulationIndex: 2,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 1 },
        modulation: { type: 'sine' }
      }).toDestination();

      const harmony = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 2,
        modulationIndex: 1,
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 2 }
      }).toDestination();

      const melody = new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 0.5,
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 1 }
      }).toDestination();

      // Generate notes based on parameters
      const tonic = this.keyNumberToString(params.key);
      const mode = Tonal.Mode.names()[params.mode - 1] || 'major';
      const scale = Tonal.Mode.notes(mode, tonic);
      const chords = Tonal.Mode.triads(mode, tonic);

      let currentTime = 0;

      // Generate music for each chord in the progression
      for (let iteration = 0; iteration < 3; iteration++) {
        for (let chordIndex = 0; chordIndex < params.chords.length; chordIndex++) {
          const chordDegree = params.chords[chordIndex] - 1;
          const chordName = chords[chordDegree];
          
          if (chordName && !chordName.includes('dim')) {
            const chord = Tonal.Chord.getChord('maj', `${scale[chordDegree]}3`);
            
            // Bass line
            bass.triggerAttackRelease(`${scale[chordDegree]}2`, '2n', currentTime);
            
            // Harmony
            if (chord.notes && chord.notes.length >= 3) {
              harmony.triggerAttackRelease(chord.notes.slice(0, 3), '1m', currentTime);
            }
            
            // Melody based on the melodies parameter
            if (params.melodies[chordIndex]) {
              params.melodies[chordIndex].forEach((noteIndex, beatIndex) => {
                if (noteIndex > 0 && noteIndex <= scale.length) {
                  const note = `${scale[noteIndex - 1]}4`;
                  const beatTime = currentTime + (beatIndex * measureDuration / 8);
                  melody.triggerAttackRelease(note, '8n', beatTime);
                }
              });
            }
          }
          
          currentTime += measureDuration;
        }
      }

      // Render audio
      const renderedBuffer = await offlineContext.startRendering();
      
      // Reset Tone.js context
      Tone.setContext(this.audioContext as any);
      
      return renderedBuffer;
    } catch (error) {
      console.error('Error generating audio:', error);
      Tone.setContext(this.audioContext as any);
      throw error;
    }
  }

  private generateColor(energy: number): string {
    const hue = Math.floor((energy * 360) % 360);
    return `hsl(${hue}, 70%, 60%)`;
  }

  bufferToWav(buffer: AudioBuffer): Blob {
    const length = buffer.length;
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * channels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * channels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * channels * 2, true);

    // Convert float audio data to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        const clampedSample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, clampedSample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }
}