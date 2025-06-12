import { useState, useCallback } from 'react';
import { OutputParams } from '@/types';
import { AudioGenerator } from '@/lib/music/audioGenerator';

export interface AudioGenerationState {
  isGenerating: boolean;
  progress: number;
  error: string | null;
  audioBlob: Blob | null;
}

export const useAudioGeneration = () => {
  const [state, setState] = useState<AudioGenerationState>({
    isGenerating: false,
    progress: 0,
    error: null,
    audioBlob: null
  });

  const generateAudio = useCallback(async (params: OutputParams) => {
    setState({
      isGenerating: true,
      progress: 0,
      error: null,
      audioBlob: null
    });

    try {
      // Simulate progress updates
      setState(prev => ({ ...prev, progress: 25 }));
      
      const audioBlob = await AudioGenerator.generateAudio(params);
      
      setState(prev => ({ ...prev, progress: 100 }));
      
      setState({
        isGenerating: false,
        progress: 100,
        error: null,
        audioBlob
      });

      return audioBlob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Audio generation failed';
      setState({
        isGenerating: false,
        progress: 0,
        error: errorMessage,
        audioBlob: null
      });
      throw error;
    }
  }, []);

  const downloadAudio = useCallback((filename?: string) => {
    if (state.audioBlob) {
      AudioGenerator.downloadAudio(state.audioBlob, filename);
    }
  }, [state.audioBlob]);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      progress: 0,
      error: null,
      audioBlob: null
    });
  }, []);

  return {
    ...state,
    generateAudio,
    downloadAudio,
    reset
  };
};