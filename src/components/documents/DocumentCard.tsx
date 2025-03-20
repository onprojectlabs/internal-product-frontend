import { FileText, FolderIcon, PencilIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDocuments } from '../../context/DocumentsContext';
import { useDocumentWebSocket } from '../../context/DocumentWebSocketContext';
import { FolderAssignment } from '../folders/FolderAssignment';
import { Link } from 'react-router-dom';
import { foldersService } from '../../services/folders/foldersService';
import type { Document, DocumentStatus, FolderTreeResponse, DocumentProcessingMessage } from '../../types/documents';
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

  // Inicializar el estado local con los valores del documento - PRIORIZAR PROCESAMIENTO
  useEffect(() => {
    const anteriorEstado = localDocumentState;
    
    // Si el documento está subido pero ya empezó a procesarse (tenemos mensajes WS),
    // mantener el estado de procesamiento
    if (document.status === 'uploaded' && 
        anteriorEstado === 'processing' && 
        !isDocumentInFinalState) {
      // Mantener estado de procesamiento sin cambiarlo
      console.log(`[${new Date().toISOString()}] [DIAGNOSTICO] Manteniendo estado 'processing' para documento ${document.id} a pesar de estado API 'uploaded'`);
      // No cambiamos el estado, lo mantenemos como processing
    } else {
      // En otros casos, actualizar normalmente
      setLocalDocumentState(document.status);
      
      // Solo mostrar logs para cambios importantes durante el procesamiento activo
      const isActiveProcessing = document.status === 'processing' || anteriorEstado === 'processing';
      const hasStateChanged = anteriorEstado !== document.status;
      
      if (hasStateChanged && isActiveProcessing) {
        console.log(`[${new Date().toISOString()}] [DIAGNOSTICO] Estado del documento ${document.id} actualizado:`, {
          estado_anterior: anteriorEstado,
          nuevo_estado: document.status,
          origen: 'props'
        });
      }
    }
  }, [document.status, localDocumentState, isDocumentInFinalState]);

  // Iniciar conexión WebSocket para documentos en procesamiento una sola vez - REDUCIR LOGS
  useEffect(() => {
    // No intentar conectar si el documento ya está en estado final
    if (isDocumentInFinalState) {
      return;
    }
    
    if ((document.status === 'processing' || document.status === 'uploaded') && 
        !connectionAttempted) {
      // Solo mostrar logs para nuevos documentos en procesamiento o recién subidos
      const isNewUpload = document.created_at && 
                         (new Date().getTime() - new Date(document.created_at).getTime() < 5 * 60 * 1000); // 5 minutos
      
      if (isNewUpload) {
        console.log(`[${new Date().toISOString()}] [DIAGNOSTICO] Iniciando conexión WebSocket para documento ${document.id} en estado:`, document.status);
      }
      
      connectWebSocket(document);
      setConnectionAttempted(true);
    }
  }, [document, connectWebSocket, connectionAttempted, isDocumentInFinalState]);

  // Actualizar el estado local cuando recibimos actualizaciones del WebSocket
  useEffect(() => {
    if (wsStatus) {
      // Solo log para mensajes de error o cambios de estado importantes
      const statusValue = wsStatus.status as string;
      const isFailed = statusValue === 'failed';
      const isProgressComplete = 'progress_percentage' in wsStatus && wsStatus.progress_percentage === 100;
      
      if (isFailed || isProgressComplete) {
        console.log(`[${new Date().toISOString()}] [DIAGNOSTICO] Mensaje WebSocket importante para documento ${document.id}:`, wsStatus);
      }
      
      // Actualizar el estado local con la información del WebSocket según el tipo de mensaje
      if (wsStatus.task_type === 'document_processing') {
        const docStatus = wsStatus as DocumentProcessingMessage;
        const docStatusValue = docStatus.status as string;
        
        // Actualizar el estado del documento
        if (docStatus.status) {
          // *** CAMBIO IMPORTANTE: Priorizar el estado 'failed' sobre cualquier otro estado ***
          if (docStatusValue === 'failed') {
            console.warn(`[${new Date().toISOString()}] [DIAGNOSTICO] Documento ${document.id} marcado como FALLIDO desde WebSocket`);
            console.warn(`[${new Date().toISOString()}] [DIAGNOSTICO] Detalles del error:`, docStatus.error || docStatus.current_stage || 'Sin detalles');
            
            // Asegurarnos de que se muestre como "failed" inmediatamente
            setLocalDocumentState('failed');
            setConnectionAttempted(false);
            
            // También actualizamos el documento en el contexto global
            console.log(`[${new Date().toISOString()}] [DIAGNOSTICO] Actualizando documento ${document.id} con estado FALLIDO en contexto global`);
            updateDocument(document.id, { 
              status: 'failed',
              error_details: docStatus.error || {
                error_message: docStatus.current_stage || 'Error desconocido',
                error_type: 'UnknownError',
                timestamp: new Date().toISOString()
              }
            });
            
            // Terminamos el procesamiento del mensaje aquí para evitar sobrescribir el estado 'failed'
            return;
          } else if (docStatusValue === 'processed') {
            // Si está marcado como procesado, actualizar el estado local
            setLocalDocumentState('processed');
          } else if (docStatusValue === 'processing' || localDocumentState === 'processing') {
            // *** CAMBIO CLAVE: Mantener el estado "processing" una vez iniciado ***
            // Si el documento ya está en estado "processing" o recibimos un status "processing",
            // mantener el estado como "processing" hasta que se complete
            setLocalDocumentState('processing');
          } else {
            // Para otros estados (como "uploaded") solo actualizar si no estamos ya en "processing"
            setLocalDocumentState(docStatus.status);
          }
        }
        
        if (docStatus.progress_percentage !== undefined) {
          setLocalProgressPercentage(docStatus.progress_percentage);
        }
        
        // *** CAMBIO IMPORTANTE: Mantener separada la lógica de procesado vs completado ***
        const isProcessed = docStatusValue === 'processed';
        const isProgressComplete = docStatus.progress_percentage === 100;
        
        // Solo considerar terminado si está procesado O el progreso es 100% Y NO está en estado 'failed'
        if (isProcessed || (isProgressComplete && docStatusValue !== 'failed')) {
          // Documento completado normalmente
          setConnectionAttempted(false);
          
          // Actualizar explícitamente el estado local para mostrar como procesado
          if (isProgressComplete && docStatusValue !== 'failed') {
            setLocalDocumentState('processed');
            
            // También actualizamos el documento en el contexto global para persistir el cambio
            updateDocument(document.id, { status: 'processed' });
          }
        }
      }
    }
  }, [wsStatus, document.id, updateDocument, document, localDocumentState]);

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

  // Log para diagnóstico del estado que se muestra - SOLO PARA CAMBIOS O ESTADO FINAL
  useEffect(() => {
    // Solo log cuando hay un cambio real de estado a un estado final
    // Comparar estados anteriores para evitar logs innecesarios durante la carga inicial
    const isStateChanging = document.status !== displayStatus;
    const isNewStateFromWebSocket = wsStatus && 
                                   (displayStatus === 'processed' || displayStatus === 'failed') && 
                                   isStateChanging;

    // Solo mostrar log cuando hay una transición de estado importante, no en la carga inicial
    if (isNewStateFromWebSocket) {
      console.log(`[${new Date().toISOString()}] [DIAGNOSTICO] Transición a estado final para documento ${document.id}:`, {
        displayStatus,
        documentStatus: document.status,
        localState: localDocumentState,
        progress: progressPercentage
      });
    }
  }, [displayStatus, document.status, localDocumentState, progressPercentage, document.id, wsStatus]);

  // Log específico para estado fallido - SOLO CUANDO HAY TRANSICIÓN A FALLIDO
  useEffect(() => {
    // Solo verificar transiciones a estado fallido
    const isTransitioningToFailed = localDocumentState === 'failed' && document.status !== 'failed';
    
    // Solo mostrar log cuando un documento cambia a fallido, no cuando ya estaba fallido
    if (isTransitioningToFailed) {
      console.log(`[${new Date().toISOString()}] [DIAGNOSTICO] ¡TRANSICIÓN! Documento ${document.id} ahora en estado FALLIDO:`, {
        displayStatus,
        documentStatus: document.status,
        wsStatus: wsStatus ? {
          status: wsStatus.status,
          task_type: wsStatus.task_type,
          progress: 'progress_percentage' in wsStatus ? wsStatus.progress_percentage : 'N/A'
        } : 'No hay estado WS'
      });
    }
  }, [localDocumentState, document.id, displayStatus, document.status, wsStatus]);

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
    <div className={`bg-card hover:bg-card/90 transition-colors rounded-lg p-4 border ${displayStatus === 'failed' ? 'border-destructive/20' : 'border-border'} h-[170px] flex flex-col`}>
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