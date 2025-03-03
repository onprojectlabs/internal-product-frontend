import { useUpload } from '../context/UploadContext';
import { Progress } from './ui/Progress';
import { X } from 'lucide-react';

export function UploadProgress() {
  const { uploads, removeUpload } = useUpload();

  const activeUploads = uploads.filter(
    upload => upload.status === 'uploading' || upload.status === 'processing'
  );

  if (activeUploads.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">
            Subiendo {activeUploads.length} {activeUploads.length === 1 ? 'archivo' : 'archivos'}
          </h3>
          <button 
            onClick={() => activeUploads.forEach(upload => removeUpload(upload.id))}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {activeUploads.map(upload => (
            <div key={upload.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium truncate flex-1 pr-2">
                  {upload.name}
                </span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {upload.progress}%
                </span>
              </div>
              <Progress value={upload.progress || 0} />
              <p className="text-xs text-muted-foreground">
                {upload.status === 'processing' ? 'Procesando...' : 'Subiendo...'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 