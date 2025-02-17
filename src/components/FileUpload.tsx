import { useState, useCallback } from 'react'
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  maxSize?: number // in bytes
}

const VALID_AUDIO_TYPES = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
]

const VALID_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/ogg',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/x-matroska', // .mkv
]

const VALID_EXTENSIONS = [
  // Audio
  '.mp3',
  '.wav',
  '.ogg',
  '.aac',
  '.m4a',
  // Video
  '.mp4',
  '.mpeg',
  '.webm',
  '.mov',
  '.avi',
  '.mkv',
]

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

export function FileUpload({ 
  onFileSelect, 
  maxSize = 100 * 1024 * 1024 // 100MB default
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isValidFile, setIsValidFile] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validateFileType = useCallback((file: File) => {
    // Check MIME type
    const isValidMimeType = [...VALID_AUDIO_TYPES, ...VALID_VIDEO_TYPES].includes(file.type)
    
    // Check file extension as fallback
    if (!isValidMimeType) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      return VALID_EXTENSIONS.includes(extension)
    }
    
    return isValidMimeType
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Check file type during drag
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true)
      if (e.dataTransfer.items.length > 0) {
        const item = e.dataTransfer.items[0]
        
        // Check if it's a file
        if (item.kind === 'file') {
          const file = item.getAsFile()
          console.log(file?.type)
          if (file) {
            // Check both MIME type and extension
            const isValid = validateFileType(file)
            setIsValidFile(isValid)
          }
        }
      }
    } else if (e.type === 'dragleave') {
      setIsDragging(false)
      setIsValidFile(null)
    }
  }, [validateFileType])

  const validateFile = useCallback((file: File) => {
    setError(null)
    
    // Check file type
    if (!validateFileType(file)) {
      setError('Formato no válido. Formatos permitidos: MP3, MP4, WAV, OGG, AAC, M4A, WEBM, MOV, AVI, MKV')
      return false
    }

    // Check file size
    if (file.size > maxSize) {
      setError(`El archivo debe ser menor a ${maxSize / (1024 * 1024)}MB`)
      return false
    }

    return true
  }, [validateFileType, maxSize])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setIsValidFile(null)

    const { files } = e.dataTransfer
    if (files && files[0]) {
      const file = files[0]
      if (validateFile(file)) {
        onFileSelect(file)
      }
    }
  }, [onFileSelect, validateFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target
    if (files && files[0]) {
      const file = files[0]
      if (validateFile(file)) {
        onFileSelect(file)
      }
    }
  }, [onFileSelect, validateFile])

  return (
    <>
      <div className="w-full h-full flex items-center justify-center p-8">
        <div
          className={`w-[80%] aspect-[16/9] flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors duration-200 ${
            isDragging 
              ? isValidFile
                ? 'border-primary-500 bg-primary-50'
                : 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-primary-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center flex flex-col items-center">
            <CloudArrowUpIcon 
              className={`h-20 w-20 mb-4 ${
                isDragging
                  ? isValidFile
                    ? 'text-primary-500'
                    : 'text-red-500'
                  : 'text-gray-400'
              }`} 
            />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Arrastra y suelta tus archivos aquí
            </h3>
            <p className="text-sm text-gray-500 mb-8">
              o
            </p>
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-primary-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2"
            >
              <span>Seleccionar archivo</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept={VALID_EXTENSIONS.join(',')}
                onChange={handleFileInput}
              />
            </label>
            <div className="mt-4 space-y-1 text-center">
              <p className="text-xs text-gray-500">
                Video o audio hasta {maxSize / (1024 * 1024)}MB
              </p>
              <p className="text-xs text-gray-500">
                Formatos: MP3, MP4, WAV, OGG, AAC, M4A, WEBM, MOV, AVI, MKV
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center bg-red-50 px-4 py-2 rounded-md shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-3 text-red-500 hover:text-red-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  )
} 