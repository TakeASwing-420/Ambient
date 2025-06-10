import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface VideoProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function processVideoWithAI(videoPath: string): Promise<VideoProcessingResult> {
  const outputPath = path.join(process.cwd(), 'temp', `ai_output_${uuidv4()}.json`);
  
  try {
    // Ensure temp directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Call the AI model subprocess
    const pythonProcess = spawn('python3', [
      path.join(process.cwd(), 'ai_model', 'simple_processor.py'),
      '--video-path', videoPath,
      '--output-path', outputPath
    ]);

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
            
            const parsedResult = JSON.parse(result);
            resolve(parsedResult);
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

export async function combineVideoWithAudio(videoPath: string, audioPath: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpegProcess = spawn('ffmpeg', [
      '-i', videoPath,
      '-i', audioPath,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-shortest',
      '-y',
      outputPath
    ]);

    ffmpegProcess.on('close', (code) => {
      resolve(code === 0);
    });

    ffmpegProcess.on('error', (error) => {
      console.error('FFmpeg error:', error);
      resolve(false);
    });
  });
}

export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobeProcess = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      videoPath
    ]);

    let output = '';
    ffprobeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobeProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const metadata = JSON.parse(output);
          const duration = parseFloat(metadata.format.duration);
          resolve(duration);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Failed to get video duration'));
      }
    });
  });
}