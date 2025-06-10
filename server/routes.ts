import { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import { storage } from "./storage";
import { processVideoWithAI } from "./videoProcessor";
// Define OutputParams interface locally
interface OutputParams {
  title: string;
  key: number;
  mode: number;
  bpm: number;
  energy: number;
  valence: number;
  swing: number;
  chords: number[];
  melodies: number[][];
}

// Generate simple lofi audio buffer (placeholder for now)
async function generateLofiAudio(params: OutputParams): Promise<Buffer> {
  // Create a simple audio buffer with lofi characteristics
  const duration = 30; // 30 seconds
  const sampleRate = 44100;
  const channels = 2;
  const samples = duration * sampleRate * channels;
  
  // Generate simple waveform based on parameters
  const audioData = new Array(samples);
  const frequency = 261.63 * Math.pow(2, (params.key - 1) / 12); // C4 + key offset
  
  for (let i = 0; i < samples; i += channels) {
    const time = i / (sampleRate * channels);
    const wave = Math.sin(2 * Math.PI * frequency * time) * params.energy;
    audioData[i] = wave * 0.3; // Left channel
    audioData[i + 1] = wave * 0.3; // Right channel
  }
  
  // Convert to buffer (simplified MP3-like format)
  return Buffer.from(audioData.map(sample => Math.floor((sample + 1) * 127.5)));
}

const uploadsDir = path.join(process.cwd(), 'temp');

// Ensure uploads directory exists
fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});

const upload = multer({
  dest: 'temp/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Express> {
  // Video upload and processing endpoint
  app.post("/api/process-video", upload.single('video'), async (req: Request, res: Response) => {
    try {
      console.log('Processing video upload...');
      
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ 
          success: false, 
          error: 'No video file uploaded' 
        });
      }

      const videoPath = req.file.path;
      console.log(`Video uploaded to: ${videoPath}`);
      
      // Check if file exists
      try {
        await fs.access(videoPath);
        console.log('Video file confirmed to exist');
      } catch (fileError) {
        console.error('Video file not found:', fileError);
        return res.status(500).json({
          success: false,
          error: 'Uploaded file not found'
        });
      }
      
      // Process video with AI model
      console.log('Starting AI processing...');
      const result = await processVideoWithAI(videoPath);
      console.log('AI processing result:', result);
      
      if (!result.success) {
        console.error('AI processing failed:', result.error);
        return res.status(500).json({
          success: false,
          error: result.error || 'Video processing failed'
        });
      }

      console.log('AI processing successful, data:', result.data);

      // Store video upload record
      const videoUpload = await storage.createVideoUpload({
        originalFilename: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        storageKey: path.basename(videoPath)
      });

      console.log('Video upload record created:', videoUpload.id);

      // Generate lofi audio based on AI parameters
      console.log('Generating lofi audio...');
      const audioBuffer = await generateLofiAudio(result.data);
      
      // Save generated audio file
      const audioFilename = `lofi_${Date.now()}.mp3`;
      const audioPath = path.join(uploadsDir, audioFilename);
      await fs.writeFile(audioPath, audioBuffer);
      console.log('Audio file saved:', audioPath);

      // Store lofi video record
      const lofiVideo = await storage.createLofiVideo({
        sourceVideoId: videoUpload.id,
        filename: audioFilename,
        storageKey: audioFilename,
        musicParameters: result.data
      });

      console.log('Lofi video record created:', lofiVideo.id);

      // Return success response
      res.json({
        success: true,
        message: 'Video processed successfully',
        data: result.data,
        videoId: lofiVideo.id
      });

    } catch (error) {
      console.error('Video processing error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Endpoint to serve generated videos
  app.get("/api/video/:id", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const lofiVideo = await storage.getLofiVideo(videoId);

      if (!lofiVideo) {
        return res.status(404).json({ error: "Video not found" });
      }

      const videoPath = path.join('temp', lofiVideo.storageKey);
      
      // Check if file exists
      try {
        await fs.access(videoPath);
      } catch {
        return res.status(404).json({ error: "Video file not found" });
      }

      // Get video stats for proper headers
      const stats = await fs.stat(videoPath);
      
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', stats.size);
      
      // Stream the video file
      const stream = require('fs').createReadStream(videoPath);
      stream.pipe(res);

    } catch (error) {
      console.error('Video serving error:', error);
      res.status(500).json({ error: "Failed to serve video" });
    }
  });

  // Endpoint to download generated videos
  app.get("/api/download/:id", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const lofiVideo = await storage.getLofiVideo(videoId);

      if (!lofiVideo) {
        return res.status(404).json({ error: "Video not found" });
      }

      const videoPath = path.join('temp', lofiVideo.storageKey);
      
      // Check if file exists
      try {
        await fs.access(videoPath);
      } catch {
        return res.status(404).json({ error: "Video file not found" });
      }

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${lofiVideo.filename}"`);

      // Stream the video file for download
      const stream = require('fs').createReadStream(videoPath);
      stream.pipe(res);

    } catch (error) {
      console.error('Video download error:', error);
      res.status(500).json({ error: "Failed to download video" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return app;
}