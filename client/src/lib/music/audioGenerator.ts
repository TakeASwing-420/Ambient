import { OutputParams } from '@/types';
import { Producer } from './producer';
import { Creator } from './creator';

/**
 * Generates audio from music parameters using Tone.js in the browser
 */
export class AudioGenerator {
  
  /**
   * Generate a lofi audio track from the given parameters
   */
  static async generateAudio(params: OutputParams): Promise<Blob> {
    try {
      // Create producer and generate track
      const producer = new Producer(params);
      const track = producer.produce();
      
      // Create audio using Tone.js
      const creator = new Creator(track);
      const audioBlob = await creator.load();
      
      // Clean up
      creator.dispose();
      
      return audioBlob;
    } catch (error) {
      console.error('Audio generation failed:', error);
      throw new Error('Failed to generate audio: ' + error.message);
    }
  }

  /**
   * Combine video with generated audio (browser-based)
   */
  static async combineVideoWithAudio(videoFile: File, audioBlob: Blob): Promise<Blob> {
    // For now, we'll just return the audio blob
    // In a full implementation, you'd use libraries like FFmpeg.js for browser-based video processing
    console.log('Video-audio combination would happen here');
    return audioBlob;
  }

  /**
   * Download audio as file
   */
  static downloadAudio(audioBlob: Blob, filename: string = 'lofi-track.wav') {
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}