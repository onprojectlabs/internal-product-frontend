import { FileUpload } from '../components/FileUpload'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useUpload } from '../context/UploadContext'
import { useMeetings } from '../context/MeetingsContext'
import type { Meeting } from '../context/MeetingsContext'

// Definir los posibles estados como tipo
type FileStatus = 'Subiendo' | 'Transcribiendo' | 'Transcrito' | 'Cancelado';

function formatDate(date: Date): string {
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(',', '')
}

function getFileType(file: File): string {
  if (!file.type) {
    // If no MIME type, try to get it from extension
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension) {
      if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension)) return 'audio'
      if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension)) return 'video'
    }
    return 'unknown'
  }
  return file.type.split('/')[0] || 'unknown'
}

export function UploadPage() {
  const { setActiveUploads } = useUpload()
  const { addMeeting, meetings, removeMeeting, updateMeeting } = useMeetings()

  // Obtener los clips del contexto de reuniones
  const clipMeetings = meetings.filter(m => m.source === 'Clip')
  
  // Convertir las reuniones a formato de archivo subido
  const files = clipMeetings.map(meeting => ({
    name: meeting.title,
    createdAt: formatDate(meeting.date),
    fileType: 'video',
    status: meeting.status.isUploading 
        ? 'Subiendo'
        : meeting.status.isProcessing 
            ? 'Transcribiendo' 
            : meeting.status.hasTranscription
                ? 'Transcrito'
                : 'Cancelado',
    size: 0,
    type: 'video/mp4',
    id: meeting.id
  }))

  const handleFileSelect = async (file: File) => {
    const uploadId = crypto.randomUUID();
    
    // Crear el upload activo para mostrar el progreso de subida
    const newUpload = {
        id: uploadId,
        file,
        progress: 0,
        status: 'uploading' as const,
        createdAt: formatDate(new Date())
    };
    
    setActiveUploads(prev => [...prev, newUpload]);

    // Simular progreso de subida
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        
        if (progress <= 100) {
            setActiveUploads(prev => 
                prev.map(upload => 
                    upload.id === uploadId
                        ? { ...upload, progress, status: progress === 100 ? 'completed' : 'uploading' }
                        : upload
                )
            );

            if (progress === 100) {
                clearInterval(interval);
                
                // Una vez completada la subida, crear la reunión para transcripción
                const meeting: Meeting = {
                    id: uploadId,
                    title: file.name,
                    date: new Date(),
                    source: 'Clip',
                    uploadMethod: 'Manual',
                    currentStep: 'Transcribiendo',
                    progress: 0,
                    status: {
                        isUploading: false,       // Ya no está subiendo
                        isProcessing: true,       // Comienza la transcripción
                        isFinished: false,
                        hasTranscription: false,
                        hasSummary: false,
                        transcriptionStarted: false
                    }
                };
                
                // Añadir al contexto de reuniones para comenzar transcripción
                addMeeting(meeting);

                // Limpiar el upload activo después de un momento
                setTimeout(() => {
                    setActiveUploads(prev => prev.filter(u => u.id !== uploadId));
                }, 2000);
            }
        }
    }, 500);
  }

  const removeFile = (id: string) => {
    // Eliminar del contexto de reuniones en lugar de uploadedFiles
    removeMeeting(id);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-8">Subir clips</h1>
      
      <FileUpload onFileSelect={handleFileSelect} />

      {files.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-medium mb-4">Archivos subidos</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creado a las
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método de subida
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{file.createdAt}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Manual</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        file.status === 'Transcrito' 
                            ? 'bg-green-100 text-green-800'
                            : file.status === 'Transcribiendo'
                                ? 'bg-blue-100 text-blue-800'
                                : file.status === 'Subiendo'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                      }`}>
                        {file.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
} 