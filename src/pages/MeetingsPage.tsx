import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  VideoCameraIcon, 
  FolderIcon, 
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Search as SearchIcon } from 'lucide-react';
import { Meeting, useMeetings } from '../context/MeetingsContext';
import { Button } from '../components/ui/Button';
import { MeetingStatus } from '../components/MeetingStatus';
import { AddTestMeetingDialog } from '../components/AddTestMeetingDialog';
import { FolderAssignment } from '../components/FolderAssignment';
import { foldersService } from '../services/folders/foldersService';

interface Folder {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

// Componente para la tarjeta de reunión
function MeetingCard({ meeting }: { meeting: Meeting }) {
  const { updateMeeting } = useMeetings();
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  
  useEffect(() => {
    const fetchFolder = async () => {
      if (meeting.folderId) {
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
  }, [meeting.folderId]);

  const handleAssignFolder = async (folderId: string) => {
    try {
      await updateMeeting(meeting.id, { ...meeting, folderId });
      const folder = await foldersService.getFolder(folderId);
      setCurrentFolder(folder);
    } catch (error) {
      console.error('Error al asignar carpeta:', error);
    }
  };

  return (
    <div className="bg-card hover:bg-card/90 transition-colors rounded-lg p-4 border border-border">
      <div className="flex items-start justify-between mb-4">
        <Link 
          to={`/meeting/${meeting.id}`}
          state={{ from: { type: 'meetings', path: '/meetings' } }}
          className="flex items-start gap-3 flex-1 min-w-0"
        >
          <VideoCameraIcon className="h-5 w-5 text-primary shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate mb-1">
              {meeting.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{new Date(meeting.date).toLocaleDateString()}</span>
              <span>{meeting.participants?.length || 0} participantes</span>
            </div>
          </div>
        </Link>
        <MeetingStatus status={meeting.status} />
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setIsSelectingFolder(true)}
        >
          <FolderIcon className="h-4 w-4" />
          {isLoadingFolder ? (
            'Cargando...'
          ) : currentFolder ? (
            currentFolder.name
          ) : (
            'Sin carpeta'
          )}
        </Button>
      </div>

      <FolderAssignment
        open={isSelectingFolder}
        onOpenChange={setIsSelectingFolder}
        onAssign={handleAssignFolder}
      />
    </div>
  );
}

export function MeetingsPage() {
  const { meetings } = useMeetings();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);

  console.log('[MeetingsPage] Reuniones cargadas:', meetings);

  const now = new Date();
  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log('[MeetingsPage] Reuniones filtradas:', filteredMeetings);

  // Asegurarnos de que las fechas son objetos Date antes de comparar
  const futureMeetings = filteredMeetings.filter(meeting => {
    const meetingDate = new Date(meeting.date);
    console.log('Comparando fechas:', {
      meetingDate,
      now,
      isFuture: meetingDate > now
    });
    return meetingDate > now;
  });

  const pastMeetings = filteredMeetings.filter(meeting => {
    const meetingDate = new Date(meeting.date);
    return meetingDate <= now;
  });

  console.log('[MeetingsPage] Reuniones futuras:', futureMeetings);
  console.log('[MeetingsPage] Reuniones pasadas:', pastMeetings);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Reuniones
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus reuniones pasadas y futuras
          </p>
        </div>
        <Button 
          onClick={() => setIsAddMeetingOpen(true)}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Añadir reunión (Test)
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative mb-8">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar reuniones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Future Meetings */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Próximas reuniones</h2>
        </div>
        {futureMeetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {futureMeetings.map(meeting => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-card rounded-lg border border-border">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay reuniones programadas
            </p>
          </div>
        )}
      </div>

      {/* Past Meetings */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Reuniones pasadas</h2>
        </div>
        {pastMeetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastMeetings.map(meeting => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-card rounded-lg border border-border">
            <ClockIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay reuniones pasadas
            </p>
          </div>
        )}
      </div>

      <AddTestMeetingDialog 
        open={isAddMeetingOpen}
        onOpenChange={setIsAddMeetingOpen}
      />
    </div>
  );
} 