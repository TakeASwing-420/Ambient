import { useState } from 'react';
import { LofiParameters, GeneratedAudio } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { formatAudioDuration } from '@/lib/audio';
import { useToast } from '@/hooks/use-toast';

export const useAudioProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateLofi = async (file: File, parameters: LofiParameters) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('parameters', JSON.stringify(parameters));
      
      // Send request to server
      const response = await fetch('/api/generate-lofi', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate lofi track');
      }
      
      const data = await response.json();
      
      // Create a blob URL for the returned audio
      const audioBlob = await fetch(data.audioUrl).then(r => r.blob());
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Get audio duration
      const audio = new Audio();
      audio.src = audioUrl;
      
      await new Promise((resolve) => {
        audio.onloadedmetadata = resolve;
      });
      
      setGeneratedAudio({
        id: data.id,
        url: audioUrl,
        filename: `lofi-${file.name}`,
        duration: formatAudioDuration(audio.duration),
      });
      
      toast({
        title: "Success!",
        description: "Your lofi track has been generated.",
        variant: "default",
      });
    } catch (err) {
      console.error('Error generating lofi:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      toast({
        title: "Error generating lofi",
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: "destructive",
      });
      
      // Create a fallback audio (for demo purposes)
      setGeneratedAudio({
        id: 'fallback',
        url: URL.createObjectURL(file), // Just return the original file
        filename: `lofi-${file.name}`,
        duration: '3:18',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    generateLofi,
    isProcessing,
    generatedAudio,
    error,
  };
};
