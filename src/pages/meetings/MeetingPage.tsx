import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  VideoCameraIcon,
  ClockIcon,
  UserGroupIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  FolderIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { useMeetings, Meeting } from '../../context/MeetingsContext';
import { MeetingStatus } from '../../components/meetings/MeetingStatus';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { FileVideo2 } from 'lucide-react';
import { LoadingState } from '../../components/common/LoadingState';
import { FolderAssignment } from '../../components/folders/FolderAssignment';
import { foldersService } from '../../services/folders/foldersService';

interface Folder {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export function MeetingPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const { meetings, updateMeeting } = useMeetings();
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

  console.log('Navigation state:', location.state); // Para depurar

  useEffect(() => {
    const loadMeeting = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }
      
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const foundMeeting = meetings.find(m => m.id === id);
        setMeeting(foundMeeting || null);
      } catch (error) {
        console.error('Error loading meeting:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMeeting();
  }, [id, meetings]);

  useEffect(() => {
    const fetchFolder = async () => {
      if (meeting?.folderId) {
        setIsLoadingFolder(true);
        try {
          const folder = await foldersService.getFolder(meeting.folderId);
          setCurrentFolder(folder);
        } catch (error) {
          console.error('Error al cargar la carpeta:', error);
        } finally {
          setIsLoadingFolder(false);
        }
      } else {
        setCurrentFolder(null);
      }
    };

    fetchFolder();
  }, [meeting?.folderId]);

  const getPlatformName = (platform: "zoom" | "meet" | "teams") => {
    switch (platform) {
      case "zoom":
        return "Zoom";
      case "meet":
        return "Google Meet";
      case "teams":
        return "Microsoft Teams";
      default:
        return platform;
    }
  };

  const handleBack = () => {
    if (from?.type === 'folder') {
      navigate(`/folder/${from.id}`);
    } else if (from?.path) {
      navigate(from.path);
    } else {
      navigate('/meetings');
    }
  };

  const handleAssignFolder = async (folderId: string) => {
    if (!meeting) return;
    
    try {
      await updateMeeting(meeting.id, { ...meeting, folderId });
      const folder = await foldersService.getFolder(folderId);
      setCurrentFolder(folder);
      setIsSelectingFolder(false);
    } catch (error) {
      console.error('Error al asignar carpeta:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <LoadingState message="Cargando reunión..." />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-card/50 p-6 rounded-full mb-6">
            <VideoCameraIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Reunión no encontrada</h1>
          <p className="text-muted-foreground mb-8">
            La reunión que estás buscando no existe o ha sido eliminada
          </p>
          <Button 
            onClick={() => navigate('/meetings')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Ver mis reuniones
          </Button>
        </div>
      </div>
    );
  }

  const isFutureMeeting = new Date(meeting.date) > new Date();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={handleBack}
          className="p-2 bg-background hover:bg-muted rounded-lg transition-colors text-muted-foreground"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <VideoCameraIcon className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground truncate">
                {meeting.title}
              </h1>
            </div>
            <MeetingStatus status={meeting.status} />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              <span>{meeting.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <UserGroupIcon className="h-4 w-4" />
              <span>{meeting.participants.length} participantes</span>
            </div>
            <span>{meeting.platform}</span>
          </div>
          
          {/* Ubicación como información adicional */}
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <FolderIcon className="h-4 w-4" />
            {meeting.folderId ? (
              <>
                <span>En</span>
                {isLoadingFolder ? (
                  <span>Cargando...</span>
                ) : currentFolder ? (
                  <>
                    <Link 
                      to={`/folder/${meeting.folderId}`}
                      className="text-primary hover:underline"
                    >
                      {currentFolder.name}
                    </Link>
                    <button
                      onClick={() => setIsSelectingFolder(true)}
                      className="p-1 bg-background hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <span>Error al cargar la carpeta</span>
                )}
              </>
            ) : (
              <button
                onClick={() => setIsSelectingFolder(true)}
                className="text-primary hover:underline"
              >
                Asignar a carpeta
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selector de carpeta */}
      <FolderAssignment 
        itemId={meeting.id}
        itemType="meeting"
        open={isSelectingFolder}
        onOpenChange={setIsSelectingFolder}
        onAssign={handleAssignFolder}
      />

      {/* Overlay para cuando el selector está abierto */}
      {isSelectingFolder && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsSelectingFolder(false)}
        />
      )}

      {/* Content Grid */}
      {isFutureMeeting ? (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Estado y tiempo */}
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
                Esta reunión aún no ha comenzado
              </div>
              <div className="text-lg text-muted-foreground">
                Comienza en {new Date(meeting.date).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Información de la reunión */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">Plataforma</h3>
                  <div className="flex items-center gap-2">
                    <FileVideo2 className="h-4 w-4 text-primary" />
                    <span>{getPlatformName(meeting.platform)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">Duración</h3>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-primary" />
                    <span>{meeting.duration}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">Participantes</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <UserGroupIcon className="h-4 w-4 text-primary" />
                    <span>{meeting.participants?.length} participantes</span>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {meeting.participants?.map((participant, index) => (
                      <li key={index}>{participant}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-4 text-muted-foreground">Acciones</h3>
                  <Button 
                    size="lg"
                    className="w-full"
                    disabled={!isFutureMeeting}
                  >
                    <FileVideo2 className="w-4 h-4 mr-2" />
                    {isFutureMeeting ? 'Unirse a la reunión' : 'Reunión finalizada'}
                  </Button>
                </div>

                {meeting.folderId && currentFolder && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Carpeta</h3>
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4 text-primary" />
                      <Link 
                        to={`/folder/${meeting.folderId}`}
                        className="text-primary hover:underline"
                      >
                        {currentFolder.name}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <section className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-primary" />
                Resumen
              </h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {meeting.summary}
              </p>
            </section>

            {/* Highlights */}
            <section className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-primary" />
                Puntos Destacados
              </h2>
              <ul className="space-y-3">
                {meeting.highlights?.map((highlight, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-2 text-muted-foreground"
                  >
                    <span className="text-primary">•</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Questions */}
            <section className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <QuestionMarkCircleIcon className="h-5 w-5 text-primary" />
                Preguntas Pendientes
              </h2>
              <ul className="space-y-3">
                {meeting.pendingQuestions?.map((question, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-2 text-muted-foreground"
                  >
                    <span className="text-primary">?</span>
                    {question}
                  </li>
                ))}
              </ul>
            </section>

            {/* Participants */}
            <section className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-primary" />
                Participantes
              </h2>
              <ul className="space-y-2">
                {meeting.participants.map((participant, index) => (
                  <li 
                    key={index}
                    className="text-muted-foreground"
                  >
                    {participant}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
} 