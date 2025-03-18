import { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, Search as SearchIcon, Upload, RefreshCw } from 'lucide-react';
import { LoadingState } from '../../components/common/LoadingState';
import { useDocuments } from '../../context/DocumentsContext';
import { useDocumentWebSocket } from '../../context/DocumentWebSocketContext';
import { DocumentCard } from '../../components/documents/DocumentCard';
import { DocumentStatus, Document } from '../../types/documents';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '../../components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/Popover';
import { cn } from '../../lib/utils';
import { documentsService } from '../../services/documents/documentsService';

export function DocumentsPage() {
  const { 
    documents, 
    total,
    isLoading, 
    error,
    filters,
    setFilters
  } = useDocuments();
  
  const { connectWebSocket, disconnectWebSocket } = useDocumentWebSocket();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | ''>('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  // Usar un Set para rastrear qué documentos ya intentamos conectar
  const attemptedConnections = useRef<Set<string>>(new Set());

  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];

  const updateFilters = useCallback(() => {
    setFilters({
      limit: 100,
      skip: 0,
      status: selectedStatus || undefined,
      start_date: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      filename: searchQuery || undefined
    });
  }, [selectedStatus, startDate, endDate, searchQuery, setFilters]);

  useEffect(() => {
    setFilters({
      limit: 100,
      skip: 0
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery || selectedStatus || startDate || endDate) {
        updateFilters();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatus, startDate, endDate, updateFilters]);

  useEffect(() => {
    documents.forEach(doc => {
      if ((doc.status === 'processing' || doc.status === 'uploaded') && 
          !attemptedConnections.current.has(doc.id)) {
        connectWebSocket(doc);
        attemptedConnections.current.add(doc.id);
      }
    });
  }, [documents, connectWebSocket]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      try {
        setUploadError(null);
        console.log('Intentando subir archivo:', file.name);
        const uploadedDoc = await documentsService.uploadDocument(file);
        
        // Iniciar WebSocket para el documento recién subido (si aún no lo hemos intentado)
        if (!attemptedConnections.current.has(uploadedDoc.id)) {
          connectWebSocket(uploadedDoc);
          attemptedConnections.current.add(uploadedDoc.id);
        }
        
        // Actualizar la lista de documentos después de subir
        updateFilters();
      } catch (error) {
        console.error('Error al subir el archivo:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir el archivo';
        setUploadError(
          errorMessage.includes('{') 
            ? 'Error al subir el archivo. Por favor, verifica el formato y tamaño del archivo.' 
            : errorMessage
        );
      }
    }
  };

  const clearFilters = () => {
    setSelectedStatus('');
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchQuery('');
  };

  const handleReconnect = (doc: Document) => {
    disconnectWebSocket(doc.id);
    setTimeout(() => {
      connectWebSocket(doc);
    }, 500); // Esperar 500ms para asegurar que la desconexión se complete
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Documentos
          </h1>
          <p className="text-muted-foreground">
            {total} documentos en total
          </p>
        </div>
        <div className="flex gap-2">
          {/* Buttons for other actions can be added here if needed */}
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-4 mb-8">
        {/* Barra de búsqueda */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Área de filtros */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filtro de estado */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as DocumentStatus | '')}
            className="bg-muted rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los estados</option>
            <option value="uploaded">Subido</option>
            <option value="processing">Procesando</option>
            <option value="processed">Procesado</option>
            <option value="failed">Fallido</option>
          </select>

          {/* Filtro de fecha inicial */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                {startDate ? (
                  format(startDate, "d 'de' MMMM, yyyy", { locale: es })
                ) : (
                  "Fecha inicial"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Filtro de fecha final */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                {endDate ? (
                  format(endDate, "d 'de' MMMM, yyyy", { locale: es })
                ) : (
                  "Fecha final"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Botón para limpiar filtros */}
          {(selectedStatus || startDate || endDate || searchQuery) && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Upload area */}
      <label 
        className={`
          block w-full border-2 border-dashed rounded-lg p-12 mb-12
          transition-colors duration-200 cursor-pointer
          hover:bg-muted/50
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted/25'}
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
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
        />
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">
            Arrastra y suelta tus documentos aquí
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            o haz clic para seleccionar archivos
          </p>
          <p className="text-xs text-muted-foreground">
            Formatos soportados: PDF, DOC, DOCX, TXT
          </p>
          {uploadError && (
            <p className="text-sm text-destructive mt-2">{uploadError}</p>
          )}
        </div>
      </label>

      {/* Documents grid */}
      {isLoading ? (
        <LoadingState message="Cargando documentos..." />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => setFilters({ ...filters })}
            className="text-primary hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <div key={doc.id} className="relative">
              <DocumentCard document={doc} />
              
              {/* Botón de reconexión para el documento */}
              {(doc.status === 'processing' || doc.status === 'uploaded') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleReconnect(doc);
                  }}
                  className="absolute top-3 right-3 p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full"
                  title="Forzar reconexión WebSocket"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No hay documentos
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedStatus || startDate || endDate
              ? 'No se encontraron documentos con los filtros seleccionados'
              : 'Sube tu primer documento para empezar'}
          </p>
        </div>
      )}
    </div>
  );
} 