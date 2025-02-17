import React, { createContext, useContext, useState, ReactNode } from 'react'

interface ActiveUpload {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  createdAt: string
}

interface UploadedFile {
  name: string
  createdAt: string
  fileType: string
  status: 'Subido' | 'En progreso' | 'Cancelado'
  size: number
  type: string
}

interface UploadContextType {
  uploadedFiles: UploadedFile[]
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
  activeUploads: ActiveUpload[]
  setActiveUploads: React.Dispatch<React.SetStateAction<ActiveUpload[]>>
}

const UploadContext = createContext<UploadContextType | undefined>(undefined)

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([])

  return (
    <UploadContext.Provider
      value={{
        uploadedFiles,
        setUploadedFiles,
        activeUploads,
        setActiveUploads,
      }}
    >
      {children}
    </UploadContext.Provider>
  )
}

export function useUpload() {
  const context = useContext(UploadContext)
  if (context === undefined) {
    throw new Error('useUpload must be used within a UploadProvider')
  }
  return context
} 