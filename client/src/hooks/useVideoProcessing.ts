import { useState } from "react";
import { decode } from "@/lib/videoProcessor";
import { storage } from "@/lib/storage";
import { OutputParams } from "@/types";

interface VideoProcessingResult {
  success: boolean;
  videoId: number;
  videoPath: string;
  message: string;
}

interface UseVideoProcessingReturn {
  processVideo: (file: File) => Promise<OutputParams>;
  isProcessing: boolean;
  result: VideoProcessingResult | null;
  error: string | null;
  reset: () => void;
}

export const useVideoProcessing = (): UseVideoProcessingReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VideoProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processVideo = async (file: File): Promise<OutputParams> => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const result = await decode(file);
      if (!result) {
        throw new Error("Failed to process video");
      } else {
        const videoPath = file.webkitRelativePath;

        // Store video upload information
        const videoUpload = await storage.createVideoUpload({
          filename: file.name || "uploaded-video",
          originalName: file.name || "video",
          path: videoPath,
          size: file.size,
        });

        const lofiVideo = await storage.createLofiVideo({
          sourceVideoId: videoUpload.id,
          musicParams: JSON.stringify(result),
          outputPath: videoPath,
          title: result.title || "Untitled",
        });
        setResult({
          success: true,
          videoId: lofiVideo.id,
          videoPath: `/api/video/${lofiVideo.id}`,
          message: "Video processed successfully",
        });
        return result;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Video processing error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processVideo,
    isProcessing,
    result,
    error,
    reset: () => {
      setResult(null);
      setError(null);
      setIsProcessing(false);
    },
  };
};
