import { OutputParams } from "@/types";
import { Producer } from "./producer";
import { Creator } from "./creator";

/**
 * Generates audio from music parameters using Tone.js in the browser
 */
export class AudioGenerator {
  /**
   * Generate a lofi audio track from the given parameters
   */
  static async generateAudio(params: OutputParams): Promise<Blob> {
    try {
      console.log("Generating audio with params:", params);
      // Create producer and generate track
      const producer = new Producer();
      const track = producer.produce(params);
      const startTime = performance.now();
      // Create audio using Tone.js
      const creator = new Creator(track);
      const audioBlob = await creator.load();
      const endTime = performance.now();
      console.log("Audio generation completed in", endTime - startTime, "ms");
      // Clean up
      creator.dispose();

      return audioBlob;
    } catch (error) {
      console.error("Audio generation failed:", error);
      console.log(error.stack);
      throw new Error("Failed to generate audio: " + error.message);
    }
  }

  /**
   * Combine video with generated audio (browser-based)
   */

  static async combineVideoWithAudio(
    videoFile: File,
    audioBlob: Blob
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL("@/workers/combineVideoWorker.ts", import.meta.url),
        { type: "module" }
      );
      worker.onmessage = (e) => {
        const { success, data, error } = e.data;
        if (success) {
          const resultBlob = new Blob([data], { type: "video/mp4" });
          resolve(resultBlob);
        } else {
          reject(new Error("Failed to combine video with audio: " + error));
        }
        worker.terminate();
      };
      worker.onerror = (err) => {
        reject(new Error("Worker error: " + err.message));
        worker.terminate();
      };
      Promise.all([videoFile.arrayBuffer(), audioBlob.arrayBuffer()])
        .then(([videoBuffer, audioBuffer]) => {
          worker.postMessage({ videoBuffer, audioBuffer });
        })
        .catch(reject);
    });
  }

  /**
   * Download audio as file
   */
  static downloadAudio(audioBlob: Blob, filename: string = "lofi-track.webm") {
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}