import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { 
  FileText,
  Clock,
  Download,
  Sparkles,
  Hash,
  List,
  Circle as BulletIcon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/LoadingState';
import { useState, useEffect } from 'react';
import { Document } from '../types/documents';
import { Document as PDFDocument, Page } from 'react-pdf';
import '../lib/pdf.worker';  // Importamos el worker
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { documentsService } from '../services/documentsService';

export function DocumentPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    if (id) {
      const loadDocument = async () => {
        try {
          const doc = await documentsService.getDocument(id);
          if (doc) {
            console.log('Tipo de archivo:', doc.file_type);
            console.log('Ruta del archivo:', doc.file_path);
          }
          setDocument(doc);
        } catch (error) {
          console.error('Error al cargar el documento:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadDocument();
    }
  }, [id]);

  const handleBack = () => {
    if (from?.type === 'folder') {
      navigate(`/folder/${from.id}`);
    } else if (from?.path) {
      navigate(from.path);
    } else {
      navigate('/documents');
    }
  };

  const handleDownload = () => {
    if (document) {
      try {
        // Crear URL del archivo y descargar
        const link = window.document.createElement('a');
        link.href = document.file_path;
        link.download = document.filename;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } catch (error) {
        console.error('Error al descargar el archivo:', error);
      }
    }
  };

  const renderPreview = () => {
    if (!document) return null;

    switch (document.file_type) {
      case 'application/pdf':
        return (
          <div className="w-full bg-muted rounded-lg overflow-hidden">
            <PDFDocument
              file={document.file_path}
              onLoadSuccess={({ numPages }) => {
                console.log('PDF cargado exitosamente', { numPages });
                setNumPages(numPages);
              }}
              onLoadError={(error) => {
                console.error('Error al cargar PDF:', error, document.file_type);
              }}
              error={
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Error al cargar el PDF</p>
                  <p className="text-sm mt-2">Intenta descargar el archivo</p>
                </div>
              }
              loading={
                <div className="text-center py-8">
                  <LoadingState message="Cargando PDF..." />
                </div>
              }
              className="mx-auto"
            >
              <Page 
                pageNumber={pageNumber} 
                width={600}
                className="mx-auto"
                error={
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Error al cargar la página {pageNumber}</p>
                  </div>
                }
                loading={
                  <div className="text-center py-4">
                    <LoadingState message={`Cargando página ${pageNumber}...`} />
                  </div>
                }
              />
            </PDFDocument>
            {numPages && numPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                  disabled={pageNumber <= 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {pageNumber} de {numPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                  disabled={pageNumber >= numPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        );

      case 'text/plain':
      case 'text/markdown':
        return (
          <div className="w-full h-[400px] bg-muted rounded-lg p-6 overflow-auto">
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
              {document.description || 'No hay contenido disponible'}
            </pre>
          </div>
        );

      default:
        return (
          <div className="w-full bg-muted rounded-lg p-12 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Vista previa no disponible
              </p>
            </div>
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

  return (
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
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              document.status === 'processed' ? 'bg-green-100 text-green-700' :
              document.status === 'failed' ? 'bg-red-100 text-red-700' :
              document.status === 'processing' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {document.status === 'uploaded' ? 'Subido' :
               document.status === 'to_process' ? 'Por procesar' :
               document.status === 'processing' ? 'Procesando' :
               document.status === 'processed' ? 'Procesado' :
               'Error'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card del documento */}
          <div className="bg-card rounded-lg p-6">
            {/* Vista previa */}
            <div className="mb-6">
              {renderPreview()}
            </div>

            {/* Botón de descarga */}
            <Button 
              onClick={handleDownload}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar documento
            </Button>
          </div>

          {/* Sección de resumen - Debajo de la vista previa */}
          {(document.status === 'uploaded' || document.status === 'processing') ? (
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Resumen</h2>
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4" />
                <p>Generando resumen...</p>
              </div>
            </div>
          ) : document.status === 'processed' && document.summary && (
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Resumen</h2>
              <p className="text-muted-foreground">{document.summary}</p>
            </div>
          )}
        </div>

        {/* Barra lateral */}
        <div className="space-y-6">
          {/* Detalles del documento */}
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Detalles</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Estado</dt>
                <dd className="mt-1">{
                  document.status === 'uploaded' ? 'Subido' :
                  document.status === 'to_process' ? 'Por procesar' :
                  document.status === 'processing' ? 'Procesando' :
                  document.status === 'processed' ? 'Procesado' :
                  'Error'
                }</dd>
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

          {/* Secciones de procesamiento en la barra lateral */}
          {(document.status === 'uploaded' || document.status === 'processing') ? (
            <>
              {/* Palabras clave */}
              <div className="bg-card rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Palabras clave</h2>
                <div className="text-center py-8 text-muted-foreground">
                  <Hash className="h-12 w-12 mx-auto mb-4" />
                  <p>Extrayendo palabras clave...</p>
                </div>
              </div>

              {/* Temas principales */}
              <div className="bg-card rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Temas principales</h2>
                <div className="text-center py-8 text-muted-foreground">
                  <List className="h-12 w-12 mx-auto mb-4" />
                  <p>Identificando temas...</p>
                </div>
              </div>
            </>
          ) : document.status === 'processed' && (
            <>
              {/* Palabras clave */}
              {document.keywords && document.keywords.length > 0 && (
                <div className="bg-card rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Palabras clave</h2>
                  <div className="flex flex-wrap gap-2">
                    {document.keywords.map((keyword, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Temas principales */}
              {document.topics && document.topics.length > 0 && (
                <div className="bg-card rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Temas principales</h2>
                  <div className="space-y-3">
                    {document.topics.map((topic, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <BulletIcon className="h-4 w-4 text-primary" />
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 