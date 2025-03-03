import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { useDocuments } from '../context/DocumentsContext';
import { FolderIcon } from 'lucide-react';
import { foldersService } from '../services/folders/foldersService';
import { LoadingState } from './LoadingState';

interface Folder {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface DocumentFolderAssignmentProps {
  documentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentFolderAssignment({ 
  documentId, 
  open, 
  onOpenChange 
}: DocumentFolderAssignmentProps) {
  const { documents, updateDocument } = useDocuments();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const document = documents.find(d => d.id === documentId);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setIsLoading(true);
        const data = await foldersService.getFolders();
        setFolders(data.items);
        setError(null);
      } catch (err) {
        console.error('Error al obtener las carpetas:', err);
        setError('Error al cargar las carpetas');
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchFolders();
    }
  }, [open]);

  const handleAssign = () => {
    if (selectedFolderId) {
      updateDocument(documentId, { folderId: selectedFolderId });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar a carpeta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <LoadingState message="Cargando carpetas..." />
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-destructive mb-2">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Reintentar
              </Button>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-4">
              <FolderIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay carpetas disponibles
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg text-left
                    transition-colors
                    ${
                      selectedFolderId === folder.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }
                  `}
                >
                  <FolderIcon className="h-5 w-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{folder.name}</p>
                    {folder.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {folder.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedFolderId || isLoading}
          >
            Asignar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 