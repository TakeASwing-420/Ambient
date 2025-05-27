import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { LofiParameters, AudioFile } from '@/types';

interface ParameterControlsProps {
  parameters: LofiParameters;
  audioFile: AudioFile;
  onParameterChange: (param: keyof LofiParameters, value: any) => void;
  onRemoveFile: () => void;
}

const ParameterControls: FC<ParameterControlsProps> = ({ 
  parameters, 
  audioFile, 
  onParameterChange, 
  onRemoveFile 
}) => {
  const formatFileSize = (sizeInBytes: number): string => {
    const mb = sizeInBytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleSliderChange = (param: keyof LofiParameters, values: number[]) => {
    if (values.length > 0) {
      onParameterChange(param, values[0]);
    }
  };

  const handleMoodSelect = (mood: 'relaxed' | 'focus' | 'sleep') => {
    onParameterChange('mood', mood);
  };

  return (
    <div className="space-y-6 mb-8 bg-white p-4 rounded-lg shadow-lg h-full">
      {/* File Info */}
      <div className="bg-white rounded-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-primary mr-3" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
          <div>
            <p className="font-medium">{audioFile.name}</p>
            <p className="text-sm text-gray-500">{formatFileSize(audioFile.file.size)} • {audioFile.duration}</p>
          </div>
        </div>
        <button 
          className="text-gray-400 hover:text-error"
          onClick={onRemoveFile}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Sliders */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="font-medium text-gray-700">Chill Level</label>
          <span className="text-gray-500">{parameters.chillLevel}%</span>
        </div>
        <Slider 
          defaultValue={[parameters.chillLevel]} 
          max={100} 
          step={1}
          className="w-full"
          onValueChange={(values) => handleSliderChange('chillLevel', values)}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Subtle</span>
          <span>Dreamy</span>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between mb-2">
          <label className="font-medium text-gray-700">Beat Intensity</label>
          <span className="text-gray-500">{parameters.beatIntensity}%</span>
        </div>
        <Slider 
          defaultValue={[parameters.beatIntensity]} 
          max={100} 
          step={1}
          className="w-full"
          onValueChange={(values) => handleSliderChange('beatIntensity', values)}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Mellow</span>
          <span>Punchy</span>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between mb-2">
          <label className="font-medium text-gray-700">Vintage Effect</label>
          <span className="text-gray-500">{parameters.vintageEffect}%</span>
        </div>
        <Slider 
          defaultValue={[parameters.vintageEffect]} 
          max={100} 
          step={1}
          className="w-full"
          onValueChange={(values) => handleSliderChange('vintageEffect', values)}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Clean</span>
          <span>Nostalgic</span>
        </div>
      </div>
      
      <div>
        <label className="font-medium text-gray-700 mb-2 block">Mood</label>
        <div className="grid grid-cols-3 gap-2">
          <Button 
            type="button"
            variant={parameters.mood === 'relaxed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleMoodSelect('relaxed')}
            className={parameters.mood === 'relaxed' ? 'bg-primary text-white' : ''}
          >
            Relaxed
          </Button>
          <Button 
            type="button"
            variant={parameters.mood === 'focus' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleMoodSelect('focus')}
            className={parameters.mood === 'focus' ? 'bg-primary text-white' : ''}
          >
            Focus
          </Button>
          <Button 
            type="button"
            variant={parameters.mood === 'sleep' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleMoodSelect('sleep')}
            className={parameters.mood === 'sleep' ? 'bg-primary text-white' : ''}
          >
            Sleep
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ParameterControls;
