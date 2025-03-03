import { Link } from 'react-router-dom';
import { FileVideo, FolderIcon, PencilIcon } from 'lucide-react';
import { Clip } from '../types/clips';
import { useState, useEffect } from 'react';
import { useClips } from '../context/ClipsContext';
import { FolderAssignment } from './FolderAssignment';
import { foldersService } from '../services/folders/foldersService';

interface Folder {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface ClipCardProps {
  clip: Clip;
  hideNavigation?: boolean;
}

export function ClipCard({ clip, hideNavigation = false }: ClipCardProps) {
  const { updateClip } = useClips();
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolder = async () => {
      if (!clip.folderId) return;

      try {
        setIsLoading(true);
        const folder = await foldersService.getFolder(clip.folderId);
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
  }, [clip.folderId]);

  const handleFolderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSelectingFolder(true);
  };

  const content = (
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <FileVideo className="h-5 w-5 text-primary shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate mb-1">
            {clip.title}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
            <span>{clip.duration}s</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-card hover:bg-card/90 transition-colors rounded-lg p-4 border border-border">
      {hideNavigation ? (
        <div className="mb-4">{content}</div>
      ) : (
        <Link 
          to={`/clip/${clip.id}`}
          state={{ from: { type: 'clips', path: '/clips' } }}
          className="block mb-4"
        >
          {content}
        </Link>
      )}

      {/* Área no clickeable para la carpeta */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FolderIcon className="h-4 w-4" />
        {clip.folderId ? (
          isLoading ? (
            <span>Cargando...</span>
          ) : error ? (
            <span className="text-destructive">{error}</span>
          ) : currentFolder ? (
            <>
              <span>En</span>
              {hideNavigation ? (
                <Link 
                  to={`/folder/${clip.folderId}`}
                  className="text-primary hover:underline"
                >
                  {currentFolder.name}
                </Link>
              ) : (
                <span className="text-primary">
                  {currentFolder.name}
                </span>
              )}
              <button
                onClick={handleFolderClick}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <PencilIcon className="h-3 w-3" />
              </button>
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
        itemId={clip.id}
        itemType="clip"
        open={isSelectingFolder}
        onOpenChange={setIsSelectingFolder}
        onAssign={(folderId) => {
          updateClip(clip.id, { folderId });
        }}
      />
    </div>
  );
} 