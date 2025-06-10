import { OutputParams } from './params';

/**
 * Uploads a video file to the Flask API and returns decoded output.
 * @param videoFile The File object from a file input element.
 */
export const decode = async (videoFile: File): Promise<OutputParams> => {
  const formData = new FormData();
  formData.append('video', videoFile);

  try {
    const response = await fetch('/api/process-video', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', response.status, errorText);
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('Processing failed:', result.error);
      throw new Error(result.error || 'Processing failed');
    }

    console.log('Processing successful:', result.data);
    return result.data;
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process video');
  }
};
