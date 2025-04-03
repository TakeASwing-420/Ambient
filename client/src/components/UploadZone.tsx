import { FC, useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  isFileSelected: boolean;
}

const UploadZone: FC<UploadZoneProps> = ({ onFileUpload, isFileSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3', 'audio/x-m4a', 'audio/aac'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP3, WAV, or FLAC file.",
        variant: "destructive"
      });
      return false;
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const processFile = (file: File) => {
    if (validateFile(file)) {
      setUploadSuccess(true);
      onFileUpload(file);
    }
  };

  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div 
      className={`drop-zone border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleFileDrop}
      onClick={handleUploadClick}
    >
      {!uploadSuccess ? (
        <>
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <p className="mb-2 font-medium">Drag & drop your audio file here</p>
          <p className="text-sm text-gray-500 mb-4">or click to browse</p>
          
          <p className="text-xs text-gray-400">Supported formats: MP3, WAV, FLAC (Max 10MB)</p>
        </>
      ) : (
        <>
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="mb-2 font-medium">File uploaded successfully</p>
          <p className="text-sm text-gray-500">Click next to continue</p>
        </>
      )}
      
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept="audio/*"
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default UploadZone;
