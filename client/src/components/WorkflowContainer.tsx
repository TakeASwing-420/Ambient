import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import VideoUploadZone from './VideoUploadZone';
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
      // Fallback if we can't get duration
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
              <li>• Our AI analyzes your video content and mood</li>
              <li>• Generates custom lofi music parameters</li>
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
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-1" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
              </svg>
              Back
            </Button>
            <Button 
              onClick={handleGenerateLofi}
              disabled={isProcessing}
              className="bg-primary hover:bg-primary/90"
            >
              {isProcessing ? 'Processing...' : 'Generate LoFi Video'}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 ml-1" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M15 7v10M9 17V7"></path>
              </svg>
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
              <div className="absolute inset-0 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-primary animate-pulse" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21,15 16,10 5,21"></polyline>
                </svg>
              </div>
            </div>
            <h3 className="font-poppins font-semibold text-xl mb-2">Creating Your LoFi Video</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              Our AI is analyzing your video and generating the perfect lofi soundtrack. This might take a few minutes...
            </p>
            
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span>Analyzing video content</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span>Generating lofi music</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span>Combining video with music</span>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Step 3: Results */}
      {currentStep === 3 && !isProcessing && generatedVideo && videoFile && (
        <div className="p-6">
          <h3 className="font-poppins font-semibold text-xl mb-4">Your LoFi Video is Ready!</h3>
          
          <div className="space-y-6">
            {/* Video Player */}
            <div className="bg-gray-50 rounded-lg p-4">
              <video 
                src={generatedVideo.url}
                controls 
                className="w-full rounded-lg shadow-sm"
                style={{ maxHeight: '400px' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* File Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Original Video</h4>
                <p className="text-sm text-gray-600">{videoFile.name}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Generated Video</h4>
                <p className="text-sm text-gray-600">{generatedVideo.filename}</p>
              </div>
            </div>

            {/* Music Parameters Display */}
            {generatedVideo.musicParameters && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Generated Music Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Key:</span>
                    <p className="text-blue-800">{['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][generatedVideo.musicParameters.key % 12]}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">BPM:</span>
                    <p className="text-blue-800">{Math.round(generatedVideo.musicParameters.bpm)}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Energy:</span>
                    <p className="text-blue-800">{Math.round(generatedVideo.musicParameters.energy * 100)}%</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Mood:</span>
                    <p className="text-blue-800">{generatedVideo.musicParameters.valence > 0.5 ? 'Uplifting' : 'Chill'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleDownloadVideo}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-2" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
                </svg>
                Download MP4
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleStartOver}
                className="flex-1 border-gray-300 hover:border-gray-400 text-gray-700"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-2" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"></path>
                  <path d="M3 21v-5h5"></path>
                </svg>
                Create Another
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowContainer;