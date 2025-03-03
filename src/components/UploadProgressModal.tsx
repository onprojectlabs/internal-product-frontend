import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { useUpload } from '../context/UploadContext';
import { Progress } from './ui/Progress';

export function UploadProgressModal() {
  const { uploads, isModalOpen, setModalOpen } = useUpload();

  const activeUploads = uploads.filter(
    upload => upload.status === 'uploading' || upload.status === 'processing'
  );

  if (activeUploads.length === 0) {
    return null;
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subiendo archivos</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Por favor, espera mientras se suben tus archivos.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {activeUploads.map(upload => (
            <div key={upload.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium truncate">
                  {upload.name}
                </span>
                <span className="text-muted-foreground">
                  {upload.progress}%
                </span>
              </div>
              <Progress value={upload.progress} />
              <p className="text-xs text-muted-foreground">
                {upload.status === 'processing' ? 'Procesando...' : 'Subiendo...'}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 