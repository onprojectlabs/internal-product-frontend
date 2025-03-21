import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  FolderIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { LoadingState } from '../../components/common/LoadingState';
import { Button } from '../../components/ui/Button';
import { EditFolderDialog } from '../../components/folders/EditFolderDialog';
import { DeleteFolderDialog } from '../../components/folders/DeleteFolderDialog';
import { foldersService } from '../../services/folders/foldersService';
import { DocumentCard } from '../../components/documents/DocumentCard';
import type { FolderTreeResponse } from '../../types/documents';

export function FolderPage() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [folder, setFolder] = useState<FolderTreeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolder = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const folderData = await foldersService.getFolder(id);
        console.log("Datos de la carpeta recibidos en el componente:", folderData);
        setFolder(folderData);
        setError(null);
      } catch (err) {
        console.error('Error al obtener la carpeta:', err);
        setError('Error al cargar la carpeta');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolder();
  }, [id]);

  // Los documentos ya vienen en el formato correcto desde la API
  const documents = folder?.documents || [];

  console.log("Documentos de la carpeta:", documents);

  const handleDocumentFolderChange = (documentId: string) => {
    // Actualizar la lista de documentos eliminando el documento que cambió de carpeta
    if (folder) {
      setFolder({
        ...folder,
        documents: folder.documents.filter(doc => doc.id !== documentId),
        total_documents: (folder.total_documents || 0) - 1
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingState message="Cargando carpeta..." />
      </div>
    );
  }

  if (error || !folder) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Error al cargar la carpeta</h2>
          <p className="text-muted-foreground mt-2">{error || 'La carpeta no existe o ha sido eliminada'}</p>
          <Link to="/" className="mt-4 inline-block">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          to="/"
          className="p-2 hover:bg-card rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FolderIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">
                  {folder.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {folder.total_documents || 0} elementos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => setIsEditOpen(true)}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setIsDeleteOpen(true)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>

          <p className="text-muted-foreground">
            {folder.description}
          </p>
        </div>
      </div>

      {/* Grid de elementos */}
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onFolderChange={handleDocumentFolderChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Carpeta vacía
          </h3>
          <p className="text-muted-foreground">
            Esta carpeta no tiene elementos todavía
          </p>
        </div>
      )}

      {/* Diálogos */}
      {folder && (
        <>
          <EditFolderDialog
            folder={folder}
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
          />
          <DeleteFolderDialog
            folderId={folder.id}
            folderName={folder.name}
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
          />
        </>
      )}
    </div>
  );
} 