import { Link } from 'react-router-dom';
import { VideoCameraIcon, FolderIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { MeetingStatus } from './MeetingStatus';
import { FolderAssignment } from '../folders/FolderAssignment';
import { useMeetings } from '../../context/MeetingsContext';
import { foldersService } from '../../services/folders/foldersService';
import type { Meeting } from '../../types/index';
import { FolderTreeResponse } from '../../types/documents';

interface MeetingCardProps {
  meeting: Meeting;
  hideNavigation?: boolean;
}

export function MeetingCard({ meeting, hideNavigation = false }: MeetingCardProps) {
  const { updateMeeting } = useMeetings();
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<FolderTreeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolder = async () => {
      if (!meeting.folderId) return;

      try {
        setIsLoading(true);
        const folder = await foldersService.getFolder(meeting.folderId);
        setCurrentFolder(folder);
        setError(null);
      } catch (err) {
        console.error('Error al obtener la carpeta:', err);
        setError('Error al cargar la carpeta');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolder();
  }, [meeting.folderId]);

  const handleFolderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSelectingFolder(true);
  };

  const content = (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <VideoCameraIcon className="h-5 w-5 text-primary shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate mb-1">
            {meeting.name}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{new Date(meeting.date).toLocaleDateString()}</span>
            <span>{meeting.participants?.length || 0} participantes</span>
          </div>
        </div>
      </div>
      <MeetingStatus status={meeting.status} />
    </div>
  );

  return (
    <div className="bg-card hover:bg-card/90 transition-colors rounded-lg p-4 border border-border">
      {hideNavigation ? (
        <div>{content}</div>
      ) : (
        <Link to={`/meeting/${meeting.id}`}>{content}</Link>
      )}

      {/* Área no clickeable para la carpeta */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FolderIcon className="h-4 w-4" />
        {meeting.folderId ? (
          isLoading ? (
            <span>Cargando...</span>
          ) : error ? (
            <span className="text-destructive">{error}</span>
          ) : currentFolder ? (
            <>
              <span>En</span>
              {hideNavigation ? (
                <Link 
                  to={`/folder/${meeting.folderId}`}
                  className="text-primary hover:underline"
                >
                  {currentFolder.name}
                </Link>
              ) : (
                <span className="text-primary">
                  {currentFolder.name}
                </span>
              )}
            </>
          ) : null
        ) : (
          <button
            onClick={handleFolderClick}
            className="text-primary hover:underline"
          >
            Asignar a carpeta
          </button>
        )}
      </div>

      <FolderAssignment 
        itemId={meeting.id}
        itemType="meeting"
        open={isSelectingFolder}
        onOpenChange={setIsSelectingFolder}
        onAssign={(folderId) => {
          updateMeeting(meeting.id, { folderId });
        }}
      />
    </div>
  );
} 