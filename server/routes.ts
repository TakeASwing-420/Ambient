import { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { processVideoWithAI } from "./videoProcessor";
import { storage } from "./storage";

const uploadsDir = path.join(process.cwd(), "temp");
fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});

const upload = multer({
  dest: "temp/",
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

export async function registerRoutes(app: Express): Promise<Express> {

  app.post("/api/process-video", upload.single("video"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No video file uploaded",
        });
      }

      const videoPath = req.file.path;
      const result = await processVideoWithAI(videoPath);

      if (!result.success || !result.data) {
        return res.status(500).json({
          success: false,
          error: result.error || "Video processing failed",
        });
      }

      // Store video upload information  
      const videoUpload = await storage.createVideoUpload({
        filename: req.file.filename || 'uploaded-video',
        originalName: req.file.originalname || 'video',
        path: videoPath,
        mimeType: req.file.mimetype || 'video/mp4',
        size: req.file.size || 0
      });

      const lofiVideo = await storage.createLofiVideo({
        sourceVideoId: videoUpload.id,
        musicParams: JSON.stringify(result.data),
        outputPath: videoPath,
        title: result.data.title || 'Untitled'
      });

      res.json({
        success: true,
        videoId: lofiVideo.id,
        musicParams: result.data,
        videoPath: `/api/video/${videoUpload.id}`,
        message: 'Video processed - audio generation happens in browser'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return app;
}
