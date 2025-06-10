import { useState } from 'react';
import { GeneratedVideo } from '@/types';

interface UseVideoProcessingReturn {
  processVideo: (file: File) => Promise<void>;
  isProcessing: boolean;
  generatedVideo: GeneratedVideo | null;
  error: string | null;
}

export const useVideoProcessing = (): UseVideoProcessingReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processVideo = async (file: File): Promise<void> => {
    setIsProcessing(true);
    setError(null);
    setGeneratedVideo(null);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/process-video', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process video');
      }

      if (result.success) {
        const generatedVideo: GeneratedVideo = {
          url: `/api/video/${result.videoId}`,
          filename: result.filename,
          originalFileName: file.name,
          musicParameters: result.musicParameters,
          videoId: result.videoId
        };
        
        setGeneratedVideo(generatedVideo);
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Video processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processVideo,
    isProcessing,
    generatedVideo,
    error
  };
};