import { useState, useCallback } from 'react';
import { OutputParams } from '@/types';
import { AudioGenerator } from '@/lib/music/audioGenerator';

export interface AudioGenerationState {
  isGenerating: boolean;
  progress: number;
  error: string | null;
  audioBlob: Blob | null;
  combinedBlob: Blob | null;
}

export const useAudioGeneration = () => {
  const [state, setState] = useState<AudioGenerationState>({
    isGenerating: false,
    progress: 0,
    error: null,
    audioBlob: null,
    combinedBlob: null
  });

  const generateAudio = useCallback(async (params: OutputParams, videoFile: File) => {
    setState({
      isGenerating: true,
      progress: 0,
      error: null,
      audioBlob: null,
      combinedBlob: null
    });

    try {
      // Simulate progress updates
      setState(prev => ({ ...prev, progress: 25 }));
      
      const audioBlob = await AudioGenerator.generateAudio(params);
      const combinedBlob = await AudioGenerator.combineVideoWithAudio(videoFile, audioBlob);

      setState(prev => ({ ...prev, progress: 100 }));
      
      setState({
        isGenerating: false,
        progress: 100,
        error: null,
        audioBlob,
        combinedBlob
      });

      return [audioBlob, combinedBlob];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Audio generation failed';
      setState({
        isGenerating: false,
        progress: 0,
        error: errorMessage,
        audioBlob: null,
        combinedBlob: null
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
      audioBlob: null,
      combinedBlob: null
    });
  }, []);

  return {
    ...state,
    generateAudio,
    downloadAudio,
    reset
  };
};