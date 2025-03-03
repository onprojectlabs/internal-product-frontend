import { useState } from 'react';
import { FileText, Search as SearchIcon, Upload } from 'lucide-react';
import { LoadingState } from '../components/LoadingState';
import { useDocuments } from '../context/DocumentsContext';
import { DocumentCard } from '../components/DocumentCard';

export function DocumentsPage() {
  const { documents, uploadDocument, isLoading, error } = useDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      try {
        setUploadError(null);
        console.log('Intentando subir archivo:', file.name);
        await uploadDocument(file);
      } catch (error) {
        console.error('Error al subir el archivo:', error);
        // Mostrar un mensaje de error más amigable
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir el archivo';
        setUploadError(
          errorMessage.includes('{') 
            ? 'Error al subir el archivo. Por favor, verifica el formato y tamaño del archivo.' 
            : errorMessage
        );
      }
    }
  };

  const filteredDocuments = Array.isArray(documents) 
    ? documents.filter(doc => doc.filename.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Documentos
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus documentos y archivos
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-8">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar documentos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Upload area */}
      <label 
        className={`
          block w-full border-2 border-dashed rounded-lg p-12 mb-12
          transition-colors duration-200 cursor-pointer
          hover:bg-muted/50
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted/25'}
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="hidden"
          accept={allowedTypes.join(',')}
          multiple
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
        />
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">
            Arrastra y suelta tus documentos aquí
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            o haz clic para seleccionar archivos
          </p>
          <p className="text-xs text-muted-foreground">
            Formatos soportados: PDF, DOC, DOCX, TXT
          </p>
          {uploadError && (
            <p className="text-sm text-destructive mt-2">{uploadError}</p>
          )}
        </div>
      </label>

      {/* Documents grid */}
      {isLoading ? (
        <LoadingState message="Cargando documentos..." />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(doc => (
            <div key={doc.id}>
              <DocumentCard document={doc} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No hay documentos
          </h3>
          <p className="text-muted-foreground">
            Sube tu primer documento para empezar
          </p>
        </div>
      )}
    </div>
  );
} 