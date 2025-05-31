import { FC, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import UploadZone from './UploadZone';
import ParameterControls from './ParameterControls';
import AudioPlayer from './AudioPlayer';
import { AudioFile, LofiParameters, GeneratedAudio } from '@/types';
import { useAudioProcessing } from '@/hooks/useAudioProcessing';
import { getAudioDuration } from '@/lib/audio';

const initialParameters: LofiParameters = {
  chillLevel: 70,
  beatIntensity: 50,
  vintageEffect: 30,
  mood: 'relaxed'
};

const WorkflowContainer: FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [parameters, setParameters] = useState<LofiParameters>(initialParameters);
  const { 
    generateLofi, 
    isProcessing, 
    generatedAudio, 
    error 
  } = useAudioProcessing();

  const handleFileUpload = async (file: File) => {
    try {
      const duration = await getAudioDuration(file);
      const url = URL.createObjectURL(file);
      setAudioFile({
        file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        duration: formatDuration(duration),
        url
      });
    } catch (error) {
      console.error('Error getting audio duration:', error);
      // Fallback to a default duration if we can't get it
      setAudioFile({
        file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        duration: '0:00',
        url: URL.createObjectURL(file)
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleParameterChange = (param: keyof LofiParameters, value: any) => {
    setParameters(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const handleRemoveFile = () => {
    setAudioFile(null);
    setCurrentStep(1);
  };

  const handleGenerateLofi = async () => {
    if (!audioFile) return;
    
    try {
      await generateLofi(audioFile.file, parameters);
      setCurrentStep(3);
    } catch (err) {
      console.error('Error generating lofi:', err);
    }
  };

  const handleRegenerateLofi = () => {
    // Instead of regenerating immediately, go back to parameters screen
    setCurrentStep(2);
  };

  const handleDownloadAudio = () => {
    if (!generatedAudio) return;
    
    const link = document.createElement('a');
    link.href = generatedAudio.url;
    link.download = generatedAudio.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setAudioFile(null);
    setParameters(initialParameters);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto h-full card">
      {/* Step 1: Upload Music */}
      {currentStep === 1 && (
        <div className="p-6">
          <h3 className="font-poppins font-semibold text-xl mb-4">Upload Your Music</h3>
          
          <UploadZone onFileUpload={handleFileUpload} isFileSelected={!!audioFile} />
          
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleNextStep}
              disabled={!audioFile}
              className="bg-primary hover:bg-primary/90"
            >
              Next
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
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 2: Adjust Parameters */}
      {currentStep === 2 && audioFile && (
        <div className="p-6">
          <h3 className="font-poppins font-semibold text-xl mb-4">Adjust Parameters</h3>
          
          <ParameterControls 
            parameters={parameters}
            audioFile={audioFile}
            onParameterChange={handleParameterChange}
            onRemoveFile={handleRemoveFile}
          />
          
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline"
              onClick={handlePreviousStep}
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
              className="bg-primary hover:bg-primary/90"
            >
              Generate LoFi
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
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              </div>
            </div>
            <h3 className="font-poppins font-semibold text-xl mb-2">Generating Your LoFi Track</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Our AI is working its magic. This might take a minute or two...
            </p>
          </div>
          
          <div className="waveform-container mt-8 bg-gray-50 rounded-lg h-20">
            {Array.from({ length: 50 }).map((_, i) => (
              <div 
                key={i}
                className="absolute bottom-0 w-[3px] bg-secondary rounded-[1px] opacity-80 animate-[waveform-animation_1.5s_ease-in-out_infinite]"
                style={{
                  left: `${(i / 50) * 100}%`,
                  animationDelay: `${Math.random() * 1.5}s`
                }}
              ></div>
            ))}
          </div>
        </div>
      )}
      
      {/* Step 3: Results */}
      {currentStep === 3 && !isProcessing && generatedAudio && audioFile && (
        <div className="p-6">
          <h3 className="font-poppins font-semibold text-xl mb-4">Your LoFi Transformation</h3>
          
          <AudioPlayer 
            generatedAudio={generatedAudio}
            originalFileName={audioFile.name}
            parameters={parameters}
            onRegenerate={handleRegenerateLofi}
            onDownload={handleDownloadAudio}
            onStartOver={handleStartOver}
          />
        </div>
      )}
    </div>
  );
};

export default WorkflowContainer;
