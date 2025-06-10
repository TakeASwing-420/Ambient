import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import VideoUploadZone from './VideoUploadZone';
import MusicPlayer from './MusicPlayer';
import { VideoFile, GeneratedVideo } from '@/types';
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import { getVideoDuration } from '@/lib/video';

const WorkflowContainer: FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const { 
    processVideo, 
    isProcessing, 
    generatedVideo, 
    error 
  } = useVideoProcessing();

  const handleFileUpload = async (file: File) => {
    try {
      const duration = await getVideoDuration(file);
      const url = URL.createObjectURL(file);
      setVideoFile({
        file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        duration: formatDuration(duration),
        url
      });
      setCurrentStep(2);
    } catch (error) {
      console.error('Error getting video duration:', error);
      setVideoFile({
        file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        duration: '0:00',
        url: URL.createObjectURL(file)
      });
      setCurrentStep(2);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleGenerateLofi = async () => {
    if (!videoFile) return;
    
    try {
      await processVideo(videoFile.file);
      setCurrentStep(3);
    } catch (err) {
      console.error('Error processing video:', err);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setVideoFile(null);
  };

  const handleDownloadVideo = () => {
    if (!generatedVideo) return;
    
    const link = document.createElement('a');
    link.href = `/api/download/${generatedVideo.videoId}`;
    link.download = generatedVideo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
      {/* Step 1: Upload Video */}
      {currentStep === 1 && (
        <div className="p-6">
          <h3 className="font-poppins font-semibold text-xl mb-4">Upload Your Video</h3>
          
          <VideoUploadZone onFileUpload={handleFileUpload} isFileSelected={!!videoFile} />
        </div>
      )}
      
      {/* Step 2: Preview and Generate */}
      {currentStep === 2 && videoFile && (
        <div className="p-6">
          <h3 className="font-poppins font-semibold text-xl mb-4">Generate LoFi Video</h3>
          
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{videoFile.name}</h4>
                  <p className="text-sm text-gray-500">{videoFile.size} • {videoFile.duration}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
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
              style={{ maxHeight: '300px' }}
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• AI analyzes your video's visual content and mood</li>
              <li>• Generates custom lofi music parameters (key, tempo, energy)</li>
              <li>• Creates and overlays the perfect lofi soundtrack</li>
              <li>• Produces a new video with the generated music</li>
            </ul>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="border-gray-300 hover:border-gray-400 text-gray-700"
            >
              Back
            </Button>
            <Button 
              onClick={handleGenerateLofi}
              disabled={isProcessing}
              className="bg-primary hover:bg-primary/90"
            >
              {isProcessing ? 'Processing Video...' : 'Generate LoFi Video'}
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
            <h3 className="font-poppins font-semibold text-xl mb-2">Creating Your LoFi Video</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              Our AI is analyzing your video and generating the perfect lofi soundtrack. This might take a few minutes...
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
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 3: Results */}
      {currentStep === 3 && generatedVideo && (
        <div className="p-6">
          <h3 className="font-poppins font-semibold text-xl mb-4">Your LoFi Video is Ready!</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Video Player */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Generated Video</h4>
              <video 
                src={generatedVideo.url} 
                controls 
                className="w-full rounded-lg shadow-sm"
                style={{ maxHeight: '300px' }}
              />
            </div>
            
            {/* Music Player */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Generated Music</h4>
              <MusicPlayer 
                musicParameters={generatedVideo.musicParameters}
                videoId={generatedVideo.videoId}
                originalFileName={videoFile?.name || ''}
              />
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-green-800 mb-2">AI Generated Music Details:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
              <div>Key: {generatedVideo.musicParameters?.key || 'C'}</div>
              <div>BPM: {generatedVideo.musicParameters?.bpm || '85'}</div>
              <div>Energy: {(generatedVideo.musicParameters?.energy * 100)?.toFixed(0) || '50'}%</div>
              <div>Valence: {(generatedVideo.musicParameters?.valence * 100)?.toFixed(0) || '50'}%</div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={handleStartOver}
            >
              Create Another
            </Button>
            <Button 
              onClick={handleDownloadVideo}
              className="bg-primary hover:bg-primary/90"
            >
              Download Video
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowContainer;