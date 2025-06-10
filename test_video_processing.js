const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const upload = multer({ dest: 'temp/' });

app.post('/api/process-video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const videoPath = req.file.path;
    const outputPath = path.join('temp', `output_${Date.now()}.json`);

    // Process video with AI
    const pythonProcess = spawn('python3', [
      'ai_model/main.py',
      '--video-path', videoPath,
      '--output-path', outputPath
    ]);

    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        try {
          const result = await fs.readFile(outputPath, 'utf-8');
          const parsedResult = JSON.parse(result);
          
          // Clean up files
          await fs.unlink(videoPath).catch(() => {});
          await fs.unlink(outputPath).catch(() => {});
          
          res.json({
            success: true,
            message: 'Video processed successfully',
            data: parsedResult.data
          });
        } catch (error) {
          res.status(500).json({ error: 'Failed to read AI output' });
        }
      } else {
        res.status(500).json({ error: 'AI processing failed' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Processing error: ' + error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const port = 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on http://0.0.0.0:${port}`);
});