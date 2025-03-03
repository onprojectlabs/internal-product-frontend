import { useState, useEffect } from 'react';
import { FileVideo, Search as SearchIcon, Upload, FolderIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/LoadingState';
import { Link } from 'react-router-dom';
import { useUpload } from '../context/UploadContext';
import { Clip, useClips } from '../context/ClipsContext';
import { FolderAssignment } from '../components/FolderAssignment';
import { foldersService } from '../services/folders/foldersService';

interface Folder {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

// Componente para la tarjeta de clip
function ClipCard({ clip }: { clip: Clip }) {
  const { updateClip } = useClips();
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  
  useEffect(() => {
    const fetchFolder = async () => {
      if (clip.folderId) {
        setIsLoadingFolder(true);
        try {
          const folder = await foldersService.getFolder(clip.folderId);
          setCurrentFolder(folder);
        } catch (error) {
          console.error('Error al cargar la carpeta:', error);
        } finally {
          setIsLoadingFolder(false);
        }
      } else {
        setCurrentFolder(null);
      }
    };

    fetchFolder();
  }, [clip.folderId]);

  const handleAssignFolder = async (folderId: string) => {
    try {
      // Solo actualizamos el folderId
      await updateClip(clip.id, { 
        folderId,
        description: clip.description,
        date: clip.date,
        status: clip.status
      });
      const folder = await foldersService.getFolder(folderId);
      setCurrentFolder(folder);
    } catch (error) {
      console.error('Error al asignar carpeta:', error);
    }
  };

  return (
    <div className="bg-card hover:bg-card/90 transition-colors rounded-lg p-4 border border-border">
      {/* Área clickeable para navegar */}
      <div className="mb-4">
        <Link 
          to={`/clip/${clip.id}`}
          state={{ from: { type: 'clips', path: '/clips' } }}
          className="block"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <FileVideo className="h-5 w-5 text-primary shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate mb-1">{clip.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{clip.date.toLocaleDateString()}</span>
                  <span>{clip.duration}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Información de la carpeta */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setIsSelectingFolder(true)}
        >
          <FolderIcon className="h-4 w-4" />
          {isLoadingFolder ? (
            'Cargando...'
          ) : currentFolder ? (
            currentFolder.name
          ) : (
            'Sin carpeta'
          )}
        </Button>
      </div>

      <FolderAssignment
        open={isSelectingFolder}
        onOpenChange={setIsSelectingFolder}
        onAssign={handleAssignFolder}
      />
    </div>
  );
}

export function ClipsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { clips, addClip } = useClips();
  const { uploads, addUpload, updateUpload, removeUpload } = useUpload();

  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'
  ];

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    uploads.forEach(upload => {
      if (upload.status === 'completed' && upload.type === 'clip') {
        const newClip: Clip = {
          id: upload.id,
          title: upload.name,
          description: '',
          date: new Date(),
          duration: (upload.metadata?.duration || 0).toString(),
          status: {
            isProcessing: false,
            hasTranscription: false,
            isUploading: false
          }
        };

        addClip(newClip);
        removeUpload(upload.id);
      }
    });
  }, [uploads, removeUpload, addClip]);

  const simulateUpload = (file: File) => {
    const uploadId = Math.random().toString(36).substring(7);
    
    addUpload({
      id: uploadId,
      name: file.name,
      type: 'clip',
      status: 'uploading',
      progress: 0
    });

    let progress = 0;
    const interval = setInterval(() => {
      progress = Math.min(progress + 10, 100);
      updateUpload(uploadId, { progress });

      if (progress === 100) {
        clearInterval(interval);
        setTimeout(() => {
          updateUpload(uploadId, {
            status: 'completed',
            url: URL.createObjectURL(file),
            metadata: { duration: 0 }
          });
        }, 500);
      }
    }, 300);
  };

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

    validFiles.forEach(simulateUpload);
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

  const filteredClips = clips.filter(clip =>
    clip.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Upload Progress */}
      {uploads.filter(u => u.type === 'clip').map(clip => (
        <div key={clip.id} className="bg-card p-4 rounded-lg mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{clip.name}</span>
            <span className="text-sm text-muted-foreground">
              {clip.status === 'uploading' ? `${clip.progress}%` : 
               clip.status === 'processing' ? 'Procesando...' : 
               'Completado'}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${clip.progress}%` }}
            />
          </div>
        </div>
      ))}

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

        {/* Clips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClips.map(clip => (
            <div key={clip.id}>
              <ClipCard clip={clip} />
            </div>
          ))}
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