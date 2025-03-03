import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { File } from '../mocks/types';
import { filesApi } from '../mocks/api/files';
import { LoadingState } from '../components/LoadingState';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

// Configuración necesaria para react-pdf
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export function FilePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    const loadFile = async () => {
      if (!id) return;
      
      try {
        const response = await filesApi.getFile(id);
        setFile(response.data);
      } catch (error) {
        console.error('Error loading file:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [id]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingState message="Cargando archivo..." />
      </div>
    );
  }

  if (!file) {
    return <div>Archivo no encontrado</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => {
            if (from?.type === 'folder') {
              navigate(`/folder/${from.id}`);
            } else {
              navigate(from?.pathname || '/');
            }
          }}
          className="p-2 bg-background hover:bg-muted rounded-lg transition-colors text-muted-foreground"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <DocumentIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground truncate">
              {file.name}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              <span>{file.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <DocumentIcon className="h-4 w-4" />
              <span>{file.size}</span>
            </div>
          </div>
        </div>
        <a
          href={file.downloadUrl}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span>Descargar</span>
        </a>
      </div>

      {/* PDF Viewer */}
      {file.type === "document" && (
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <Document
            file={file.downloadUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<LoadingState message="Cargando PDF..." />}
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="mx-auto"
            />
          </Document>
          {numPages && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                disabled={pageNumber <= 1}
                className="p-2 bg-background hover:bg-muted rounded-lg transition-colors text-muted-foreground disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-muted-foreground">
                Página {pageNumber} de {numPages}
              </span>
              <button
                onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                disabled={pageNumber >= numPages}
                className="p-2 bg-background hover:bg-muted rounded-lg transition-colors text-muted-foreground disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-primary" />
              Resumen
            </h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {file.summary}
            </p>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="bg-card rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Detalles</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tamaño</dt>
                <dd className="font-medium">{file.size}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tipo</dt>
                <dd className="font-medium">{file.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Fecha</dt>
                <dd className="font-medium">{file.date}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
} 