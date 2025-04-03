import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import { insertAudioUploadSchema, insertLofiTrackSchema } from "@shared/schema";
import { ZodError } from "zod";
import { processAudio } from "./audioProcessor";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only audio files
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3', 'audio/x-m4a', 'audio/aac'];
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload an MP3, WAV, or FLAC file.'));
    }
  }
});

// Create temp directory for file storage if it doesn't exist
const tempDir = path.join(process.cwd(), 'temp');
const ensureTempDir = async () => {
  try {
    await fs.access(tempDir);
  } catch (error) {
    await fs.mkdir(tempDir, { recursive: true });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureTempDir();

  // API route for uploading audio file
  app.post('/api/upload', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'No file uploaded' 
        });
      }

      // Generate a unique filename
      const storageKey = `${randomUUID()}${path.extname(req.file.originalname)}`;
      const filePath = path.join(tempDir, storageKey);

      // Write file to disk
      await fs.writeFile(filePath, req.file.buffer);

      // Create database entry
      const audioUpload = await storage.createAudioUpload({
        originalFilename: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        storageKey
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: audioUpload.id,
          filename: audioUpload.originalFilename,
          size: audioUpload.fileSize
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid upload data',
          errors: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error uploading file',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // API route for generating lofi music
  app.post('/api/generate-lofi', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Parse parameters
      let parameters;
      try {
        parameters = JSON.parse(req.body.parameters);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parameters format'
        });
      }

      // Generate a unique filename for the original upload
      const originalStorageKey = `original_${randomUUID()}${path.extname(req.file.originalname)}`;
      const originalFilePath = path.join(tempDir, originalStorageKey);

      // Write original file to disk
      await fs.writeFile(originalFilePath, req.file.buffer);

      // Create database entry for original file
      const audioUpload = await storage.createAudioUpload({
        originalFilename: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        storageKey: originalStorageKey
      });

      // Process the audio to create lofi version
      const lofiStorageKey = `lofi_${randomUUID()}${path.extname(req.file.originalname)}`;
      const lofiFilePath = path.join(tempDir, lofiStorageKey);

      // Process the audio file
      await processAudio(originalFilePath, lofiFilePath, parameters);

      // Create database entry for lofi track
      const lofiTrack = await storage.createLofiTrack({
        sourceAudioId: audioUpload.id,
        parameters,
        storageKey: lofiStorageKey,
        filename: `lofi_${req.file.originalname}`
      });

      // Return the processed file
      res.status(200).json({
        success: true,
        message: 'Lofi track generated successfully',
        id: lofiTrack.id,
        audioUrl: `/api/audio/${lofiStorageKey}`
      });
    } catch (error) {
      console.error('Error generating lofi:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating lofi track',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // API route for serving audio files
  app.get('/api/audio/:storageKey', async (req, res) => {
    try {
      const { storageKey } = req.params;
      const filePath = path.join(tempDir, storageKey);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'Audio file not found'
        });
      }

      // Determine content type based on file extension
      const ext = path.extname(storageKey).toLowerCase();
      let contentType = 'audio/mpeg'; // Default
      
      if (ext === '.wav') contentType = 'audio/wav';
      else if (ext === '.flac') contentType = 'audio/flac';
      else if (ext === '.m4a') contentType = 'audio/m4a';
      else if (ext === '.aac') contentType = 'audio/aac';

      // Set appropriate headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${storageKey}"`);

      // Stream the file
      const fileStream = fs.readFile(filePath);
      res.send(await fileStream);
    } catch (error) {
      console.error('Error serving audio file:', error);
      res.status(500).json({
        success: false,
        message: 'Error serving audio file',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
