import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Document, DocumentStatus } from '../types/documents';
import { documentsService } from '../services/documentsService';
import { useAuth } from './AuthContext';

interface DocumentsState {
  documents: Document[];
  total: number;
  isLoading: boolean;
  error: string | null;
}

interface DocumentsFilters {
  limit?: number;
  skip?: number;
  folder_id?: string;
  status?: DocumentStatus;
  start_date?: string;
  end_date?: string;
  filename?: string;
}

interface DocumentsContextType extends DocumentsState {
  filters: DocumentsFilters;
  setFilters: (filters: DocumentsFilters) => void;
  uploadDocument: (file: File, description?: string) => Promise<Document>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<Document>;
  deleteDocument: (id: string) => Promise<boolean>;
  refreshDocuments: () => Promise<void>;
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 segundos

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const [state, setState] = useState<DocumentsState>({
    documents: [],
    total: 0,
    isLoading: false,
    error: null
  });

  const [filters, setFilters] = useState<DocumentsFilters>({
    limit: 100,
    skip: 0
  });

  const retryCount = useRef<number>(0);
  const retryTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const shouldFetch = useRef<boolean>(true);

  const refreshDocuments = async () => {
    if (!shouldFetch.current) {
      shouldFetch.current = true;
      return;
    }

    if (state.isLoading) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await documentsService.getDocuments(filters);
      setState(prev => ({
        ...prev,
        documents: response.items,
        total: response.total,
        isLoading: false,
        error: null
      }));
      retryCount.current = 0;
    } catch (error) {
      console.error('Error al cargar los documentos:', error);
      
      if (error instanceof Error && error.message.includes('No tienes autorización')) {
        logout();
        return;
      }

      if (error instanceof Error && 
          error.message.includes('no está disponible') && 
          retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        setState(prev => ({
          ...prev,
          error: `Error de conexión. Reintentando en ${RETRY_DELAY/1000} segundos... (Intento ${retryCount.current}/${MAX_RETRIES})`,
          isLoading: true
        }));

        if (retryTimeout.current) {
          clearTimeout(retryTimeout.current);
        }

        retryTimeout.current = setTimeout(refreshDocuments, RETRY_DELAY);
        return;
      }

      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al cargar los documentos',
        isLoading: false
      }));
    }
  };

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    };
  }, []);

  // Cargar documentos cuando cambian los filtros
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
    }
    retryCount.current = 0;
    refreshDocuments();
  }, [filters]);

  // Escuchar cambios en el token de acceso
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' && e.newValue) {
        retryCount.current = 0;
        if (retryTimeout.current) {
          clearTimeout(retryTimeout.current);
        }
        shouldFetch.current = true;
        refreshDocuments();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const uploadDocument = async (file: File, description?: string) => {
    try {
      const newDocument = await documentsService.uploadDocument(file, description);
      setState(prev => ({
        ...prev,
        documents: [...prev.documents, newDocument],
        total: prev.total + 1
      }));
      return newDocument;
    } catch (error) {
      if (error instanceof Error && error.message.includes('No tienes autorización')) {
        logout();
        throw error;
      }
      console.error('Error al subir el documento:', error);
      throw error;
    }
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    try {
      const updatedDocument = await documentsService.updateDocument(id, updates);
      setState(prev => ({
        ...prev,
        documents: prev.documents.map(doc => 
          doc.id === id ? updatedDocument : doc
        )
      }));
      return updatedDocument;
    } catch (error) {
      if (error instanceof Error && error.message.includes('No tienes autorización')) {
        logout();
        throw error;
      }
      console.error('Error al actualizar el documento:', error);
      throw error;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const success = await documentsService.deleteDocument(id);
      if (success) {
        setState(prev => ({
          ...prev,
          documents: prev.documents.filter(doc => doc.id !== id),
          total: prev.total - 1
        }));
      }
      return success;
    } catch (error) {
      if (error instanceof Error && error.message.includes('No tienes autorización')) {
        logout();
        throw error;
      }
      console.error('Error al eliminar el documento:', error);
      throw error;
    }
  };

  return (
    <DocumentsContext.Provider value={{
      ...state,
      filters,
      setFilters,
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