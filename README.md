# VideoLofi - AI Video to LoFi Music Transformer

Transform your videos with AI-generated lofi soundtracks. Upload a video, let AI analyze its content and mood, then download a new video with a custom lofi music track.

## Features

- **AI Video Analysis**: Advanced computer vision analyzes video content, lighting, and mood
- **Custom Music Generation**: Creates lofi music parameters (key, tempo, energy) based on video analysis  
- **Automatic Processing**: Complete pipeline from video upload to final output
- **Multiple Formats**: Supports MP4, MOV, AVI, WebM video files up to 100MB

## Project Structure

```
├── ai_model/              # AI video analysis and music parameter generation
│   ├── main.py           # Main processing script with argparse interface
│   ├── output.py         # Output parameter formatting
│   └── videoprocessor.py # Video analysis using computer vision
├── client/               # React frontend application
│   └── src/
│       ├── components/   # UI components for video upload and processing
│       ├── hooks/        # React hooks for video processing
│       ├── lib/          # Utilities and API client
│       └── pages/        # Application pages
├── server/               # Express.js backend
│   ├── index.ts         # Main server setup
│   ├── routes.ts        # API endpoints for video processing
│   ├── storage.ts       # In-memory data storage
│   └── videoProcessor.ts # Video processing coordination
└── shared/              # Shared TypeScript types and schemas
```

## How It Works

1. **Upload**: User uploads a video file through the web interface
2. **Analysis**: AI analyzes video content using computer vision techniques
3. **Generation**: System generates lofi music parameters (key, BPM, energy, mood)
4. **Synthesis**: Creates lofi audio track based on generated parameters
5. **Combination**: Combines original video with new lofi soundtrack using FFmpeg
6. **Download**: User receives the final video with custom lofi music

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **AI Processing**: Python with computer vision libraries
- **Video Processing**: FFmpeg for audio/video combination
- **Storage**: In-memory storage for development

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5000 to access the application

## API Endpoints

- `POST /api/process-video` - Upload and process video file
- `GET /api/video/:id` - Stream processed video
- `GET /api/download/:id` - Download processed video
- `GET /api/health` - Health check

## Requirements

- Node.js 20+
- Python 3.8+
- FFmpeg (for video processing)
- 100MB max file size for uploads