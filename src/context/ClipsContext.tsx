import { createContext, useContext, ReactNode, useState } from 'react';
import { useLocalStorage } from '../hooks';

export interface ClipStatus {
  isProcessing: boolean;
  hasTranscription: boolean;
  isUploading: boolean;
}

export interface Clip {
  id: string;
  title: string;
  description: string;
  date: Date;
  duration: string;
  folderId?: string;
  meetingId?: string;
  status: ClipStatus;
  thumbnailUrl?: string;
}

interface ClipsContextType {
  clips: Clip[];
  addClip: (clip: Omit<Clip, 'id'>) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  deleteClip: (id: string) => void;
}

const ClipsContext = createContext<ClipsContextType | undefined>(undefined);

export function ClipsProvider({ children }: { children: ReactNode }) {
  const [clips, setClips] = useLocalStorage<Clip[]>('clips', []);

  const addClip = (clip: Omit<Clip, 'id'>) => {
    const newClip = {
      ...clip,
      id: crypto.randomUUID()
    };
    setClips([...clips, newClip]);
  };

  const updateClip = (id: string, updates: Partial<Clip>) => {
    setClips(clips.map(clip => 
      clip.id === id ? { ...clip, ...updates } : clip
    ));
  };

  const deleteClip = (id: string) => {
    setClips(clips.filter(clip => clip.id !== id));
  };

  return (
    <ClipsContext.Provider value={{
      clips,
      addClip,
      updateClip,
      deleteClip
    }}>
      {children}
    </ClipsContext.Provider>
  );
}

export function useClips() {
  const context = useContext(ClipsContext);
  if (context === undefined) {
    throw new Error('useClips must be used within a ClipsProvider');
  }
  return context;
} 