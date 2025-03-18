import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { 
  FileText,
  Clock,
  Download,
  Sparkles,
  Eye,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { useState, useEffect } from 'react';
import { Document, DocumentStatus } from '../../types/documents';
import { documentsService } from '../../services/documents/documentsService';
import { useDocumentWebSocket } from '../../context/DocumentWebSocketContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/Dialog";

export function DocumentPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Variables para WebSocket
  const { connectWebSocket, getDocumentStatus } = useDocumentWebSocket();
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  const [localDocumentState, setLocalDocumentState] = useState<DocumentStatus | null>(null);
  const [localProgressPercentage, setLocalProgressPercentage] = useState<number>(0);

  useEffect(() => {
    if (id) {
      const loadDocument = async () => {
        try {
          const doc = await documentsService.getDocument(id);
          if (doc) {
            setDocument(doc);
            setLocalDocumentState(doc.status);
          }
        } catch (error) {
          console.error('Error al cargar el documento:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadDocument();
    }
  }, [id]);

  // Conexión WebSocket para documento en procesamiento
  useEffect(() => {
    if (!document || !id) return;
    
    // No conectar si el documento ya está en estado final
    const isDocumentInFinalState = document.status === 'processed' || document.status === 'failed';
    if (isDocumentInFinalState) return;
    
    // Conectar WebSocket si el documento está en procesamiento o subido
    if ((document.status === 'processing' || document.status === 'uploaded') && !connectionAttempted) {
      connectWebSocket(document);
      setConnectionAttempted(true);
    }
  }, [document, id, connectWebSocket, connectionAttempted]);

  // Actualizar estado local cuando hay cambios en WebSocket
  useEffect(() => {
    if (!id) return;
    
    const wsStatus = getDocumentStatus(id);
    if (wsStatus) {
      // Actualizar estado
      if (wsStatus.status) {
        setLocalDocumentState(wsStatus.status as DocumentStatus);
      }
      
      // Actualizar porcentaje
      if (wsStatus.progress_percentage !== undefined) {
        setLocalProgressPercentage(wsStatus.progress_percentage);
      }
      
      // Si recibimos un estado final desde el WebSocket, actualizar el documento completo
      if (wsStatus.status === 'processed' || wsStatus.status === 'failed' || wsStatus.progress_percentage === 100) {
        // Forzar actualización del documento desde API
        documentsService.getDocument(id).then(updatedDoc => {
          if (updatedDoc) {
            setDocument(updatedDoc);
            setLocalDocumentState(updatedDoc.status);
          }
        }).catch(error => {
          console.error('Error al actualizar el documento después de procesamiento:', error);
        });
      }
    }
  }, [id, getDocumentStatus]);

  const handleBack = () => {
    if (from?.type === 'folder') {
      navigate(`/folder/${from.id}`);
    } else if (from?.path) {
      navigate(from.path);
    } else {
      navigate('/documents');
    }
  };

  const handleDownload = async () => {
    if (document) {
      console.log("Descargando documento:", document);
      try {
        await documentsService.downloadDocument(document.id, document.filename);
      } catch (error) {
        console.error('Error al descargar el documento:', error);
        alert('Error al descargar el documento');
      }
    }
  };

  const handlePreview = async () => {
    if (!document) return;

    setLoadingPreview(true);
    try {
      const url = await documentsService.getPreviewUrl(document.id);
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Error al cargar la vista previa:', error);
      alert('Error al cargar la vista previa');
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const renderPreviewContent = () => {
    if (!document) return null;

    if (loadingPreview) {
      return (
        <div className="text-center py-8">
          <LoadingState message="Cargando vista previa..." />
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4" />
          <p>Error al cargar la vista previa</p>
          <p className="text-sm mt-2">Intenta descargar el archivo</p>
        </div>
      );
    }

    switch (document.file_type.toLowerCase()) {
      case 'application/pdf':
      case 'pdf':
        return (
          <iframe
            src={previewUrl}
            className="w-full h-[80vh]"
            title={document.filename}
          />
        );

      case 'text/plain':
      case 'text/markdown':
        return (
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap p-6">
            {document.description || 'No hay contenido disponible'}
          </pre>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <p>Vista previa no disponible para este tipo de archivo</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingState message="Cargando documento..." />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-card/50 p-6 rounded-full mb-6">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Documento no encontrado</h1>
          <p className="text-muted-foreground mb-6">
            El documento que buscas no existe o ha sido eliminado
          </p>
          <Button onClick={handleBack}>Volver</Button>
        </div>
      </div>
    );
  }

  // Determinar el estado a mostrar
  const displayStatus = localDocumentState || document.status;
  const progressPercentage = localProgressPercentage;

  return (
    <>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <button
            onClick={handleBack}
            className="p-2 bg-background hover:bg-muted rounded-lg transition-colors text-muted-foreground"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground truncate">
                {document.filename}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(document.created_at).toLocaleDateString()}</span>
              </div>
              <span>{document.file_type}</span>
              {document.file_size && (
                <span>{Math.round(document.file_size / 1024)} KB</span>
              )}
              <StatusBadge 
                status={displayStatus} 
                percentage={progressPercentage} 
                variant="small" 
              />
            </div>
          </div>
        </div>

        {/* Grid de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card del documento */}
            <div className="bg-card rounded-lg p-6">
              {/* Acciones del documento */}
              <div className="flex gap-4">
                <Button 
                  onClick={handlePreview}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={loadingPreview}
                >
                  <Eye className="h-4 w-4" />
                  Vista previa
                </Button>
                <Button 
                  onClick={handleDownload}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              </div>
            </div>

            {/* Sección de resumen - Debajo de los botones */}
            {(displayStatus === 'uploaded' || displayStatus === 'processing') ? (
              <div className="bg-card rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Resumen</h2>
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4" />
                  <p>{progressPercentage > 0 ? `Generando resumen... ${progressPercentage}%` : "Generando resumen..."}</p>
                </div>
              </div>
            ) : displayStatus === 'processed' && (document.title || document.summary) ? (
              <div className="bg-card rounded-lg p-6">
                {document.title && (
                  <>
                    <h2 className="text-lg font-semibold mb-4">Título</h2>
                    <p className="text-muted-foreground mb-6">{document.title}</p>
                  </>
                )}
                {document.summary && (
                  <>
                    <h2 className="text-lg font-semibold mb-4">Resumen</h2>
                    <p className="text-muted-foreground">{document.summary}</p>
                  </>
                )}
              </div>
            ) : displayStatus === 'failed' && document.error_details && document.error_details.length > 0 ? (
              <div className="bg-card rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Error en el procesamiento</h2>
                <div className="space-y-2">
                  {document.error_details.map((error, index) => (
                    <p key={index} className="text-destructive">
                      {JSON.stringify(error)}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Barra lateral */}
          <div className="space-y-6">
            {/* Detalles del documento */}
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Detalles</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Estado</dt>
                  <dd className="mt-1">
                    <StatusBadge 
                      status={displayStatus} 
                      percentage={progressPercentage}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Tipo</dt>
                  <dd className="mt-1">{document.file_type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Tamaño</dt>
                  <dd className="mt-1">{Math.round(document.file_size / 1024)} KB</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Creado</dt>
                  <dd className="mt-1">{new Date(document.created_at).toLocaleDateString()}</dd>
                </div>
                {document.description && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Descripción</dt>
                    <dd className="mt-1">{document.description}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de vista previa */}
      <Dialog open={previewOpen} onOpenChange={closePreview}>
        <DialogContent className="max-w-5xl w-full">
          <DialogHeader>
            <DialogTitle>{document.filename}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 