import { FC, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, Volume2, Download } from 'lucide-react';
import * as Tone from 'tone';
import { Producer } from '@/lib/music/producer';
import { Track } from '@/lib/music/track';
import { OutputParams } from '@/types';

interface MusicPlayerProps {
  musicParameters: OutputParams;
  videoId: number;
  originalFileName: string;
}

const MusicPlayer: FC<MusicPlayerProps> = ({ musicParameters, videoId, originalFileName }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [track, setTrack] = useState<Track | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializePlayer();
    return () => {
      cleanup();
    };
  }, [musicParameters]);

  const initializePlayer = async () => {
    try {
      setIsLoading(true);
      
      // Initialize Tone.js context
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Create track from music parameters
      const producer = new Producer(musicParameters);
      const generatedTrack = producer.produce();
      
      setTrack(generatedTrack);
      setDuration(generatedTrack.length);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing player:', error);
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
  };

  const handlePlayPause = async () => {
    if (!track) return;

    try {
      if (isPlaying) {
        Tone.Transport.pause();
        setIsPlaying(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } else {
        Tone.Transport.start();
        setIsPlaying(true);
        
        // Start time tracking
        intervalRef.current = setInterval(() => {
          if (Tone.Transport.state === 'started') {
            const time = Tone.Transport.seconds;
            setCurrentTime(time);
            
            if (time >= duration) {
              setIsPlaying(false);
              setCurrentTime(0);
              Tone.Transport.stop();
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error playing/pausing:', error);
    }
  };

  const handleSeek = (newTime: number) => {
    Tone.Transport.seconds = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    Tone.Destination.volume.value = Tone.gainToDb(newVolume);
  };

  const handleDownload = async () => {
    if (!track) return;
    
    try {
      // Create download link for the generated track
      const response = await fetch(`/api/download/${videoId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lofi_${originalFileName}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading track:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Track Info */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {track?.title || 'Generated LoFi Track'}
        </h3>
        <div className="text-sm text-gray-600">
          <span className="mx-2">•</span>
          <span>{track?.bpm} BPM</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div 
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            handleSeek(percent * duration);
          }}
        >
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <Button variant="ghost" size="sm" disabled>
          <SkipBack className="w-4 h-4" />
        </Button>
        
        <Button 
          onClick={handlePlayPause}
          disabled={isLoading}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </Button>
        
        <Button variant="ghost" size="sm" disabled>
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-3 mb-4">
        <Volume2 className="w-4 h-4 text-gray-600" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Download Button */}
      <Button 
        onClick={handleDownload}
        variant="outline" 
        className="w-full"
      >
        <Download className="w-4 h-4 mr-2" />
        Download LoFi Track
      </Button>

      {/* Music Parameters Display */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Parameters</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>Energy: {(musicParameters.energy * 100).toFixed(0)}%</div>
          <div>Valence: {(musicParameters.valence * 100).toFixed(0)}%</div>
          <div>Swing: {(musicParameters.swing * 100).toFixed(0)}%</div>
          <div>Chords: {musicParameters.chords.join('-')}</div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;