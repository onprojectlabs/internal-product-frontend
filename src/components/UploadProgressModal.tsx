import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useUpload } from '../context/UploadContext'
import { useState } from 'react'
import { CancelUploadModal } from './CancelUploadModal'

export function UploadProgressModal() {
  const { activeUploads, setActiveUploads, setUploadedFiles } = useUpload()
  const [uploadToCancel, setUploadToCancel] = useState<{ id: string; fileName: string } | null>(null)

  const handleCancelClick = (uploadId: string, fileName: string) => {
    setUploadToCancel({ id: uploadId, fileName })
  }

  const handleConfirmCancel = () => {
    if (uploadToCancel) {
      setUploadedFiles(prev => 
        prev.map(file => 
          file.name === uploadToCancel.fileName
            ? { ...file, status: 'Cancelado' }
            : file
        )
      )

      setActiveUploads(prev => prev.filter(upload => upload.id !== uploadToCancel.id))
      setUploadToCancel(null)
    }
  }

  const handleCloseModal = () => {
    setUploadToCancel(null)
  }

  return (
    <>
      {activeUploads.map((upload) => (
        <div
          key={upload.id}
          className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg w-96 overflow-hidden z-50"
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate max-w-[250px]">
                  {upload.file.name}
                </h3>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  Beta
                </span>
              </div>
              <button
                onClick={() => handleCancelClick(upload.id, upload.file.name)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              {upload.status === 'completed' 
                ? 'Su archivo se ha subido correctamente'
                : 'Su archivo está viajando a través de nuestra fase de procesamiento. Lo estamos preparando.'}
            </p>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                  {upload.file.name}
                </span>
                <span className="text-sm text-gray-500">
                  {(upload.file.size / (1024 * 1024)).toFixed(2)} MB/{(upload.file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              
              {upload.status === 'completed' ? (
                <div className="flex justify-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
              ) : (
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      <CancelUploadModal
        isOpen={uploadToCancel !== null}
        onClose={handleCloseModal}
        onConfirm={handleConfirmCancel}
        fileName={uploadToCancel?.fileName || ''}
      />
    </>
  )
} 