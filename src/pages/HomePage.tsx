import { Link } from 'react-router-dom'
import {
  FolderIcon,
  DocumentTextIcon,
  ChartBarIcon,
  VideoCameraIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { ActivityList } from '../components/ActivityList'
import { useEffect, useState } from 'react'
import type { Meeting, Folder } from '../types'
import { meetingsApi } from '../mocks/api/meetings'
import { LoadingState } from '../components/LoadingState'
import { NewFolderDialog } from '../components/NewFolderDialog'
import { Button } from '../components/ui/Button'
import { useMeetings } from '../context/MeetingsContext'
import { useClips } from '../context/ClipsContext'
import { foldersService } from '../services/folders/foldersService'

const quickActions = [
  {
    id: '1',
    name: 'Subir reunión o clip',
    icon: VideoCameraIcon,
    to: '/upload'
  },
  {
    id: '2',
    name: 'Importar documento',
    icon: DocumentTextIcon,
    to: '/import'
  },
  {
    id: '3',
    name: 'Generar informe',
    icon: ChartBarIcon,
    to: '/report'
  }
];

export function HomePage() {
  const { meetings } = useMeetings();
  const { clips } = useClips();
  const [unclassifiedMeetings, setUnclassifiedMeetings] = useState<Meeting[]>([]);
  const [recentActivities, setRecentActivities] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [recentFolders, setRecentFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Función auxiliar para contar elementos
  const getFolderItemsCount = (folderId: string) => {
    const meetingsCount = meetings.filter(m => m.folderId === folderId).length;
    const clipsCount = clips.filter(c => c.folderId === folderId).length;
    return meetingsCount + clipsCount;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [unclassifiedResponse, recentResponse] = await Promise.all([
          meetingsApi.getUnclassifiedMeetings(),
          meetingsApi.getMeetings(1, 5) // Solo las 5 más recientes
        ]);

        setUnclassifiedMeetings(unclassifiedResponse.data);
        setRecentActivities(recentResponse.data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const fetchRecentFolders = async () => {
      try {
        setIsLoading(true);
        console.log('Solicitando carpetas recientes...');
        const data = await foldersService.getFolders({ 
          limit: 3, 
          order_by_recent: true 
        });
        console.log('Carpetas recientes recibidas:', data);
        setRecentFolders(data.items);
        setError(null);
      } catch (err) {
        console.error('Error completo:', err);
        setError('Error al cargar las carpetas recientes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentFolders();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingState message="Cargando dashboard..." />
      </div>
    );
  }

  // Convertir las reuniones a actividades para el ActivityList
  const activitiesFromMeetings = recentActivities.map(meeting => ({
    id: meeting.id,
    type: 'meeting' as const,
    name: meeting.title,
    event: meeting.date > new Date() ? 'scheduled' :
           meeting.status.isProcessing ? 'transcribing' : 
           meeting.status.hasTranscription ? 'transcribed' : 
           meeting.status.isUploading ? 'uploading' : 'processed',
    platform: meeting.source,
    timestamp: meeting.date.toLocaleString()
  }));

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <Link
              key={action.id}
              to={action.to}
              className="block w-full p-2 hover:bg-card rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <action.icon className="h-5 w-5" />
                <span>{action.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Folders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Carpetas recientes
            </h2>
            <p className="text-muted-foreground">
              Accede rápidamente a tus carpetas recientes
            </p>
          </div>
          <Button 
            onClick={() => setIsNewFolderOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva carpeta
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card animate-pulse h-32 rounded-lg border border-border" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <div className="text-destructive mb-2">
              {error}
            </div>
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="mx-auto"
            >
              Reintentar
            </Button>
          </div>
        ) : recentFolders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentFolders.map(folder => (
              <Link
                key={folder.id}
                to={`/folder/${folder.id}`}
                className="group bg-card hover:bg-card/90 transition-colors rounded-lg p-4 cursor-pointer border border-border"
              >
                <div className="flex items-start justify-between">
                  <FolderIcon className="h-8 w-8 text-primary mb-2" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(folder.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                  {folder.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {folder.description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <FolderIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No hay carpetas
            </h3>
            <p className="text-muted-foreground mb-6">
              Crea tu primera carpeta para empezar a organizar tus reuniones y clips
            </p>
            <Button 
              onClick={() => setIsNewFolderOpen(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <PlusIcon className="h-4 w-4" />
              Crear nueva carpeta
            </Button>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Actividad reciente</h2>
          <button 
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-card hover:bg-card/90 text-foreground rounded-lg transition-colors border border-border"
          >
            <span>Ver todas</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
        <ActivityList 
          activities={activitiesFromMeetings}
          className="bg-card rounded-lg"
          showEmpty={true}
          maxItems={5}
        />
      </div>

      <NewFolderDialog 
        open={isNewFolderOpen} 
        onOpenChange={setIsNewFolderOpen}
      />
    </div>
  );
} 