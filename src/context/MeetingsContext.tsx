import { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface Meeting {
  id: string;
  title: string;
  platform: "zoom" | "meet" | "teams";
  status: "scheduled" | "completed" | "transcribing" | "transcribed" | "summarizing" | "processing" | "processed";
  duration: string;
  date: Date;
  participants: string[];
  summary?: string;
  transcription?: string;
  highlights?: string[];
  pendingQuestions?: string[];
  folderId?: string;
}

interface MeetingsContextType {
  meetings: Meeting[];
  setMeetings: (meetings: Meeting[]) => void;
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
}

const MeetingsContext = createContext<MeetingsContextType | undefined>(undefined);

// Función auxiliar para transformar las fechas al guardar
const serializeDates = (meetings: Meeting[]): any[] => {
  return meetings.map(meeting => ({
    ...meeting,
    date: meeting.date.toISOString() // Convertir Date a string ISO
  }));
};

// Función auxiliar para transformar las fechas al cargar
const deserializeDates = (meetings: any[]): Meeting[] => {
  return meetings.map(meeting => ({
    ...meeting,
    date: new Date(meeting.date) // Convertir string ISO a Date
  }));
};

export function MeetingsProvider({ children }: { children: ReactNode }) {
  console.log('[MeetingsProvider] Inicializando provider');
  
  const [meetings, setMeetings] = useLocalStorage<Meeting[]>('meetings', [], {
    serialize: (value) => {
      const serialized = JSON.stringify(serializeDates(value));
      console.log('[MeetingsProvider] Guardando en localStorage:', serialized);
      return serialized;
    },
    deserialize: (value) => {
      try {
        console.log('[MeetingsProvider] Recuperando de localStorage:', value);
        const parsed = JSON.parse(value);
        const transformed = deserializeDates(parsed);
        console.log('[MeetingsProvider] Datos transformados:', transformed);
        return transformed;
      } catch (error) {
        console.error('[MeetingsProvider] Error al deserializar:', error);
        return [];
      }
    },
  });

  const addMeeting = (meeting: Meeting) => {
    console.log('Añadiendo nueva reunión:', meeting);
    setMeetings(prevMeetings => {
      const newMeetings = [...prevMeetings, meeting];
      console.log('Nuevo estado de reuniones:', newMeetings);
      return newMeetings;
    });
  };

  const updateMeeting = (id: string, updates: Partial<Meeting>) => {
    setMeetings(meetings.map(meeting => 
      meeting.id === id ? { ...meeting, ...updates } : meeting
    ));
  };

  return (
    <MeetingsContext.Provider value={{ 
      meetings, 
      setMeetings, 
      addMeeting,
      updateMeeting
    }}>
      {children}
    </MeetingsContext.Provider>
  );
}

export function useMeetings() {
  const context = useContext(MeetingsContext);
  if (context === undefined) {
    throw new Error('useMeetings must be used within a MeetingsProvider');
  }
  return context;
} 