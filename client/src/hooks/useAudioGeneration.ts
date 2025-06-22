import { useState, useCallback } from 'react';
import { OutputParams } from '@/types';
import { AudioGenerator } from '@/lib/music/audioGenerator';
import { appwriteDatabase } from '@/storage/databaseService';
import { appwriteStorage } from '@/storage/storageService';

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
      // 1. Generate audio
      setState(prev => ({ ...prev, progress: 25 }));
      const audioBlob = await AudioGenerator.generateAudio(params);

      // 2. Combine with video
      setState(prev => ({ ...prev, progress: 50 }));
      const combinedBlob = await AudioGenerator.combineVideoWithAudio(videoFile, audioBlob);

      // 3. Upload audio
      setState(prev => ({ ...prev, progress: 70 }));
      const audioFile = new File([audioBlob], "audio.mp3", { type: "audio/mpeg" });
      const audioUpload = await appwriteStorage(audioFile);
      // const audioUpload = await uploadFileToAppwrite(audioBlob);
      const audioFileId = audioUpload.$id;

      // 4. Upload combined video
      const videoFileWrapped = new File([combinedBlob], "combined.mp4", { type: "video/mp4" });
      const videoUpload = await appwriteStorage(videoFileWrapped);
      // const videoUpload = await uploadFileToAppwrite(combinedBlob);
      const videoFileId = videoUpload.$id;

      // 5. Create track in database
      const dataUpload = await appwriteDatabase(audioFileId, videoFileId);
      const dataField = dataUpload.$id;
      // await appwriteDatabases.createDocument(
      //   import.meta.env.VITE_APPWRITE_DATABASE_ID,
      //   import.meta.env.VITE_APPWRITE_TRACKS_COLLECTION_ID,
      //   ID.unique(),
      //   {
      //     audio: audioFileId,
      //     video: videoFileId
      //   }
      // );

      // 6. Final state + return
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