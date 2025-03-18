import { FileText, FolderIcon, PencilIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDocuments } from '../../context/DocumentsContext';
import { useDocumentWebSocket } from '../../context/DocumentWebSocketContext';
import { FolderAssignment } from '../folders/FolderAssignment';
import { Link } from 'react-router-dom';
import { foldersService } from '../../services/folders/foldersService';
import type { Document, DocumentStatus, FolderTreeResponse } from '../../types/documents';
import { StatusBadge } from '../ui/StatusBadge';

interface DocumentCardProps {
  document: Document;
  hideNavigation?: boolean;
  onFolderChange?: (documentId: string) => void;
}

export function DocumentCard({ document, hideNavigation = false, onFolderChange }: DocumentCardProps) {
  const { updateDocument } = useDocuments();
  const { connectWebSocket, getDocumentStatus } = useDocumentWebSocket();
  const [isAssigningFolder, setIsAssigningFolder] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<FolderTreeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  // Mantener una copia local del estado del documento que puede actualizarse mediante WebSocket
  const [localDocumentState, setLocalDocumentState] = useState<DocumentStatus>(document.status);
  const [localProgressPercentage, setLocalProgressPercentage] = useState<number>(0);
  
  // Verificar si el documento está en un estado final (procesado o fallido)
  const isDocumentInFinalState = localDocumentState === 'processed' || localDocumentState === 'failed';
  
  // Estado del WebSocket para este documento
  const wsStatus = getDocumentStatus(document.id);

  // Inicializar el estado local con los valores del documento
  useEffect(() => {
    setLocalDocumentState(document.status);
  }, [document.status]);

  // Iniciar conexión WebSocket para documentos en procesamiento una sola vez
  useEffect(() => {
    // No intentar conectar si el documento ya está en estado final
    if (isDocumentInFinalState) {
      return;
    }
    
    if ((document.status === 'processing' || document.status === 'uploaded') && 
        !connectionAttempted) {
      connectWebSocket(document);
      setConnectionAttempted(true);
    }
  }, [document, connectWebSocket, connectionAttempted, isDocumentInFinalState]);

  // Actualizar el estado local cuando recibimos actualizaciones del WebSocket
  useEffect(() => {
    if (wsStatus) {
      // Actualizar el estado local con la información del WebSocket
      if (wsStatus.status) {
        setLocalDocumentState(wsStatus.status as DocumentStatus);
      }
      
      if (wsStatus.progress_percentage !== undefined) {
        setLocalProgressPercentage(wsStatus.progress_percentage);
      }
      
      // Si recibimos un estado final desde el WebSocket, actualizar nuestro estado de conexión
      if (wsStatus.status === 'processed' || wsStatus.status === 'failed' || wsStatus.progress_percentage === 100) {
        setConnectionAttempted(false);
        
        // Actualizar explícitamente el estado local para mostrar como procesado
        if (wsStatus.progress_percentage === 100) {
          setLocalDocumentState('processed');
        }
        
        // También actualizamos el documento en el contexto global para persistir el cambio
        updateDocument(document.id, { status: wsStatus.status || 'processed' });
      }
    }
  }, [wsStatus, document.id, updateDocument]);

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

  // Determinar el estado y progreso del documento
  // Usar el estado local que se mantiene actualizado con los mensajes WebSocket
  const displayStatus = localDocumentState;
  const progressPercentage = isDocumentInFinalState ? 100 : localProgressPercentage;

  const content = (
    <>
      {/* Indicador de estado */}
      <div className="mb-3">
        <StatusBadge 
          status={displayStatus} 
          percentage={progressPercentage}
        />
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
    <div className="bg-card hover:bg-card/90 transition-colors rounded-lg p-4 border border-border h-[170px] flex flex-col">
      {hideNavigation ? (
        <div className="flex flex-col flex-1">{content}</div>
      ) : (
        <Link 
          to={`/document/${document.id}`}
          state={{ from: { type: 'documents', path: '/documents' } }}
          className="flex flex-col flex-1"
        >
          {content}
        </Link>
      )}

      {/* Área de carpeta */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto h-8">
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
                <Link 
                  to={`/folder/${document.folder_id}`}
                  className="text-primary hover:underline truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {currentFolder.name}
                </Link>
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
              className="text-primary hover:underline truncate"
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
          if (onFolderChange) {
            onFolderChange(document.id);
          }
        }}
      />
    </div>
  );
} 