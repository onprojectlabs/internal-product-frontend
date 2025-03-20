import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { 
  FileText,
  Clock,
  Download,
  Sparkles,
  Eye,
  Globe,
  Plus
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Document, 
  DocumentStatus, 
  DocumentTranslation, 
  DocumentProcessingMessage, 
  DocumentTranslationMessage,
  TranslationStatus
} from '../../types/documents';
import { documentsService, Language } from '../../services/documents/documentsService';
import { useDocumentWebSocket } from '../../context/DocumentWebSocketContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";
import { useAuth } from '../../context/AuthContext';

export function DocumentPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;
  const { user } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<DocumentTranslation | null>(null);
  const [availableTranslations, setAvailableTranslations] = useState<DocumentTranslation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newTranslationOpen, setNewTranslationOpen] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  
  // Variables para WebSocket
  const { connectWebSocket, getDocumentStatus, connectTranslationWebSocket } = useDocumentWebSocket();
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  const [localDocumentState, setLocalDocumentState] = useState<DocumentStatus | null>(null);
  const [localProgressPercentage, setLocalProgressPercentage] = useState<number>(0);
  const [currentTranslationLanguage, setCurrentTranslationLanguage] = useState('');
  const [currentTranslationStatus, setCurrentTranslationStatus] = useState<TranslationStatus | null>(null);

  // Crear un mapa de códigos de idioma a nombres para fácil acceso
  const languageMap = useMemo(() => {
    const map: Record<string, string> = {};
    languages.forEach(lang => {
      map[lang.code.toLowerCase()] = lang.name;
    });
    return map;
  }, [languages]);

  // Función para obtener el nombre del idioma a partir del código
  const getLanguageName = (code: string): string => {
    if (!code) return '';
    const lowerCode = code.toLowerCase();
    // Buscar en los datos obtenidos de la API
    return languageMap[lowerCode] || code.toUpperCase();
  };

  // Cargar idiomas disponibles
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const langData = await documentsService.getAvailableLanguages();
        if (langData && langData.length > 0) {
          setLanguages(langData);
          console.log("Idiomas cargados:", langData);
        }
      } catch (error) {
        console.error('Error al cargar los idiomas:', error);
      }
    };
    
    loadLanguages();
  }, []);

  useEffect(() => {
    if (id) {
      const loadDocument = async () => {
        try {
          setIsLoading(true);
          setLoadError(null);
          console.log(`Intentando cargar documento con ID: ${id}`);
          
          const doc = await documentsService.getDocument(id);
          
          if (doc) {
            console.log("Documento cargado exitosamente:", doc);
            setDocument(doc);
            setLocalDocumentState(doc.status);
            
            if (doc.translations && doc.translations.length > 0) {
              setAvailableTranslations(doc.translations);
              
              // Intentar encontrar la traducción en el idioma por defecto del usuario
              const userDefaultLang = user?.default_language || 'en';
              const defaultTranslation = doc.translations.find(t => t.language_code === userDefaultLang);
              
              // Si no se encuentra, usar la primera disponible
              setSelectedTranslation(defaultTranslation || doc.translations[0]);
            }
          } else {
            console.error(`No se pudo encontrar el documento con ID: ${id}`);
            setLoadError(`No se pudo encontrar el documento con ID: ${id}`);
          }
        } catch (error) {
          console.error('Error al cargar el documento:', error);
          setLoadError(error instanceof Error ? error.message : 'Error desconocido al cargar el documento');
        } finally {
          setIsLoading(false);
        }
      };
      loadDocument();
    }
  }, [id, user?.default_language]);

  // Conexión WebSocket para documento en procesamiento
  useEffect(() => {
    if (!document || !id) return;
    
    // No conectar si el documento ya está en estado final
    const isDocumentInFinalState = document.status === 'processed' || document.status === 'failed';
    if (isDocumentInFinalState) return;
    
    // Conectar WebSocket si el documento está en procesamiento o subido
    if ((document.status === 'processing' || document.status === 'uploaded') && !connectionAttempted) {
      connectWebSocket(document);
      setConnectionAttempted(true);
    }
  }, [document, id, connectWebSocket, connectionAttempted]);

  // Función para actualizar el documento desde la API
  const updateDocumentFromAPI = useCallback((): Promise<void> => {
    if (!id) return Promise.resolve();
    
    // Forzar actualización del documento desde API
    return documentsService.getDocument(id).then(updatedDoc => {
      if (updatedDoc) {
        setDocument(updatedDoc);
        setLocalDocumentState(updatedDoc.status);
        
        if (updatedDoc.translations && updatedDoc.translations.length > 0) {
          setAvailableTranslations(updatedDoc.translations);
          
          // Mantener la traducción seleccionada si existe en las actualizadas
          if (selectedTranslation) {
            const updatedTranslation = updatedDoc.translations.find(
              t => t.language_code === selectedTranslation.language_code
            );
            setSelectedTranslation(updatedTranslation || updatedDoc.translations[0]);
          } else {
            // Buscar traducción en el idioma por defecto del usuario
            const userDefaultLang = user?.default_language || 'en';
            const defaultTranslation = updatedDoc.translations.find(
              t => t.language_code === userDefaultLang
            );
            setSelectedTranslation(defaultTranslation || updatedDoc.translations[0]);
          }
        }
      }
    }).catch(error => {
      console.error('Error al actualizar el documento después de procesamiento:', error);
    });
  }, [id, selectedTranslation, user]);

  // Actualizar estado local cuando hay cambios en WebSocket
  useEffect(() => {
    if (!id) return;
    
    const wsStatus = getDocumentStatus(id);
    if (wsStatus) {
      console.log('Recibido mensaje WebSocket:', wsStatus);
      
      // Actualizar estado según el tipo de mensaje
      if (wsStatus.task_type === 'document_processing') {
        const docStatus = wsStatus as DocumentProcessingMessage;
        
        // Actualizar estado del documento
        if (docStatus.status) {
          setLocalDocumentState(docStatus.status);
          
          // Si el documento ha fallado, guardamos esta información para evitar que se sobrescriba
          if (docStatus.status === 'failed') {
            console.log(`[${new Date().toISOString()}] Documento marcado como FALLIDO por WebSocket:`, docStatus);
            
            // Actualizar el documento local para incluir los detalles del error
            setDocument(prev => {
              if (!prev) return null;
              
              const errorDetails = docStatus.error || {
                timestamp: new Date().toISOString(),
                error_type: 'Unknown',
                error_message: docStatus.current_stage || 'Error desconocido durante el procesamiento'
              };
              
              return {
                ...prev,
                status: 'failed',
                error_details: errorDetails,
                current_stage: docStatus.current_stage || 'Error'
              };
            });
          }
        }
        
        // Actualizar porcentaje
        if (docStatus.progress_percentage !== undefined) {
          setLocalProgressPercentage(docStatus.progress_percentage);
        }
        
        // Si recibimos un estado final desde el WebSocket, actualizar el documento completo
        if (docStatus.status === 'processed' || docStatus.progress_percentage === 100) {
          // Solo actualizamos desde API si el estado no es 'failed'
          updateDocumentFromAPI();
        } else if (docStatus.status === 'failed') {
          // Si es un fallo, guardamos una referencia a este estado para asegurarnos de mantenerlo
          const errorInfo = {
            status: 'failed',
            error: docStatus.error,
            current_stage: docStatus.current_stage
          };
          
          // Actualizar desde API pero conservando el estado de error
          updateDocumentFromAPI().then(() => {
            // Después de la actualización, nos aseguramos de que el estado siga siendo "failed"
            setLocalDocumentState('failed');
            
            // Y actualizamos el documento con los detalles del error si la API no los incluyó
            setDocument(prev => {
              if (!prev) return null;
              
              // Solo actualizar si el status no es "failed" o si no hay detalles de error
              if (prev.status !== 'failed' || !prev.error_details) {
                return {
                  ...prev,
                  status: 'failed',
                  error_details: errorInfo.error || {
                    error_message: errorInfo.current_stage || 'Error desconocido',
                    error_type: 'UnknownError',
                    timestamp: new Date().toISOString()
                  }
                };
              }
              
              return prev;
            });
          });
        }
      } else if (wsStatus.task_type === 'document_translation') {
        const translationStatus = wsStatus as DocumentTranslationMessage;
        
        console.log('Estado de traducción:', translationStatus.status, 'Idioma:', translationStatus.target_language, 'Progreso:', translationStatus.progress_percentage);
        
        // Actualizar porcentaje para mostrar el progreso de traducción
        if (translationStatus.progress_percentage !== undefined) {
          setLocalProgressPercentage(translationStatus.progress_percentage);
        }
        
        // Guarda el idioma de destino de la traducción actual
        setCurrentTranslationLanguage(translationStatus.target_language);
        
        // Guarda el estado actual de la traducción
        setCurrentTranslationStatus(translationStatus.status);
        
        // Si la traducción ha terminado, actualizar el documento para obtener la nueva traducción
        if (translationStatus.status === 'completed' || translationStatus.status === 'failed' || translationStatus.progress_percentage === 100) {
          console.log(`Traducción a ${translationStatus.target_language} terminada, actualizando documento...`);
          
          // Actualizar el documento desde la API
          updateDocumentFromAPI().then(() => {
            // Cuando la traducción se completa, seleccionar automáticamente la nueva traducción
            if (translationStatus.status === 'completed') {
              // Buscar la traducción recién completada por el idioma de destino
              const newLangCode = translationStatus.target_language;
              const newTranslation = availableTranslations.find(t => t.language_code === newLangCode);
              if (newTranslation) {
                console.log(`Seleccionando automáticamente la traducción a ${newLangCode}`);
                setSelectedTranslation(newTranslation);
              }
            }
            
            // Resetear los estados de traducción
            setCurrentTranslationLanguage('');
            setCurrentTranslationStatus(null);
          });
        }
      }
    }
  }, [id, getDocumentStatus, updateDocumentFromAPI, availableTranslations]);

  const handleBack = () => {
    if (from?.type === 'folder') {
      navigate(`/folder/${from.id}`);
    } else if (from?.path) {
      navigate(from.path);
    } else {
      navigate('/documents');
    }
  };

  const handleDownload = async () => {
    if (document) {
      try {
        await documentsService.downloadDocument(document.id, document.filename);
      } catch (error) {
        console.error('Error al descargar el documento:', error);
        alert('Error al descargar el documento');
      }
    }
  };

  const handlePreview = async () => {
    if (!document) return;

    setLoadingPreview(true);
    try {
      const url = await documentsService.getPreviewUrl(document.id);
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Error al cargar la vista previa:', error);
      alert('Error al cargar la vista previa');
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleTranslationSelect = (languageCode: string) => {
    const translation = availableTranslations.find(t => t.language_code === languageCode);
    if (translation) {
      setSelectedTranslation(translation);
    }
  };

  const handleCreateTranslation = async () => {
    if (!document || !id || !targetLanguage) return;
    
    setIsTranslating(true);
    
    try {
      // Preparar la interfaz para mostrar el progreso antes de iniciar la traducción
      setCurrentTranslationStatus('translating');
      setCurrentTranslationLanguage(targetLanguage);
      setLocalProgressPercentage(0);
      
      // Cerrar el diálogo
      setNewTranslationOpen(false);
      setTargetLanguage("");
      
      // Conectar al WebSocket para monitorear el progreso de la traducción
      // Usamos el método específico para traducciones que funciona incluso
      // cuando el documento está en estado 'processed'
      if (document) {
        console.log(`[${new Date().toISOString()}] Conectando WebSocket para monitorear traducción al ${targetLanguage}`);
        
        // Asegurarnos de que la conexión al WebSocket está activa
        connectTranslationWebSocket(document);
        setConnectionAttempted(true);
        
        console.log(`[${new Date().toISOString()}] Estado WebSocket: Conectado, esperando mensajes de progreso para traducción a ${targetLanguage}`);
      }
      
      // Iniciar la traducción - hacemos esto después de preparar la UI
      console.log(`[${new Date().toISOString()}] Iniciando solicitud de traducción al idioma ${targetLanguage}`);
      const newTranslation = await documentsService.translateDocument(id, targetLanguage);
      console.log(`[${new Date().toISOString()}] Respuesta de solicitud de traducción recibida:`, newTranslation);
      
      // Actualizar la lista de traducciones disponibles
      setAvailableTranslations(prev => {
        // Eliminar traducción existente del mismo idioma si existe
        const filtered = prev.filter(t => t.language_code !== targetLanguage);
        // Añadir la nueva traducción
        return [...filtered, newTranslation];
      });
      
      // No seleccionamos la nueva traducción inmediatamente, ya que la traducción
      // podría estar en proceso. Será seleccionada automáticamente cuando se complete.
      
      // Volver a verificar la conexión WebSocket al final
      setTimeout(() => {
        console.log(`[${new Date().toISOString()}] Verificando estado WebSocket después de iniciar traducción a ${targetLanguage}`);
        connectTranslationWebSocket(document);
      }, 1000);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error al traducir el documento:`, error);
      
      // Limpiar el estado de traducción en curso en caso de error
      setCurrentTranslationStatus(null);
      setCurrentTranslationLanguage('');
      
      // Mostrar mensaje específico si es un error de autenticación
      if (error instanceof Error && error.message.includes("No hay sesión activa")) {
        alert('Se requiere iniciar sesión para traducir documentos');
      } else {
        alert(`Error al traducir el documento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const renderPreviewContent = () => {
    if (!document) return null;

    if (loadingPreview) {
      return (
        <div className="text-center py-8">
          <LoadingState message="Cargando vista previa..." />
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4" />
          <p>Error al cargar la vista previa</p>
          <p className="text-sm mt-2">Intenta descargar el archivo</p>
        </div>
      );
    }

    switch (document.file_type.toLowerCase()) {
      case 'application/pdf':
      case 'pdf':
        return (
          <iframe
            src={previewUrl}
            className="w-full h-[80vh]"
            title={document.filename}
          />
        );

      case 'text/plain':
      case 'text/markdown':
        return (
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap p-6">
            {document.description || 'No hay contenido disponible'}
          </pre>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <p>Vista previa no disponible para este tipo de archivo</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <LoadingState message={`Cargando documento ${id}...`} />
          <p className="text-sm text-muted-foreground mt-4">
            Si la carga tarda demasiado, puedes <button onClick={handleBack} className="text-primary underline">volver</button>
          </p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-card/50 p-6 rounded-full mb-6">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Documento no encontrado</h1>
          <p className="text-muted-foreground mb-4">
            El documento con ID "{id}" no existe o ha sido eliminado
          </p>
          {loadError && (
            <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6 max-w-md text-left">
              <p className="font-medium">Error:</p>
              <p className="text-sm">{loadError}</p>
            </div>
          )}
          <Button onClick={handleBack}>Volver</Button>
        </div>
      </div>
    );
  }

  // Determinar el estado a mostrar
  const displayStatus = localDocumentState || document.status;
  const progressPercentage = localProgressPercentage;

  // Determinar si el documento ha fallado en el procesamiento
  const hasProcessingFailed = displayStatus === 'failed';

  // Determinar la visualización adecuada basada en el estado actual
  const shouldShowProcessingSection = 
    !hasProcessingFailed && 
    (displayStatus === 'uploaded' || displayStatus === 'processing') && 
    (!currentTranslationStatus || currentTranslationStatus === 'pending');
  
  const shouldShowTranslationSection = 
    !hasProcessingFailed && 
    currentTranslationStatus === 'translating' && 
    currentTranslationLanguage;
  
  const shouldShowTranslationsContent = 
    !hasProcessingFailed && 
    displayStatus === 'processed' && 
    availableTranslations.length > 0 && 
    currentTranslationStatus !== 'translating';

  return (
    <>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <button
            onClick={handleBack}
            className="p-2 bg-background hover:bg-muted rounded-lg transition-colors text-muted-foreground"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground truncate">
                {document.filename}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(document.created_at).toLocaleDateString()}</span>
              </div>
              <span>{document.file_type}</span>
              {document.file_size && (
                <span>{Math.round(document.file_size / 1024)} KB</span>
              )}
              <StatusBadge 
                status={displayStatus} 
                percentage={progressPercentage} 
                variant="small" 
              />
              {document.detected_language && (
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span>Idioma detectado: {getLanguageName(document.detected_language)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card del documento */}
            <div className="bg-card rounded-lg p-6">
              {/* Acciones del documento */}
              <div className="flex gap-4">
                <Button 
                  onClick={handlePreview}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={loadingPreview}
                >
                  <Eye className="h-4 w-4" />
                  Vista previa
                </Button>
                <Button 
                  onClick={handleDownload}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              </div>
            </div>

            {/* Sección de progreso de traducción (cuando está en curso) */}
            {shouldShowTranslationSection && (
              <div className="bg-card rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Traduciendo documento</h2>
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4" />
                  <p>{getLanguageName(currentTranslationLanguage)}: {localProgressPercentage}%</p>
                  <div className="w-full bg-muted rounded-full h-2.5 mt-4 mb-2">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${localProgressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm mt-2">La traducción puede tardar varios minutos, dependiendo del tamaño del documento</p>
                </div>
              </div>
            )}

            {/* Sección de traducciones si existen */}
            {shouldShowTranslationsContent && (
              <div className="bg-card rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Traducción</h2>
                    {selectedTranslation && (
                      <Select
                        value={selectedTranslation?.language_code}
                        onValueChange={handleTranslationSelect}
                      >
                        <SelectTrigger className="h-6 px-2 py-0 text-xs border-none bg-primary/10 text-primary rounded-full">
                          <span>{getLanguageName(selectedTranslation.language_code)}</span>
                        </SelectTrigger>
                        <SelectContent>
                          {availableTranslations.map((translation) => (
                            <SelectItem 
                              key={`${translation.id}-${translation.language_code}`} 
                              value={translation.language_code}
                              onClick={() => handleTranslationSelect(translation.language_code)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{getLanguageName(translation.language_code)}</span>
                                {translation.language_code === selectedTranslation?.language_code && (
                                  <span className="ml-2 text-primary">•</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {selectedTranslation && (
                      <span className="text-xs text-muted-foreground">
                        {selectedTranslation.translated_by === 'auto' 
                          ? '(traducción automática)' 
                          : '(traducción manual)'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setNewTranslationOpen(true)}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Traducir</span>
                    </Button>
                  </div>
                </div>

                {selectedTranslation ? (
                  <div className="space-y-6">
                    {selectedTranslation.title && (
                      <div>
                        <h3 className="text-md font-medium mb-2">Título</h3>
                        <p className="text-foreground">{selectedTranslation.title}</p>
                      </div>
                    )}
                    
                    {selectedTranslation.summary && (
                      <div>
                        <h3 className="text-md font-medium mb-2">Resumen</h3>
                        <p className="text-foreground whitespace-pre-line">{selectedTranslation.summary}</p>
                      </div>
                    )}
                    
                    {selectedTranslation.main_topics && selectedTranslation.main_topics.length > 0 && (
                      <div>
                        <h3 className="text-md font-medium mb-2">Temas principales</h3>
                        <ul className="list-disc list-inside text-foreground">
                          {selectedTranslation.main_topics.map((topic, idx) => (
                            <li key={idx}>{topic}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4" />
                    <p>No hay traducción disponible</p>
                  </div>
                )}
              </div>
            )}

            {/* Sección de procesamiento */}
            {shouldShowProcessingSection && (
              <div className="bg-card rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Procesando documento</h2>
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4" />
                  <p>{progressPercentage > 0 ? `Procesando... ${progressPercentage}%` : "Procesando..."}</p>
                  {document.processing_stage && (
                    <p className="mt-2 text-sm">Etapa: {document.processing_stage}</p>
                  )}
                  <div className="w-full bg-muted rounded-full h-2.5 mt-4 mb-2">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Sección de error */}
            {displayStatus === 'failed' && (
              <div className="bg-card rounded-lg p-6 border border-destructive/20">
                <h2 className="text-lg font-semibold mb-4 flex items-center text-destructive">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Error en el procesamiento
                </h2>
                <div className="space-y-4">
                  {document.error_details ? (
                    <>
                      {typeof document.error_details.error_message === 'string' && (
                        <div className="bg-destructive/10 p-4 rounded-md">
                          <p className="font-medium text-destructive">Mensaje de error:</p>
                          <p className="mt-1 text-foreground">{document.error_details.error_message}</p>
                        </div>
                      )}
                      
                      {typeof document.error_details.error_type === 'string' && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tipo de error:</p>
                          <p className="text-foreground">{document.error_details.error_type}</p>
                        </div>
                      )}
                      
                      {typeof document.error_details.timestamp === 'string' && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Hora del error:</p>
                          <p className="text-foreground">{new Date(document.error_details.timestamp as string).toLocaleString()}</p>
                        </div>
                      )}
                      
                      {/* Si hay más detalles, mostrarlos en formato JSON */}
                      {Object.keys(document.error_details).filter(key => 
                        !['error_message', 'error_type', 'timestamp'].includes(key)
                      ).length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Detalles adicionales:</p>
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-auto mt-1">
                            {JSON.stringify(
                              Object.fromEntries(
                                Object.entries(document.error_details).filter(([key]) => 
                                  !['error_message', 'error_type', 'timestamp'].includes(key)
                                )
                              ), 
                              null, 2
                            )}
                          </pre>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-destructive">Se produjo un error durante el procesamiento del documento.</p>
                  )}

                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground">Recomendaciones:</p>
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                      <li>Verifica que el documento esté en un formato soportado</li>
                      <li>Intenta subir el documento de nuevo</li>
                      <li>Si el problema persiste, contacta con soporte</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Barra lateral */}
          <div className="space-y-6">
            {/* Detalles del documento */}
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Detalles</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Estado</dt>
                  <dd className="mt-1">
                    <StatusBadge 
                      status={displayStatus} 
                      percentage={progressPercentage}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Tipo</dt>
                  <dd className="mt-1">{document.file_type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Tamaño</dt>
                  <dd className="mt-1">{Math.round(document.file_size / 1024)} KB</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Creado</dt>
                  <dd className="mt-1">{new Date(document.created_at).toLocaleDateString()}</dd>
                </div>
                {document.processed_at && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Procesado</dt>
                    <dd className="mt-1">{new Date(document.processed_at).toLocaleDateString()}</dd>
                  </div>
                )}
                {document.description && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Descripción</dt>
                    <dd className="mt-1">{document.description}</dd>
                  </div>
                )}
                {document.detected_language && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Idioma detectado</dt>
                    <dd className="mt-1">{getLanguageName(document.detected_language)}</dd>
                  </div>
                )}
                {availableTranslations.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Traducciones disponibles</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {availableTranslations.map(t => (
                        <span 
                          key={`${t.id}-${t.language_code}`}
                          className={`px-2 py-1 text-xs rounded-full ${
                            selectedTranslation?.language_code === t.language_code
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          }`}
                          onClick={() => handleTranslationSelect(t.language_code)}
                        >
                          {getLanguageName(t.language_code)}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de vista previa */}
      <Dialog open={previewOpen} onOpenChange={closePreview}>
        <DialogContent className="max-w-5xl w-full">
          <DialogHeader>
            <DialogTitle>{document.filename}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para crear nueva traducción */}
      <Dialog open={newTranslationOpen} onOpenChange={setNewTranslationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Traducir documento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="language" className="text-sm font-medium">
                Idioma destino
              </label>
              <Select
                value={targetLanguage}
                onValueChange={setTargetLanguage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar idioma" />
                </SelectTrigger>
                <SelectContent>
                  {languages.length > 0 ? (
                    // Filtrar los idiomas que ya están traducidos
                    languages
                      .filter(lang => !availableTranslations.some(t => t.language_code === lang.code))
                      .map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))
                  ) : (
                    <>
                      {[
                        { code: 'es', name: getLanguageName('es') },
                        { code: 'en', name: getLanguageName('en') },
                        { code: 'fr', name: getLanguageName('fr') },
                        { code: 'de', name: getLanguageName('de') },
                        { code: 'it', name: getLanguageName('it') },
                        { code: 'pt', name: getLanguageName('pt') }
                      ].map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setNewTranslationOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateTranslation} 
              disabled={!targetLanguage || isTranslating}
            >
              {isTranslating ? 'Traduciendo...' : 'Traducir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 