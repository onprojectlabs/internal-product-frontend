import { FileText, FolderIcon, PencilIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDocuments } from '../context/DocumentsContext';
import { FolderAssignment } from './FolderAssignment';
import { Link } from 'react-router-dom';
import { foldersService } from '../services/folders/foldersService';
import type { Document } from '../types/documents';
import type { Folder } from '../types/index';

interface DocumentCardProps {
  document: Document;
  hideNavigation?: boolean;
}

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
  );

  return (
    <div className="bg-card hover:bg-card/90 transition-colors rounded-lg p-4 border border-border">
      {hideNavigation ? (
        <div className="mb-4">{content}</div>
      ) : (
        <Link 
          to={`/document/${document.id}`}
          state={{ from: { type: 'documents', path: '/documents' } }}
          className="block mb-4"
        >
          {content}
        </Link>
      )}

      {/* Área de carpeta */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FolderIcon className="h-4 w-4" />
        {document.folder_id ? (
          isLoading ? (
            <span>Cargando...</span>
          ) : error ? (
            <span className="text-destructive">{error}</span>
          ) : currentFolder ? (
            <>
              <span>En</span>
              {hideNavigation ? (
                <Link 
                  to={`/folder/${document.folder_id}`}
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