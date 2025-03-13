import { useState, useEffect } from 'react';
import { FileVideo, Search as SearchIcon, Upload } from 'lucide-react';
import { LoadingState } from '../../components/common/LoadingState';

export function ClipsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'
  ];

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const clearFileInput = () => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFileSelect = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(file => 
      allowedTypes.includes(file.type)
    );

    if (validFiles.length === 0) {
      alert('Por favor, selecciona archivos de video válidos (MP4, WebM, OGG, MOV)');
      return;
    }

    clearFileInput();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
    clearFileInput();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingState message="Cargando clips..." />
      </div>
    );
  }

  const filteredClips = [];

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Clips
          </h1>
          <p className="text-muted-foreground">
            Gestiona y organiza tus clips de video
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar clips..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Drag & Drop Zone */}
      <label 
        className={`
          block w-full border-2 border-dashed rounded-lg p-12 mb-12
          transition-colors duration-200 cursor-pointer
          hover:bg-muted/50
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted/25'
          }
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
          onChange={(e) => handleFileSelect(e.target.files || [])}
        />
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">
            Arrastra y suelta tus archivos aquí
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            o haz clic para seleccionar archivos
          </p>
          <p className="text-xs text-muted-foreground">
            Formatos soportados: MP4, WebM, OGG, MOV
          </p>
        </div>
      </label>

      {/* Clips Section */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <FileVideo className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Tus clips</h2>
        </div>
      </div>

      {filteredClips.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FileVideo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No se encontraron clips
          </h3>
          <p className="text-muted-foreground">
            {searchQuery 
              ? 'Intenta con otros términos de búsqueda'
              : 'Sube tu primer clip para empezar'}
          </p>
        </div>
      )}
    </div>
  );
} 