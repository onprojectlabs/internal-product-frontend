import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { FolderIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { NewFolderDialog } from "./NewFolderDialog";
import { foldersService } from "../services/folders/foldersService";
import { LoadingState } from "./LoadingState";
import type { Folder } from "../types/index";
import { documentsService } from '../services/documentsService';
import { useDocuments } from '../context/DocumentsContext';

interface FolderAssignmentProps {
  itemId: string;
  itemType: "meeting" | "clip" | "document";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign?: (folderId: string) => void;
}

export function FolderAssignment({ 
  itemId,
  itemType,
  open, 
  onOpenChange,
  onAssign 
}: FolderAssignmentProps) {
  const { refreshDocuments } = useDocuments();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await foldersService.getFolders();
        setFolders(data.items);
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

  const handleAssignFolder = async (folderId: string) => {
    try {
      setIsAssigning(true);
      setError(null);
      
      if (itemType === 'document') {
        await documentsService.updateDocument(itemId, {
          folder_id: folderId
        });
        
        // Notificar al padre primero
        onAssign?.(folderId);
        
        // Cerrar el diálogo
        onOpenChange(false);
        
        // Actualizar la lista de documentos
        await refreshDocuments();
      }
    } catch (error) {
      console.error('Error al asignar carpeta:', error);
      setError('Error al asignar a la carpeta');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreateFolder = () => {
    setIsNewFolderOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Asignar a carpeta</DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <LoadingState message="Cargando carpetas..." />
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-destructive mb-2">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  foldersService.getFolders().then(
                    data => {
                      setFolders(data.items);
                      setIsLoading(false);
                    },
                    error => {
                      setError('Error al cargar las carpetas');
                      setIsLoading(false);
                    }
                  );
                }}
              >
                Reintentar
              </Button>
            </div>
          ) : folders.length > 0 ? (
            <>
              {/* Área scrolleable con las carpetas */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid gap-4 py-4">
                  {folders.map(folder => (
                    <Button
                      key={folder.id}
                      variant="outline"
                      className="justify-start h-auto py-4 px-4"
                      onClick={() => handleAssignFolder(folder.id)}
                      disabled={isAssigning}
                    >
                      <div className="flex items-start gap-3">
                        <FolderIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div className="text-left">
                          <div className="font-medium">{folder.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {folder.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Botón fijo en la parte inferior */}
              <div className="flex-shrink-0 border-t pt-4 mt-auto">
                <Button 
                  onClick={handleCreateFolder}
                  variant="outline"
                  className="flex items-center gap-2 w-full"
                  disabled={isAssigning}
                >
                  <PlusIcon className="h-4 w-4" />
                  Crear nueva carpeta
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <FolderIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No hay carpetas disponibles
              </p>
              <div className="flex justify-center">
                <Button 
                  onClick={handleCreateFolder}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isAssigning}
                >
                  <PlusIcon className="h-4 w-4" />
                  Crear nueva carpeta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <NewFolderDialog 
        open={isNewFolderOpen} 
        onOpenChange={setIsNewFolderOpen} 
        onSuccess={(folderId: string) => handleAssignFolder(folderId)}
      />
    </>
  );
} 