import { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import { storage } from "./storage";
import { processVideoWithAI, combineVideoWithAudio, getVideoDuration } from "./videoProcessor";
// Import types
import { OutputParams } from '../client/src/types';

// Simple audio generation function
async function generateLofiAudio(params: OutputParams): Promise<Buffer> {
  // Generate a simple sine wave audio file as placeholder
  // In a real implementation, this would use Tone.js or similar
  const sampleRate = 44100;
  const duration = 30; // 30 seconds
  const frequency = 220; // A note
  
  const samples = sampleRate * duration;
  const buffer = Buffer.alloc(samples * 2); // 16-bit audio
  
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
    const value = Math.floor(sample * 32767);
    buffer.writeInt16LE(value, i * 2);
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

export async function registerRoutes(app: Express) {
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
      const musicParams = JSON.parse(aiResult.data);
      console.log('Extracted music parameters:', musicParams);

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
}