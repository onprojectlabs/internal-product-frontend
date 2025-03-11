import { FileText, FolderIcon, PencilIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDocuments } from '../context/DocumentsContext';
import { FolderAssignment } from './FolderAssignment';
import { Link } from 'react-router-dom';
import { foldersService } from '../services/folders/foldersService';
import type { Document, DocumentStatus } from '../types/documents';
import type { Folder } from '../types/index';
import { cn } from '../lib/utils';

interface DocumentCardProps {
  document: Document;
  hideNavigation?: boolean;
}

const statusConfig: Record<DocumentStatus, { label: string; className: string }> = {
  uploaded: { 
    label: 'Subido', 
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  },
  processing: { 
    label: 'Procesando', 
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
  },
  processed: { 
    label: 'Procesado', 
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  },
  failed: { 
    label: 'Error', 
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }
};

export function DocumentCard({ document, hideNavigation = false }: DocumentCardProps) {
  const { updateDocument } = useDocuments();
  const [isAssigningFolder, setIsAssigningFolder] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolder = async () => {
      if (!document.folder_id) return;

      try {
        setIsLoading(true);
        const folder = await foldersService.getFolder(document.folder_id);
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
  }, [document.folder_id]);

  const handleFolderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAssigningFolder(true);
  };

  const content = (
    <>
      {/* Indicador de estado */}
      <div className="mb-3">
        <span className={cn(
          "px-2 py-1 rounded-md text-xs font-medium",
          statusConfig[document.status].className
        )}>
          {statusConfig[document.status].label}
        </span>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <FileText className="h-5 w-5 text-primary shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate mb-1">
              {document.filename}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{new Date(document.created_at).toLocaleDateString()}</span>
              <span>{document.file_type}</span>
              {document.file_size && (
                <span>{Math.round(document.file_size / 1024)} KB</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-card hover:bg-card/90 transition-colors rounded-lg p-4 border border-border h-[150px] flex flex-col">
      {hideNavigation ? (
        <div>{content}</div>
      ) : (
        <Link 
          to={`/document/${document.id}`}
          state={{ from: { type: 'documents', path: '/documents' } }}
          className="block"
        >
          {content}
        </Link>
      )}

      {/* Área de carpeta */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto pt-2">
        <FolderIcon className="h-4 w-4 shrink-0" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {document.folder_id ? (
            isLoading ? (
              <span>Cargando...</span>
            ) : error ? (
              <span className="text-destructive">{error}</span>
            ) : currentFolder ? (
              <>
                <span className="shrink-0">En</span>
                {hideNavigation ? (
                  <Link 
                    to={`/folder/${document.folder_id}`}
                    className="text-primary hover:underline truncate"
                  >
                    {currentFolder.name}
                  </Link>
                ) : (
                  <span className="text-primary truncate">
                    {currentFolder.name}
                  </span>
                )}
                <button
                  onClick={handleFolderClick}
                  className="p-1 hover:bg-muted rounded-lg transition-colors shrink-0"
                >
                  <PencilIcon className="h-3 w-3" />
                </button>
              </>
            ) : null
          ) : (
            <button
              onClick={handleFolderClick}
              className="text-primary hover:underline truncate py-1 mb-1.5"
            >
              Asignar a carpeta
            </button>
          )}
        </div>
      </div>

      <FolderAssignment 
        itemId={document.id}
        itemType="document"
        open={isAssigningFolder}
        onOpenChange={setIsAssigningFolder}
        onAssign={(folderId) => {
          updateDocument(document.id, { folder_id: folderId });
        }}
      />
    </div>
  );
} 