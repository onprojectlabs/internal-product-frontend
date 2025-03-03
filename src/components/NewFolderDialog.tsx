import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { foldersService } from '../services/folders/foldersService';

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (folderId: string) => void;
}

export function NewFolderDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: NewFolderDialogProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await foldersService.createFolder({
        name: newFolderName,
        description: newFolderDescription
      });
      
      // Limpiar el formulario y cerrar el diálogo
      setNewFolderName('');
      setNewFolderDescription('');
      onOpenChange(false);

      // Notificar éxito si hay callback
      if (onSuccess && response.id) {
        onSuccess(response.id);
      } else {
        // Si no hay callback, recargar la página
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la carpeta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear nueva carpeta</DialogTitle>
          <DialogDescription>
            Crea una nueva carpeta para organizar tus reuniones y documentos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateFolder}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nombre de la carpeta"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="Descripción de la carpeta"
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
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
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear carpeta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 