import { createContext, useContext, ReactNode, useState } from 'react';

export type ActivityEvent = 
  | 'scheduled' 
  | 'transcribing' 
  | 'transcribed' 
  | 'processing' 
  | 'processed' 
  | 'uploading' 
  | 'uploaded';

export interface Activity {
  id: string;
  type: 'meeting' | 'clip' | 'document';
  name: string;
  event: ActivityEvent;
  platform?: string;
  timestamp: string;
}

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Activity) => void;
  clearActivities: () => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  const addActivity = (activity: Activity) => {
    setActivities(prev => [activity, ...prev].slice(0, 50)); // Mantener solo las últimas 50 actividades
  };

  const clearActivities = () => {
    setActivities([]);
  };

  return (
    <ActivityContext.Provider value={{
      activities,
      addActivity,
      clearActivities,
    }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
} 