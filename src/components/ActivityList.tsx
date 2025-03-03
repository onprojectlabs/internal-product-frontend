import { useMemo } from 'react';
import { FileVideo2, Users2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export interface Activity {
  id: string;
  type: 'meeting' | 'clip';
  name: string;
  event: 'scheduled' | 'transcribing' | 'transcribed' | 'uploading' | 'uploaded' | 'processing' | 'processed';
  platform: string;
  timestamp: string;
}

const getEventText = (event: Activity['event']) => {
  switch (event) {
    case 'scheduled':
      return 'Programada';
    case 'transcribing':
      return 'Transcribiendo...';
    case 'transcribed':
      return 'Transcripción completada';
    case 'uploading':
      return 'Subiendo...';
    case 'uploaded':
      return 'Subida completada';
    case 'processing':
      return 'Procesando...';
    case 'processed':
      return 'Procesamiento completado';
  }
};

const getEventBadgeStyle = (event: Activity['event']) => {
  switch (event) {
    case 'scheduled':
      return 'bg-blue-500/10 text-blue-500';
    case 'transcribing':
      return 'bg-yellow-500/10 text-yellow-500';
    case 'transcribed':
      return 'bg-green-500/10 text-green-500';
    case 'uploading':
      return 'bg-blue-500/10 text-blue-500';
    case 'uploaded':
      return 'bg-blue-500/10 text-blue-500';
    case 'processing':
      return 'bg-purple-500/10 text-purple-500';
    case 'processed':
      return 'bg-green-500/10 text-green-500';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
};

interface ActivityListProps {
  activities: Activity[];
  className?: string;
  showEmpty?: boolean;
  maxItems?: number;
  onItemClick?: (activity: Activity) => void;
  emptyMessage?: string;
}

export function ActivityList({ 
  activities, 
  className, 
  showEmpty = false, 
  maxItems, 
  onItemClick,
  emptyMessage = "No hay actividad reciente para mostrar"
}: ActivityListProps) {
  const displayActivities = useMemo(() => {
    return maxItems ? activities.slice(0, maxItems) : activities;
  }, [activities, maxItems]);

  if (showEmpty && displayActivities.length === 0) {
    return (
      <div className={cn("py-8 text-center text-muted-foreground", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {displayActivities.map((activity) => (
        <Link
          to={`/${activity.type}/${activity.id}`}
          key={activity.id}
          onClick={() => onItemClick?.(activity)}
          className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {activity.type === 'clip' ? (
              <FileVideo2 className="h-5 w-5 text-primary" />
            ) : (
              <Users2 className="h-5 w-5 text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-medium truncate">
              {activity.name}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className={cn("px-2 py-0.5 rounded-full text-xs", getEventBadgeStyle(activity.event))}>
                {getEventText(activity.event)}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {activity.platform}
              </span>
            </div>
          </div>

          <time className="text-sm text-muted-foreground whitespace-nowrap">
            {activity.timestamp}
          </time>
        </Link>
      ))}
    </div>
  );
} 