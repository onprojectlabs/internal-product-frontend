import { FileUpload } from '../components/FileUpload'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useUpload } from '../context/UploadContext'

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
  const { uploadedFiles, setUploadedFiles, setActiveUploads } = useUpload()

  const handleFileSelect = (file: File) => {
    const fileType = getFileType(file)
    const uploadId = Math.random().toString(36).substr(2, 9)
    
    // Create a map to store intervals
    const intervals = new Map()

    const newUpload = {
      id: uploadId,
      file,
      progress: 0,
      status: 'uploading' as const,
      createdAt: formatDate(new Date())
    }
    
    setActiveUploads(prev => [...prev, newUpload])
    setUploadedFiles(prev => [...prev, { 
      name: file.name,
      size: file.size,
      type: file.type,
      createdAt: newUpload.createdAt,
      fileType,
      status: 'En progreso'
    }])

    // Simulate upload progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      
      if (progress <= 100) {
        setActiveUploads(prev => {
          const updatedUploads = prev.map(upload => {
            if (upload.id === newUpload.id) {
              // If the upload was canceled, clear the interval
              if (!prev.some(u => u.id === newUpload.id)) {
                clearInterval(interval)
                return upload
              }
              
              return { 
                ...upload, 
                progress,
                status: progress === 100 ? 'completed' as const : 'uploading' as const
              }
            }
            return upload
          })

          // Store the interval ID
          intervals.set(uploadId, interval)

          return updatedUploads
        })

        if (progress === 100) {
          setUploadedFiles(prev => {
            // Only update to 'Subido' if the file hasn't been canceled
            const currentFile = prev.find(f => f.name === file.name)
            if (currentFile && currentFile.status !== 'Cancelado') {
              return prev.map(f => 
                f.name === file.name
                  ? { ...f, status: 'Subido' }
                  : f
              )
            }
            return prev
          })
          
          setTimeout(() => {
            setActiveUploads(prev => prev.filter(upload => upload.id !== newUpload.id))
            // Clear the interval when upload is complete
            if (intervals.has(uploadId)) {
              clearInterval(intervals.get(uploadId))
              intervals.delete(uploadId)
            }
          }, 2000)
          
          clearInterval(interval)
        }
      }
    }, 500)

    // Store the initial interval
    intervals.set(uploadId, interval)
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen w-full">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">Subidas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sube tus archivos de video o audio para procesarlos
        </p>
      </div>

      <div className="flex-1 bg-white min-h-[calc(100vh-12rem)] w-full">
        <FileUpload onFileSelect={handleFileSelect} />

        <div className="px-8 py-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Archivos subidos</h2>
          <div className="w-full">
            <div className="grid grid-cols-4 gap-4 py-2 text-sm text-gray-500 border-b border-gray-200">
              <div>Nombre</div>
              <div>Creado a las</div>
              <div>Método de subida</div>
              <div>Estado</div>
            </div>
            <div className="divide-y divide-gray-200">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 py-4 items-center">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {file.fileType}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {file.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">{file.createdAt}</div>
                  <div className="text-sm text-gray-500">Manual</div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      file.status === 'Subido' 
                        ? 'bg-green-100 text-green-800'
                        : file.status === 'Cancelado'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {file.status}
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-500 bg-black bg-opacity-5 rounded-md p-1"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 