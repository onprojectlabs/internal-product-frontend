import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Document, ProgressMessage, DocumentProcessingMessage, DocumentTranslationMessage } from '../types/documents';
import { documentsService } from '../services/documents/documentsService';

interface DocumentWebSocketContextProps {
  connectWebSocket: (document: Document) => void;
  disconnectWebSocket: (documentId: string) => void;
  disconnectAll: () => void;
  getDocumentStatus: (documentId: string) => ProgressMessage | null;
  isConnected: (documentId: string) => boolean;
  getMessageCount: (documentId: string) => number;
  sendPing: (documentId: string) => void;
  connectTranslationWebSocket: (document: Document) => void;
}

const DocumentWebSocketContext = createContext<DocumentWebSocketContextProps | undefined>(undefined);

// Función auxiliar para determinar si el documento ha terminado de procesarse
const isDocumentProcessingComplete = (status: ProgressMessage | null): boolean => {
  if (!status) return false;
  
  if (status.task_type === 'document_processing') {
    const docStatus = status as DocumentProcessingMessage;
    return docStatus.status === 'processed' || 
           docStatus.status === 'failed' || 
           docStatus.progress_percentage === 100;
  } else if (status.task_type === 'document_translation') {
    const transStatus = status as DocumentTranslationMessage;
    return transStatus.status === 'completed' || 
           transStatus.status === 'failed' || 
           transStatus.progress_percentage === 100;
  }
  
  return false;
};

interface WebSocketConnection {
  ws: WebSocket | null;
  documentId: string;
  status: ProgressMessage | null;
  retryCount: number;
  retryTimer: NodeJS.Timeout | null;
  hasError: boolean;
  lastErrorTime: number | null;
  messageCount: number;
  lastMessageTime: number | null;
  pingInterval: NodeJS.Timeout | null;
  processingComplete: boolean;
}

interface DocumentWebSocketProviderProps {
  children: ReactNode;
}

// Configuración de reintentos
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 segundos
const MAX_RETRY_DELAY = 30000; // 30 segundos
const ERROR_COOLDOWN_PERIOD = 60000; // 1 minuto
const PING_INTERVAL = 15000; // 15 segundos entre pings

export function DocumentWebSocketProvider({ children }: DocumentWebSocketProviderProps) {
  // Mantener un mapa de las conexiones activas
  const activeConnections = useRef<Record<string, WebSocketConnection>>({});
  // Estado para forzar actualizaciones de componentes cuando cambian los estados
  const [, setForceUpdate] = useState<number>(0);

  // Limpiar todas las conexiones cuando el componente se desmonta
  useEffect(() => {
    return () => {
      disconnectAll();
    };
  }, []);

  // Forzar actualización de componentes dependientes
  const triggerUpdate = () => {
    setForceUpdate(prev => prev + 1);
  };

  // Calcular el tiempo de espera para el reintento con backoff exponencial
  const calculateRetryDelay = (retryCount: number): number => {
    // Fórmula de backoff exponencial: initialDelay * 2^retryCount
    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
    // Limitar el delay máximo
    return Math.min(delay, MAX_RETRY_DELAY);
  };

  // Función para limpiar los temporizadores
  const clearRetryTimer = (documentId: string) => {
    const connection = activeConnections.current[documentId];
    if (connection && connection.retryTimer !== null) {
      window.clearTimeout(connection.retryTimer);
      activeConnections.current[documentId].retryTimer = null;
    }
  };

  // Función para limpiar el intervalo de ping
  const clearPingInterval = (documentId: string) => {
    const connection = activeConnections.current[documentId];
    if (connection && connection.pingInterval !== null) {
      window.clearInterval(connection.pingInterval);
      activeConnections.current[documentId].pingInterval = null;
    }
  };

  // Iniciar el intervalo de ping para una conexión
  const startPingInterval = (documentId: string) => {
    // Limpiar cualquier intervalo existente
    clearPingInterval(documentId);
    
    // Crear un nuevo intervalo para enviar pings periódicamente
    const intervalId = setInterval(() => {
      sendPing(documentId);
    }, PING_INTERVAL);
    
    // Guardar referencia al intervalo
    if (activeConnections.current[documentId]) {
      activeConnections.current[documentId].pingInterval = intervalId as unknown as NodeJS.Timeout;
    }
  };

  // Función para enviar un ping al backend
  const sendPing = (documentId: string) => {
    const connection = activeConnections.current[documentId];
    if (connection && connection.ws && connection.ws.readyState === WebSocket.OPEN) {
      try {
        console.log(`[${new Date().toISOString()}] Enviando ping para documento ${documentId}`);
        connection.ws.send(JSON.stringify({ type: 'ping', document_id: documentId }));
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error al enviar ping para documento ${documentId}:`, error);
      }
    }
  };

  // Función para actualizar el estado del documento mediante API
  const refreshDocumentFromAPI = async (documentId: string) => {
    try {
      console.log(`[${new Date().toISOString()}] Actualizando documento ${documentId} mediante API después de cerrar WebSocket`);
      const updatedDocument = await documentsService.getDocument(documentId);
      if (updatedDocument) {
        console.log(`[${new Date().toISOString()}] Documento ${documentId} actualizado mediante API: status=${updatedDocument.status}`);
      } else {
        console.log(`[${new Date().toISOString()}] No se pudo obtener el documento ${documentId} mediante API`);
      }
      
      // Asegurarse de que la actualización forzada afecte a los componentes
      triggerUpdate();
      
      return updatedDocument;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error al actualizar documento ${documentId} mediante API:`, error);
      return null;
    }
  };

  // Conectar un WebSocket para un documento específico
  const connectWebSocket = (document: Document) => {
    // No conectar si el documento ya está procesado o ha fallido
    if (document.status === 'processed' || document.status === 'failed') {
      console.log(`[${new Date().toISOString()}] No se inicia WebSocket para documento ${document.id} porque ya está en estado final: ${document.status}`);
      return;
    }
    
    // Solo establecer la conexión si el documento está en proceso o recién subido
    if (document.status !== 'processing' && document.status !== 'uploaded') {
      console.log(`[${new Date().toISOString()}] No se inicia WebSocket para documento ${document.id} en estado ${document.status}`);
      return;
    }

    // Verificar si ya existe una conexión activa o en proceso de reintento
    const existingConnection = activeConnections.current[document.id];
    if (existingConnection) {
      // Si la conexión indica que el procesamiento ya está completo, no reconectar
      if (existingConnection.processingComplete) {
        console.log(`[${new Date().toISOString()}] No se reconecta WebSocket para documento ${document.id} porque el procesamiento ya está completo`);
        return;
      }
      
      // Si ya hay un WebSocket abierto o conectándose, no hacer nada
      if (
        existingConnection.ws && 
        (existingConnection.ws.readyState === WebSocket.OPEN || 
         existingConnection.ws.readyState === WebSocket.CONNECTING)
      ) {
        console.log(`[${new Date().toISOString()}] WebSocket ya conectado o conectándose para documento ${document.id}`);
        return;
      }
      
      // Si ha habido un error reciente, esperar el período de enfriamiento
      if (existingConnection.hasError && existingConnection.lastErrorTime) {
        const timeSinceError = Date.now() - existingConnection.lastErrorTime;
        if (timeSinceError < ERROR_COOLDOWN_PERIOD) {
          console.log(`[${new Date().toISOString()}] Esperando período de enfriamiento para documento ${document.id} (${Math.round((ERROR_COOLDOWN_PERIOD - timeSinceError) / 1000)}s restantes)`);
          return;
        }
      }
      
      // Limpiar el temporizador de reintento existente
      clearRetryTimer(document.id);
      
      // Limpiar el intervalo de ping existente
      clearPingInterval(document.id);
    }

    // Obtener el token de autenticación
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No hay token de autenticación disponible');
      return;
    }

    try {
      // Inicializar o actualizar el registro de conexión
      if (!existingConnection) {
        activeConnections.current[document.id] = {
          ws: null,
          documentId: document.id,
          status: null,
          retryCount: 0,
          retryTimer: null,
          hasError: false,
          lastErrorTime: null,
          messageCount: 0,
          lastMessageTime: null,
          pingInterval: null,
          processingComplete: false
        };
      } else {
        // Resetear el estado de error si estamos reconectando manualmente
        activeConnections.current[document.id].hasError = false;
      }

      // Obtener la URL base de la API
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';
      
      // Crear la URL del WebSocket según la documentación del backend
      const wsUrl = `${apiBaseUrl.replace(/^http/, 'ws')}/api/v1/documents/ws/${document.id}?token=${token}`;
      
      console.log(`[${new Date().toISOString()}] Conectando WebSocket para documento ${document.id}`);
      
      // Crear la conexión WebSocket
      const ws = new WebSocket(wsUrl);
      
      // Actualizar la referencia en la conexión
      activeConnections.current[document.id].ws = ws;

      // Configurar los manejadores de eventos
      ws.onopen = () => {
        console.log(`[${new Date().toISOString()}] Conexión WebSocket establecida para documento ${document.id}`);
        
        // Resetear el contador de reintentos al conectar exitosamente
        if (activeConnections.current[document.id]) {
          activeConnections.current[document.id].retryCount = 0;
          activeConnections.current[document.id].hasError = false;
          activeConnections.current[document.id].lastErrorTime = null;
          
          // Iniciar el envío periódico de pings
          startPingInterval(document.id);
          
          // Enviar un ping inicial para solicitar el estado actual
          sendPing(document.id);
          
          // Forzar actualización de componentes
          triggerUpdate();
        }
      };

      ws.onmessage = (event) => {
        try {
          const now = new Date();
          console.log(`[${now.toISOString()}] Mensaje recibido para documento ${document.id}:`, event.data);
          
          // Si es un mensaje de pong, no procesar como estado
          if (event.data === '{"type":"pong"}') {
            console.log(`[${now.toISOString()}] Recibido pong para documento ${document.id}`);
            return;
          }
          
          const data = JSON.parse(event.data) as ProgressMessage;
          
          // Actualizar el estado del documento en la conexión
          if (activeConnections.current[document.id]) {
            const connection = activeConnections.current[document.id];
            
            connection.status = data;
            connection.messageCount += 1;
            connection.lastMessageTime = Date.now();
            
            let statusMessage = '';
            let isComplete = false;
            let isFailed = false;
            
            // Procesar según tipo de mensaje
            if (data.task_type === 'document_processing') {
              const docData = data as DocumentProcessingMessage;
              statusMessage = `${docData.status}, progreso: ${docData.progress_percentage}%, etapa: ${docData.current_stage}`;
              isComplete = docData.status === 'processed' || docData.progress_percentage === 100;
              isFailed = docData.status === 'failed';
              
              // Si es un mensaje de error, registrar información adicional
              if (isFailed) {
                console.warn(`[${now.toISOString()}] FALLO en procesamiento del documento ${document.id}: ${docData.current_stage}`);
                console.warn(`[${now.toISOString()}] Detalles del error:`, docData.error || 'No hay detalles disponibles');
              }
            } else if (data.task_type === 'document_translation') {
              const translationData = data as DocumentTranslationMessage;
              statusMessage = `${translationData.status}, idioma: ${translationData.target_language}, progreso: ${translationData.progress_percentage}%, etapa: ${translationData.current_stage}`;
              isComplete = translationData.status === 'completed' || translationData.progress_percentage === 100;
              isFailed = translationData.status === 'failed';
              
              // Si es un mensaje de error, registrar información adicional
              if (isFailed) {
                console.warn(`[${now.toISOString()}] FALLO en traducción del documento ${document.id} a ${translationData.target_language}: ${translationData.current_stage}`);
                console.warn(`[${now.toISOString()}] Detalles del error:`, translationData.error || 'No hay detalles disponibles');
              }
            }
            
            console.log(`[${now.toISOString()}] Actualizado estado documento ${document.id}: ${statusMessage}, mensaje #${connection.messageCount}`);
            
            // Forzar actualización de componentes que dependen de este estado
            triggerUpdate();
            
            // Si el documento ya terminó (procesado, fallido o completado el porcentaje), cerrar la conexión
            if (isComplete || isFailed) {
              console.log(`[${now.toISOString()}] Tarea para documento ${document.id} ha ${isFailed ? 'FALLADO' : 'terminado'}. Cerrando WebSocket y actualizando mediante API.`);
              
              // Marcar la conexión como procesamiento completo
              connection.processingComplete = true;
              
              // Cerrar la conexión WebSocket
              disconnectWebSocket(document.id);
              
              // Actualizar el documento mediante API para tener el estado final
              refreshDocumentFromAPI(document.id);
            }
          } else {
            console.warn(`[${now.toISOString()}] Mensaje recibido pero no hay conexión activa para documento ${document.id}`);
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error al procesar mensaje WebSocket para documento ${document.id}:`, error, 'Mensaje raw:', event.data);
        }
      };

      ws.onerror = (error) => {
        console.error(`[${new Date().toISOString()}] Error en la conexión WebSocket para documento ${document.id}:`, error);
        
        if (activeConnections.current[document.id]) {
          activeConnections.current[document.id].hasError = true;
          activeConnections.current[document.id].lastErrorTime = Date.now();
          
          // Limpiar el intervalo de ping en caso de error
          clearPingInterval(document.id);
          
          // Forzar actualización de componentes
          triggerUpdate();
        }
      };

      ws.onclose = (event) => {
        console.log(`[${new Date().toISOString()}] Conexión WebSocket cerrada para documento ${document.id} con código: ${event.code}, razón: ${event.reason || 'No especificada'}`);
        
        // Limpiar el intervalo de ping cuando se cierra la conexión
        clearPingInterval(document.id);
        
        // Verificar si debemos reintentar la conexión
        const connection = activeConnections.current[document.id];
        if (connection) {
          // Si la conexión se cerró porque el procesamiento terminó, no reconectar
          if (connection.processingComplete || isDocumentProcessingComplete(connection.status)) {
            console.log(`[${new Date().toISOString()}] No se reintentará la conexión para el documento ${document.id} porque ya está en estado final: ${connection.status?.status || 'progreso 100%'}`);
            
            // Marcar explícitamente como procesamiento completo
            connection.processingComplete = true;
            
            // Eliminar la conexión completamente tras un breve retraso 
            // para asegurar que los componentes tengan tiempo de procesar el último estado
            setTimeout(() => {
              console.log(`[${new Date().toISOString()}] Eliminando conexión completamente para documento ${document.id} en estado final: ${connection.status?.status || 'progreso 100%'}`);
              delete activeConnections.current[document.id];
              triggerUpdate();
            }, 1000);
            
            return;
          }
          
          // Cuando la conexión se cierra por error, intentar reconectar con backoff exponencial
          if (
            event.code !== 1000 && // Cierre normal
            event.code !== 1001 && // Cierre por navegación
            connection.retryCount < MAX_RETRIES
          ) {
            const retryCount = connection.retryCount + 1;
            const retryDelay = calculateRetryDelay(retryCount);
            
            console.log(`[${new Date().toISOString()}] Reintentando conexión WebSocket para documento ${document.id} (intento ${retryCount}/${MAX_RETRIES}) en ${retryDelay/1000}s`);
            
            // Actualizar el contador de reintentos
            activeConnections.current[document.id].retryCount = retryCount;
            
            // Programar un reintento
            const timer = setTimeout(() => {
              // Solo reconectar si la conexión aún existe
              if (activeConnections.current[document.id]) {
                // Crear un objeto Document con el id y status para reconectar
                const docToReconnect = {
                  id: document.id,
                  status: 'processing' // Asumimos que sigue en procesamiento si estamos reintentando
                } as Document;
                connectWebSocket(docToReconnect);
              }
            }, retryDelay);
            
            // Guardar referencia al temporizador
            activeConnections.current[document.id].retryTimer = timer as unknown as NodeJS.Timeout;
          } else if (connection.retryCount >= MAX_RETRIES) {
            console.log(`[${new Date().toISOString()}] Número máximo de reintentos (${MAX_RETRIES}) alcanzado para documento ${document.id}. No se intentará reconectar.`);
            // Mantener la información de conexión para mostrar el estado de error,
            // pero limpiar el WebSocket
            activeConnections.current[document.id].ws = null;
            
            // Actualizar mediante API para obtener el estado más reciente
            refreshDocumentFromAPI(document.id);
          } else {
            // Cierre normal, eliminar la conexión
            delete activeConnections.current[document.id];
          }
          
          // Forzar actualización de componentes
          triggerUpdate();
        }
      };

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error al crear conexión WebSocket para documento ${document.id}:`, error);
      
      if (activeConnections.current[document.id]) {
        activeConnections.current[document.id].hasError = true;
        activeConnections.current[document.id].lastErrorTime = Date.now();
        // Forzar actualización de componentes
        triggerUpdate();
      }
    }
  };

  // Desconectar el WebSocket para un documento específico
  const disconnectWebSocket = (documentId: string) => {
    const connection = activeConnections.current[documentId];
    if (connection) {
      // Limpiar el temporizador de reintento si existe
      clearRetryTimer(documentId);
      
      // Limpiar el intervalo de ping si existe
      clearPingInterval(documentId);
      
      // Cerrar el WebSocket si existe
      if (connection.ws) {
        console.log(`[${new Date().toISOString()}] Cerrando conexión WebSocket para documento ${documentId}`);
        try {
          connection.ws.close();
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error al cerrar conexión WebSocket para documento ${documentId}:`, error);
        }
        connection.ws = null;
      }
      
      // Verificar si es un cierre por finalización (procesado o fallido)
      if (connection.processingComplete || isDocumentProcessingComplete(connection.status)) {
        // Si el procesamiento terminó, marcar como completo 
        connection.processingComplete = true;
        
        // Preparar para la eliminación de la conexión tras actualizar el estado
        setTimeout(() => {
          console.log(`[${new Date().toISOString()}] Eliminando conexión completamente para documento ${documentId} en estado final: ${connection.status?.status || 'progreso 100%'}`);
          delete activeConnections.current[documentId];
          triggerUpdate();
        }, 1000);
      }
      
      // Forzar actualización de componentes
      triggerUpdate();
    }
  };

  // Desconectar todos los WebSockets
  const disconnectAll = () => {
    console.log(`[${new Date().toISOString()}] Cerrando todas las conexiones WebSocket`);
    
    // Iterar sobre todas las conexiones
    Object.keys(activeConnections.current).forEach(documentId => {
      const connection = activeConnections.current[documentId];
      
      // Limpiar temporizador de reintento si existe
      clearRetryTimer(documentId);
      
      // Limpiar intervalo de ping si existe
      clearPingInterval(documentId);
      
      // Cerrar el WebSocket si existe
      if (connection.ws) {
        try {
          connection.ws.close();
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error al cerrar conexión WebSocket para documento ${documentId}:`, error);
        }
      }
    });
    
    // Limpiar todas las conexiones
    activeConnections.current = {};
    
    // Forzar actualización de componentes
    triggerUpdate();
  };

  // Obtener el estado actual de un documento
  const getDocumentStatus = (documentId: string): ProgressMessage | null => {
    return activeConnections.current[documentId]?.status || null;
  };

  // Verificar si hay una conexión activa para un documento
  const isConnected = (documentId: string): boolean => {
    const connection = activeConnections.current[documentId];
    return !!(connection && connection.ws && connection.ws.readyState === WebSocket.OPEN);
  };

  // Obtener el número de mensajes recibidos para un documento (para depuración)
  const getMessageCount = (documentId: string): number => {
    return activeConnections.current[documentId]?.messageCount || 0;
  };

  // Para depuración: un efecto que muestra el estado de todas las conexiones periódicamente
  useEffect(() => {
    const intervalId = setInterval(() => {
      const connections = Object.values(activeConnections.current);
      if (connections.length > 0) {
        console.log(`[${new Date().toISOString()}] Estado de conexiones WebSocket (${connections.length}):`);
        connections.forEach(conn => {
          const wsState = conn.ws ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][conn.ws.readyState] : 'NULL';
          console.log(`- Doc ${conn.documentId}: WS ${wsState}, Msgs: ${conn.messageCount}, Última: ${conn.lastMessageTime ? new Date(conn.lastMessageTime).toISOString() : 'nunca'}, Status: ${conn.status?.status || 'ninguno'}, Progreso: ${conn.status?.progress_percentage || 0}%`);
        });
      }
    }, 10000); // Cada 10 segundos

    return () => clearInterval(intervalId);
  }, []);

  // Conectar un WebSocket específicamente para traducciones
  // Este método no verificará el estado del documento, solo se asegurará
  // de establecer la conexión para monitorear traducciones
  const connectTranslationWebSocket = (document: Document) => {
    const documentId = document.id;
    
    // Verificar si ya existe una conexión activa o en proceso de reintento
    const existingConnection = activeConnections.current[documentId];
    if (existingConnection) {
      // Si ya hay un WebSocket abierto o conectándose, no hacer nada
      if (
        existingConnection.ws && 
        (existingConnection.ws.readyState === WebSocket.OPEN || 
         existingConnection.ws.readyState === WebSocket.CONNECTING)
      ) {
        console.log(`[${new Date().toISOString()}] WebSocket ya conectado o conectándose para documento ${documentId}`);
        return;
      }
      
      // Si ha habido un error reciente, esperar el período de enfriamiento
      if (existingConnection.hasError && existingConnection.lastErrorTime) {
        const timeSinceError = Date.now() - existingConnection.lastErrorTime;
        if (timeSinceError < ERROR_COOLDOWN_PERIOD) {
          console.log(`[${new Date().toISOString()}] Esperando período de enfriamiento para documento ${documentId} (${Math.round((ERROR_COOLDOWN_PERIOD - timeSinceError) / 1000)}s restantes)`);
          return;
        }
      }
      
      // Limpiar el temporizador de reintento existente
      clearRetryTimer(documentId);
      
      // Limpiar el intervalo de ping existente
      clearPingInterval(documentId);
    }

    // Obtener el token de autenticación
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No hay token de autenticación disponible');
      return;
    }

    try {
      // Inicializar o actualizar el registro de conexión
      if (!existingConnection) {
        activeConnections.current[documentId] = {
          ws: null,
          documentId: documentId,
          status: null,
          retryCount: 0,
          retryTimer: null,
          hasError: false,
          lastErrorTime: null,
          messageCount: 0,
          lastMessageTime: null,
          pingInterval: null,
          processingComplete: false
        };
      } else {
        // Resetear el estado de error si estamos reconectando manualmente
        activeConnections.current[documentId].hasError = false;
      }

      // Obtener la URL base de la API
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';
      
      // Crear la URL del WebSocket según la documentación del backend
      const wsUrl = `${apiBaseUrl.replace(/^http/, 'ws')}/api/v1/documents/ws/${documentId}?token=${token}`;
      
      console.log(`[${new Date().toISOString()}] Conectando WebSocket para traducciones del documento ${documentId}`);
      
      // Crear la conexión WebSocket
      const ws = new WebSocket(wsUrl);
      
      // Actualizar la referencia en la conexión
      activeConnections.current[documentId].ws = ws;

      // Configurar los manejadores de eventos
      ws.onopen = () => {
        console.log(`[${new Date().toISOString()}] Conexión WebSocket establecida para traducciones del documento ${documentId}`);
        
        // Resetear el contador de reintentos al conectar exitosamente
        if (activeConnections.current[documentId]) {
          activeConnections.current[documentId].retryCount = 0;
          activeConnections.current[documentId].hasError = false;
          activeConnections.current[documentId].lastErrorTime = null;
          
          // Iniciar el envío periódico de pings
          startPingInterval(documentId);
          
          // Enviar un ping inicial para solicitar el estado actual
          sendPing(documentId);
          
          // Forzar actualización de componentes
          triggerUpdate();
        }
      };

      // Usar los mismos manejadores para onmessage, onerror y onclose
      ws.onmessage = activeConnections.current[documentId].ws?.onmessage;
      ws.onerror = activeConnections.current[documentId].ws?.onerror;
      ws.onclose = activeConnections.current[documentId].ws?.onclose;
      
      // Si no se han asignado los manejadores, usar los mismos que en connectWebSocket
      if (!ws.onmessage) {
        ws.onmessage = (event) => {
          try {
            const now = new Date();
            console.log(`[${now.toISOString()}] Mensaje recibido para documento ${documentId}:`, event.data);
            
            // Si es un mensaje de pong, no procesar como estado
            if (event.data === '{"type":"pong"}') {
              console.log(`[${now.toISOString()}] Recibido pong para documento ${documentId}`);
              return;
            }
            
            const data = JSON.parse(event.data) as ProgressMessage;
            
            // Actualizar el estado del documento en la conexión
            if (activeConnections.current[documentId]) {
              const connection = activeConnections.current[documentId];
              
              connection.status = data;
              connection.messageCount += 1;
              connection.lastMessageTime = Date.now();
              
              let statusMessage = '';
              let isComplete = false;
              let isFailed = false;
              
              // Procesar según tipo de mensaje
              if (data.task_type === 'document_processing') {
                const docData = data as DocumentProcessingMessage;
                statusMessage = `${docData.status}, progreso: ${docData.progress_percentage}%, etapa: ${docData.current_stage}`;
                isComplete = docData.status === 'processed' || docData.progress_percentage === 100;
                isFailed = docData.status === 'failed';
                
                // Si es un mensaje de error, registrar información adicional
                if (isFailed) {
                  console.warn(`[${now.toISOString()}] FALLO en procesamiento del documento ${documentId}: ${docData.current_stage}`);
                  console.warn(`[${now.toISOString()}] Detalles del error:`, docData.error || 'No hay detalles disponibles');
                }
              } else if (data.task_type === 'document_translation') {
                const translationData = data as DocumentTranslationMessage;
                statusMessage = `${translationData.status}, idioma: ${translationData.target_language}, progreso: ${translationData.progress_percentage}%, etapa: ${translationData.current_stage}`;
                isComplete = translationData.status === 'completed' || translationData.progress_percentage === 100;
                isFailed = translationData.status === 'failed';
                
                // Si es un mensaje de error, registrar información adicional
                if (isFailed) {
                  console.warn(`[${now.toISOString()}] FALLO en traducción del documento ${documentId} a ${translationData.target_language}: ${translationData.current_stage}`);
                  console.warn(`[${now.toISOString()}] Detalles del error:`, translationData.error || 'No hay detalles disponibles');
                }
              }
              
              console.log(`[${now.toISOString()}] Actualizado estado documento ${documentId}: ${statusMessage}, mensaje #${connection.messageCount}`);
              
              // Forzar actualización de componentes que dependen de este estado
              triggerUpdate();
              
              // Si el documento ya terminó (procesado, fallido o completado el porcentaje), cerrar la conexión
              if (isComplete || isFailed) {
                console.log(`[${now.toISOString()}] Tarea para documento ${documentId} ha ${isFailed ? 'FALLADO' : 'terminado'}. Cerrando WebSocket y actualizando mediante API.`);
                
                // Marcar la conexión como procesamiento completo
                connection.processingComplete = true;
                
                // Cerrar la conexión WebSocket
                disconnectWebSocket(documentId);
                
                // Actualizar el documento mediante API para tener el estado final
                refreshDocumentFromAPI(documentId);
              }
            } else {
              console.warn(`[${now.toISOString()}] Mensaje recibido pero no hay conexión activa para documento ${documentId}`);
            }
          } catch (error) {
            console.error(`[${new Date().toISOString()}] Error al procesar mensaje WebSocket para documento ${documentId}:`, error, 'Mensaje raw:', event.data);
          }
        };
      }
      
      if (!ws.onerror) {
        ws.onerror = (error) => {
          console.error(`[${new Date().toISOString()}] Error en la conexión WebSocket para documento ${documentId}:`, error);
          
          if (activeConnections.current[documentId]) {
            activeConnections.current[documentId].hasError = true;
            activeConnections.current[documentId].lastErrorTime = Date.now();
            
            // Limpiar el intervalo de ping en caso de error
            clearPingInterval(documentId);
            
            // Forzar actualización de componentes
            triggerUpdate();
          }
        };
      }
      
      if (!ws.onclose) {
        ws.onclose = (event) => {
          console.log(`[${new Date().toISOString()}] Conexión WebSocket cerrada para documento ${documentId} con código: ${event.code}, razón: ${event.reason || 'No especificada'}`);
          
          // Limpiar el intervalo de ping cuando se cierra la conexión
          clearPingInterval(documentId);
          
          // Verificar si debemos reintentar la conexión
          if (
            activeConnections.current[documentId] && 
            !activeConnections.current[documentId].processingComplete && 
            activeConnections.current[documentId].retryCount < MAX_RETRIES
          ) {
            // Incrementar el contador de reintentos
            activeConnections.current[documentId].retryCount += 1;
            
            const retryDelay = Math.min(
              INITIAL_RETRY_DELAY * Math.pow(2, activeConnections.current[documentId].retryCount),
              MAX_RETRY_DELAY
            );
            
            console.log(`[${new Date().toISOString()}] Reintentando conexión para documento ${documentId} en ${retryDelay / 1000}s (intento ${activeConnections.current[documentId].retryCount}/${MAX_RETRIES})`);
            
            // Programar el reintento
            const timer = setTimeout(() => {
              // Solo reintentar si la conexión aún existe
              if (activeConnections.current[documentId]) {
                connectTranslationWebSocket(document);
              }
            }, retryDelay);
            
            // Guardar referencia al temporizador
            activeConnections.current[documentId].retryTimer = timer as unknown as NodeJS.Timeout;
          } else if (activeConnections.current[documentId]) {
            console.log(`[${new Date().toISOString()}] No se reintentará la conexión para documento ${documentId}`);
            
            // Si el procesamiento NO está completo y hemos agotado los reintentos, marcar con error
            if (!activeConnections.current[documentId].processingComplete) {
              activeConnections.current[documentId].hasError = true;
              activeConnections.current[documentId].lastErrorTime = Date.now();
            }
          }
          
          // Forzar actualización de componentes
          triggerUpdate();
        };
      }
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error al establecer conexión WebSocket para documento ${documentId}:`, error);
      
      if (activeConnections.current[documentId]) {
        activeConnections.current[documentId].hasError = true;
        activeConnections.current[documentId].lastErrorTime = Date.now();
      }
      
      // Forzar actualización de componentes
      triggerUpdate();
    }
  };

  const contextValue: DocumentWebSocketContextProps = {
    connectWebSocket,
    disconnectWebSocket,
    disconnectAll,
    getDocumentStatus,
    isConnected,
    getMessageCount,
    sendPing,
    connectTranslationWebSocket,
  };

  return (
    <DocumentWebSocketContext.Provider value={contextValue}>
      {children}
    </DocumentWebSocketContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useDocumentWebSocket() {
  const context = useContext(DocumentWebSocketContext);
  if (context === undefined) {
    throw new Error('useDocumentWebSocket debe usarse dentro de un DocumentWebSocketProvider');
  }
  return context;
} 