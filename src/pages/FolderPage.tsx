import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  ArrowLeftIcon, 
  FolderIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { LoadingState } from '../components/LoadingState';
import { Button } from '../components/ui/Button';
import { EditFolderDialog } from '../components/EditFolderDialog';
import { DeleteFolderDialog } from '../components/DeleteFolderDialog';
import { foldersService } from '../services/folders/foldersService';
import { DocumentCard } from '../components/DocumentCard';
import type { Document } from '../types/documents';

// Interfaz para los documentos que vienen de la API
interface APIDocument {
  id: string;
  name: string;
  type: "document";
  date: string;
  size?: string;
  status?: string;
  file_type?: string;
  file_path?: string;
}

interface FolderTreeResponse {
  name: string;
  description: string;
  id: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  documents: APIDocument[];
  total_documents: number;
  subfolders: FolderTreeResponse[];
  total_subfolders: number;
}

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

  // Transformar los documentos de la API al formato esperado por DocumentCard
  const transformedDocuments = folder?.documents.map(doc => ({
    id: doc.id,
    filename: doc.name,
    file_type: doc.file_type || 'unknown',
    file_size: doc.size ? parseInt(doc.size) : 0,
    file_path: doc.file_path || '',
    created_at: doc.date,
    status: doc.status || 'processed',
    folder_id: folder.id
  })) || [];

  console.log("Documentos transformados:", transformedDocuments);

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
      {transformedDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transformedDocuments.map(document => (
            <DocumentCard 
              key={document.id}
              document={document}
              hideNavigation={false}
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