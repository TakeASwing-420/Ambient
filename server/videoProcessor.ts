import { OutputParams } from '@/types';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { exec } from "child_process";
import util from "util";
export interface VideoProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
}
const execPromise = util.promisify(exec);
export async function processVideoWithAI(videoPath: string): Promise<VideoProcessingResult> {
  const outputPath = path.join(process.cwd(), 'temp', `ai_output_${uuidv4()}.json`);
  
  try {
    // Ensure temp directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Call the AI model subprocess
    const pythonProcess = spawn(
      path.join(process.cwd(), '.venv', 'Scripts', 'python.exe'),
      [
        path.join(process.cwd(), 'ai_model', 'main.py'),
        '--video-path', videoPath,
        '--output-path', outputPath
      ]
    );

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        try {
          if (code === 0) {
            // Read the output file
            const result = await fs.readFile(outputPath, 'utf-8');
            await fs.unlink(outputPath); // Clean up
            
            const parsedResult = JSON.parse(result) as OutputParams;
            resolve({
              success: true,
              data: parsedResult
            });
          } else {
            resolve({
              success: false,
              error: `AI processing failed with code ${code}: ${stderr}`
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: `Error reading AI output: ${error}`
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to start AI process: ${error.message}`
        });
      });
    });
  } catch (error) {
    return {
      success: false,
      error: `Processing error: ${error}`
    };
  }
}

export async function mergeAudioWithVideo(audioPath: string, videoPath: string, outputPath: string): Promise<void> {
  const ffmpegCmd = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -c:v copy -map 0:v:0 -map 1:a:0 -shortest "${outputPath}"`;

  try {
    console.log("Running FFmpeg merge...");
    await execPromise(ffmpegCmd);
    console.log("Merged video saved to:", outputPath);
  } catch (err) {
    console.error("FFmpeg error:", err);
    throw new Error("Failed to merge audio and video");
  }
}
