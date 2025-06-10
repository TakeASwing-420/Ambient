import { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import { storage } from "./storage";
import { processVideoWithAI, combineVideoWithAudio, getVideoDuration } from "./videoProcessor";
// Import types
import { OutputParams } from '../client/src/types';

// Generate lofi audio based on video analysis parameters
async function generateLofiAudio(params: OutputParams): Promise<Buffer> {
  // Create a simple lofi audio track based on the parameters
  const sampleRate = 44100;
  const duration = 30; // 30 seconds
  const baseFreq = 220 * Math.pow(2, (params.key - 1) / 12); // Convert key to frequency
  const bpm = params.bpm || 85;
  
  const samples = sampleRate * duration;
  const buffer = Buffer.alloc(samples * 2); // 16-bit audio
  
  for (let i = 0; i < samples; i++) {
    const time = i / sampleRate;
    const beatTime = (time * bpm / 60) % 1;
    
    // Create a simple lofi chord progression
    let frequency = baseFreq;
    if (beatTime < 0.25) frequency = baseFreq;
    else if (beatTime < 0.5) frequency = baseFreq * 1.25; // Perfect fourth
    else if (beatTime < 0.75) frequency = baseFreq * 1.5; // Perfect fifth
    else frequency = baseFreq * 1.33; // Major sixth
    
    // Apply lofi effects: low-pass filter simulation and vinyl noise
    const sample = Math.sin(2 * Math.PI * frequency * time) * params.energy * 0.3;
    const noise = (Math.random() - 0.5) * 0.02 * params.swing;
    const lofiSample = sample + noise;
    
    const value = Math.floor(lofiSample * 32767);
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, value)), i * 2);
  }
  
  return buffer;
}

// Configure multer for video uploads
const upload = multer({
  dest: 'temp/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Express> {
  // Video upload and processing endpoint
  app.post("/api/process-video", upload.single('video'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file uploaded" });
      }

      const videoFile = req.file;
      const originalPath = videoFile.path;
      const videoId = uuidv4();
      const videoStorageKey = `video_${videoId}.${videoFile.originalname?.split('.').pop() || 'mp4'}`;
      const videoPath = path.join('temp', videoStorageKey);

      // Move uploaded file to permanent location
      await fs.rename(originalPath, videoPath);

      // Store video upload info
      const videoUpload = await storage.createVideoUpload({
        originalFilename: videoFile.originalname || 'video.mp4',
        fileSize: videoFile.size,
        mimeType: videoFile.mimetype,
        storageKey: videoStorageKey
      });

      // Process video with AI to extract music parameters
      console.log('Processing video with AI...');
      const aiResult = await processVideoWithAI(videoPath);

      if (!aiResult.success) {
        return res.status(422).json({ 
          error: aiResult.error || "Failed to process video with AI"
        });
      }

      // Parse the music parameters
      const rawMusicParams = JSON.parse(aiResult.data);
      console.log('Extracted music parameters:', rawMusicParams);
      
      // Ensure the parameters match the expected schema
      const musicParams = {
        title: rawMusicParams.title || undefined,
        key: Number(rawMusicParams.key) || 1,
        mode: Number(rawMusicParams.mode) || 1,
        bpm: Number(rawMusicParams.bpm) || 85,
        energy: Number(rawMusicParams.energy) || 0.5,
        valence: Number(rawMusicParams.valence) || 0.5,
        swing: Number(rawMusicParams.swing) || 0.5,
        chords: Array.isArray(rawMusicParams.chords) ? rawMusicParams.chords : [],
        melodies: Array.isArray(rawMusicParams.melodies) ? rawMusicParams.melodies : []
      };

      // Generate audio using the music parameters
      console.log('Generating lofi music...');
      const audioBuffer = await generateLofiAudio(musicParams);

      const audioId = uuidv4();
      const audioPath = path.join('temp', `audio_${audioId}.raw`);
      await fs.writeFile(audioPath, audioBuffer);

      // Combine video with generated audio
      console.log('Combining video with lofi music...');
      const outputVideoId = uuidv4();
      const outputVideoPath = path.join('temp', `lofi_video_${outputVideoId}.mp4`);
      
      const combineSuccess = await combineVideoWithAudio(videoPath, audioPath, outputVideoPath);

      if (!combineSuccess) {
        return res.status(500).json({ error: "Failed to combine video with audio" });
      }

      // Store the generated lofi video
      const lofiVideo = await storage.createLofiVideo({
        sourceVideoId: videoUpload.id,
        musicParameters: musicParams,
        storageKey: `lofi_video_${outputVideoId}.mp4`,
        filename: `lofi_${videoFile.originalname || 'video.mp4'}`
      });

      // Clean up temporary files
      try {
        await fs.unlink(audioPath);
      } catch (error) {
        console.warn('Failed to cleanup audio file:', error);
      }

      res.json({
        success: true,
        videoId: lofiVideo.id,
        filename: lofiVideo.filename,
        musicParameters: musicParams
      });

    } catch (error) {
      console.error('Video processing error:', error);
      res.status(500).json({ 
        error: "Internal server error during video processing"
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
      res.setHeader('Content-Disposition', `inline; filename="${lofiVideo.filename}"`);

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