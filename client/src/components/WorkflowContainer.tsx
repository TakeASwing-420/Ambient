import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import VideoUploadZone from "./VideoUploadZone";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";
import { useAudioGeneration } from "@/hooks/useAudioGeneration";
import { getVideoDuration, formatDuration } from "@/lib/video";
import { OutputParams } from "@/types";

interface VideoFileInfo {
  file: File;
  name: string;
  size: string;
  duration: string;
  url: string;
}

const WorkflowContainer: FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [videoFile, setVideoFile] = useState<VideoFileInfo | null>(null);
  const [params_res, setResult] = useState<OutputParams | null>(null);
  const { processVideo, isProcessing, result, error, reset } =
    useVideoProcessing();
  console.log("Result for Video inspection:", result);
  const {
    generateAudio,
    isGenerating,
    audioBlob,
    error: audioError,
    downloadAudio,
    reset: resetAudio,
    combinedBlob,
  } = useAudioGeneration();

  const handleFileUpload = async (file: File) => {
    try {
      const duration = await getVideoDuration(file);
      const url = URL.createObjectURL(file);
      setVideoFile({
        file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
        duration: formatDuration(duration),
        url,
      });
      setCurrentStep(2);
    } catch (error) {
      console.error("Error getting video duration:", error);
      setVideoFile({
        file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
        duration: "0:00",
        url: URL.createObjectURL(file),
      });
      setCurrentStep(2);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleGenerateLofi = async () => {
    if (!videoFile) return;

    try {
      const output = await processVideo(videoFile.file);
      setResult(output);
      console.log("Video processed successfully:", output);
      setCurrentStep(3);
    } catch (err) {
      console.error("Error processing video:", err);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setVideoFile(null);
    reset();
    resetAudio();
  };

  function handleDownloadVideo(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): void {
    if (!combinedBlob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(combinedBlob);
    link.download = videoFile?.name
      ? videoFile.name.replace(/\.[^/.]+$/, "") + "_lofi.mp4"
      : "lofi_video.mp4";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  // Audio generation happens client-side

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto card">
      {/* Step 1: Upload Video */}
      {currentStep === 1 && (
        <div className="p-6">
          <h3 className="font-poppins font-semibold text-xl mb-4">
            Upload Your Video
          </h3>

          <VideoUploadZone
            onFileUpload={handleFileUpload}
            isFileSelected={!!videoFile}
          />
        </div>
      )}

      {/* Step 2: Preview and Generate */}
      {currentStep === 2 && videoFile && (
        <div className="p-6">
          <h3 className="font-poppins font-semibold text-xl mb-4">
            Generate LoFi Video
          </h3>

          <div className="mb-6">
            <div className="bg-purple-50 rounded-lg p-4 mb-4 card2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{videoFile.name}</h4>
                  <p className="text-sm subText">
                    {videoFile.size} • {videoFile.duration}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="lightBtn"
                  onClick={() => setCurrentStep(1)}
                >
                  Change Video
                </Button>
              </div>
            </div>

            <video
              src={videoFile.url}
              controls
              className="w-full rounded-lg shadow-sm"
              style={{ maxHeight: "300px" }}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 card2">
            <h4 className="font-medium purpleTitle mb-2">How it works:</h4>
            <ul className="text-sm navLink space-y-1">
              <li>• AI analyzes your video's visual content and mood</li>
              <li>
                • Generates custom lofi music parameters (key, tempo, energy)
              </li>
              <li>• Creates and overlays the perfect lofi soundtrack</li>
              <li>• Produces a new video with the generated music</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="lightBtn"
            >
              Back
            </Button>
            <Button
              onClick={handleGenerateLofi}
              disabled={isProcessing}
              className="darkBtn"
            >
              {isProcessing ? "Processing Video..." : "Generate LoFi Video"}
            </Button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="p-6">
          <div className="text-center py-10">
            <div className="inline-block mb-6 relative">
              <div className="w-20 h-20 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            </div>
            <h3 className="font-poppins font-semibold text-xl mb-2">
              Creating Your LoFi Video
            </h3>
            <p className="subText max-w-md mx-auto mb-4">
              Our AI is analyzing your video and generating the perfect lofi
              soundtrack. This might take a few minutes...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">Processing Error</h4>
            <p className="text-red-700 text-sm">{error}</p>
            <Button
              onClick={handleStartOver}
              variant="outline"
              className="mt-4 darkBtn"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {currentStep === 3 && params_res && (
        <div className="p-6">
          {combinedBlob && (
            <h3 className="font-poppins font-semibold text-xl mb-4">
              Your LoFi Video is Ready!
            </h3>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {combinedBlob && (
              <div>
                <h4 className="font-medium mb-3">Processed Video</h4>
                <video
                  src={URL.createObjectURL(combinedBlob)}
                  controls
                  className="w-full rounded-lg shadow-sm"
                  style={{ maxHeight: "300px" }}
                />
              </div>
            )}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Music Parameters</h4>
                <div className="bg-white p-4 rounded-lg border text-sm card2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>Key: {params_res?.key || "C"}</div>
                    <div>BPM: {params_res?.bpm || "85"}</div>
                    <div>
                      Energy: {((params_res?.energy || 0.5) * 100).toFixed(0)}%
                    </div>
                    <div>
                      Valence: {((params_res?.valence || 0.5) * 100).toFixed(0)}
                      %
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio Generation Controls */}
              <div className="bg-gray-50 p-4 rounded-lg card2">
                <h4 className="font-medium mb-3">Generate Lofi Video</h4>

                <div className="flex gap-3">
                  <Button
                    onClick={() => generateAudio(params_res, videoFile.file)}
                    disabled={isGenerating}
                    className="flex-1 darkBtn"
                  >
                    {isGenerating ? "Generating Audio..." : "Generate Video"}
                  </Button>

                  {audioBlob && (
                    <Button
                      onClick={() => downloadAudio()}
                      variant="outline"
                      className="lightBtn"
                    >
                      Download Audio
                    </Button>
                  )}
                </div>

                {audioError && (
                  <p className="text-red-500 text-sm mt-2">{audioError}</p>
                )}

                {audioBlob && (
                  <p className="text-green-600 text-sm mt-2">
                    Audio generated successfully! Click download to save.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleStartOver}
              className="lightBtn"
            >
              Create Another
            </Button>

             <Button className="darkBtn">Add to Playlist</Button>

            {combinedBlob && (
              <Button onClick={handleDownloadVideo} className="darkBtn">
                Download Video
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowContainer;
