import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { GeneratedVideo } from '@/types';

interface VideoPlayerProps {
  generatedVideo: GeneratedVideo;
  originalFileName: string;
  onDownload: () => void;
  onStartOver: () => void;
}

const VideoPlayer: FC<VideoPlayerProps> = ({ 
  generatedVideo, 
  originalFileName, 
  onDownload, 
  onStartOver 
}) => {
  return (
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
          <p className="text-sm text-gray-600">{originalFileName}</p>
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
          onClick={onDownload}
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
          onClick={onStartOver}
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
  );
};

export default VideoPlayer;