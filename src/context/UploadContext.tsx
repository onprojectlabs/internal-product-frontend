import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useMeetings } from './MeetingsContext'

interface Upload {
  id: string;
  name: string;
  type: 'clip' | 'file';
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  url?: string;
  metadata?: {
    duration?: number;
  };
}

interface UploadContextType {
  uploads: Upload[];
  addUpload: (upload: Upload) => void;
  updateUpload: (id: string, updates: Partial<Upload>) => void;
  removeUpload: (id: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined)

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const { addMeeting, updateMeeting } = useMeetings();

  const addUpload = (upload: Upload) => {
    setUploads(prev => [...prev, upload]);
  };

  const updateUpload = (id: string, updates: Partial<Upload>) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === id ? { ...upload, ...updates } : upload
      )
    );
  };

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  };

  const handleFileUpload = async (file: File) => {
    const uploadId = crypto.randomUUID();
    // ... resto del código ...
  };

  const updateProgress = (uploadId: string, progress: number) => {
    // ... código existente ...
    if (progress === 100) {
      updateMeeting(uploadId, {
        status: {
          isProcessing: false,
          isFinished: true,
          hasTranscription: true,
          hasSummary: true
        }
      });
    }
  };

  return (
    <UploadContext.Provider value={{ 
      uploads, 
      addUpload, 
      updateUpload, 
      removeUpload
    }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext)
  if (context === undefined) {
    throw new Error('useUpload must be used within a UploadProvider')
  }
  return context
} 