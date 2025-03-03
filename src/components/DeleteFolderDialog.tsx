import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/Dialog";
import { Button } from "./ui/Button";
import { useNavigate } from 'react-router-dom';
import { foldersService } from '../services/folders/foldersService';
import { useState } from 'react';

interface DeleteFolderDialogProps {
  folderId: string;
  folderName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteFolderDialog({ 
  folderId, 
  folderName, 
  open, 
  onOpenChange 
}: DeleteFolderDialogProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await foldersService.deleteFolder(folderId);
      
      onOpenChange(false);
      navigate('/');
      
      // Recargar la página para actualizar la lista de carpetas
      window.location.reload();
    } catch (err) {
      console.error('Error al eliminar la carpeta:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar la carpeta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Eliminar carpeta</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3">
              <p>
                ¿Estás seguro de que quieres eliminar la carpeta <span className="font-medium">{folderName}</span>?
              </p>
              <p>Esta acción no se puede deshacer.</p>
              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Eliminando...' : 'Eliminar carpeta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 