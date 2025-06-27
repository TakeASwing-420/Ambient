// Web Worker for combining video and audio using FFmpeg
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

self.onmessage = async (e) => {
  const { videoBuffer, audioBuffer } = e.data;
  try {
    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    await ffmpeg.writeFile("input.mp4", new Uint8Array(videoBuffer));
    await ffmpeg.writeFile("audio.webm", new Uint8Array(audioBuffer));

    // Step 2: Combine audio.wav and input.mp4
    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-i",
      "audio.webm",
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-shortest",
      "output.mp4",
    ]);

    const fileData = await ffmpeg.readFile("output.mp4");
    self.postMessage({ success: true, data: fileData });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
