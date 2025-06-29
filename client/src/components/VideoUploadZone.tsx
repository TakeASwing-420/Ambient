import { FC, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface VideoUploadZoneProps {
  onFileUpload: (file: File) => void;
  isFileSelected: boolean;
}

const VideoUploadZone: FC<VideoUploadZoneProps> = ({ onFileUpload, isFileSelected }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        onFileUpload(file);
      } else {
        alert('Please upload a video file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragOver 
          ? 'border-primary bg-primary/5' 
          : isFileSelected 
            ? 'border-green-300 bg-green-50/10' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/5'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="space-y-4">
        <div className="flex justify-center">
          <svg 
            className={`w-12 h-12 ${isDragOver ? 'text-primary' : 'text-gray-400'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        
        <div>
          <h3 className="text-lg font-medium purpleTitle mb-2">
            {isFileSelected ? 'Files Selected!' : 'Upload Your Files'}
          </h3>
          <p className="text-gray-500 mb-4">
            {isDragOver 
              ? 'Drop your files here' 
              : 'Drag and drop your files here, or click to browse'
            }
          </p>
          
          <Button className="mb-4 darkBtn">
            Choose Media Files
          </Button>
          
          <div className="text-xs text-gray-400 space-y-1">
            <p>Supported formats: MP4, MOV, AVI, WebM, JPG, JPEG, PNG</p>
            <p>Maximum file size: 100MB</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoUploadZone;