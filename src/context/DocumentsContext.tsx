import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Document } from '../types/documents';
import { documentsService } from '../services/documentsService';

interface DocumentsContextType {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  uploadDocument: (file: File, description?: string) => Promise<Document>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<Document>;
  deleteDocument: (id: string) => Promise<boolean>;
  refreshDocuments: () => Promise<void>;
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedDocuments = await documentsService.getDocuments();
      setDocuments(loadedDocuments);
    } catch (err) {
      console.error('Error al cargar los documentos:', err);
      setError('Error al cargar los documentos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshDocuments();
  }, []);

  const uploadDocument = async (file: File, description?: string) => {
    try {
      const newDocument = await documentsService.uploadDocument(file, description);
      setDocuments(prev => [...prev, newDocument]);
      return newDocument;
    } catch (err) {
      console.error('Error al subir el documento:', err);
      throw err;
    }
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    try {
      const updatedDocument = await documentsService.updateDocument(id, updates);
      setDocuments(prev => 
        prev.map(doc => doc.id === id ? updatedDocument : doc)
      );
      return updatedDocument;
    } catch (err) {
      console.error('Error al actualizar el documento:', err);
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const success = await documentsService.deleteDocument(id);
      if (success) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      }
      return success;
    } catch (err) {
      console.error('Error al eliminar el documento:', err);
      throw err;
    }
  };

  return (
    <DocumentsContext.Provider value={{
      documents,
      isLoading,
      error,
      uploadDocument,
      updateDocument,
      deleteDocument,
      refreshDocuments
    }}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentsContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentsProvider');
  }
  return context;
} 