import { FC, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GeneratedAudio, LofiParameters } from '@/types';
import { renderWaveform } from '@/lib/waveform';

interface AudioPlayerProps {
  generatedAudio: GeneratedAudio;
  originalFileName: string;
  parameters: LofiParameters;
  onRegenerate: () => void;
  onDownload: () => void;
  onStartOver: () => void;
}

const AudioPlayer: FC<AudioPlayerProps> = ({
  generatedAudio,
  originalFileName,
  parameters,
  onRegenerate,
  onDownload,
  onStartOver
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (waveformRef.current) {
      renderWaveform(waveformRef.current);
    }
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <audio ref={audioRef} src={generatedAudio.url} preload="metadata" />

      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-lg p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="font-semibold text-lg">LoFi version</h4>
            <p className="text-white text-opacity-80 text-sm">
              {originalFileName} (LoFi Remix)
            </p>
          </div>
          <div>
            <span className="text-sm font-medium bg-white bg-opacity-20 px-2 py-1 rounded">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 inline mr-1" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{generatedAudio.duration}</span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-center mb-6">
          <button 
            className="bg-white text-primary rounded-full w-14 h-14 flex items-center justify-center hover:bg-opacity-90 transition-colors shadow-lg"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm">{formatTime(currentTime)}</span>
          <div className="flex-1 h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
            <div 
              ref={progressRef}
              className="h-full bg-white" 
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div>
          <span className="text-sm">{formatTime(duration)}</span>
        </div>
      </div>
      
      <div className="bg-gray-50 px-6 py-4 border-b rounded-b-lg">
        <div ref={waveformRef} className="h-20 w-full relative">
          {/* Waveform will be rendered here */}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
        <Button 
          variant="outline"
          className="flex-1 text-gray-800"
          onClick={onRegenerate}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
          </svg>
          Regenerate
        </Button>
        <Button 
          variant="default"
          className="flex-1 bg-success hover:bg-success/90"
          onClick={onDownload}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download
        </Button>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-700 mb-3">Parameters Used</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-500">Chill Level</p>
            <p className="font-medium">{parameters.chillLevel}%</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-500">Beat Intensity</p>
            <p className="font-medium">{parameters.beatIntensity}%</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-500">Vintage Effect</p>
            <p className="font-medium">{parameters.vintageEffect}%</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-500">Mood</p>
            <p className="font-medium">{parameters.mood.charAt(0).toUpperCase() + parameters.mood.slice(1)}</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        <Button 
          variant="link"
          className="text-primary hover:text-primary-dark"
          onClick={onStartOver}
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
          Start Over
        </Button>
      </div>
    </div>
  );
};

export default AudioPlayer;
