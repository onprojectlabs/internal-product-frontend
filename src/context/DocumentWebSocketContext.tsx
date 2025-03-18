import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Document } from '../types/documents';
import { DocumentProcessingStatus } from '../hooks';
import { documentsService } from '../services/documents/documentsService';

interface DocumentWebSocketContextProps {
  connectWebSocket: (document: Document) => void;
  disconnectWebSocket: (documentId: string) => void;
  disconnectAll: () => void;
  getDocumentStatus: (documentId: string) => DocumentProcessingStatus | null;
  isConnected: (documentId: string) => boolean;
  getMessageCount: (documentId: string) => number;
  sendPing: (documentId: string) => void;
}

const DocumentWebSocketContext = createContext<DocumentWebSocketContextProps | undefined>(undefined);

// Función auxiliar para determinar si el documento ha terminado de procesarse
const isDocumentProcessingComplete = (status: DocumentProcessingStatus | null): boolean => {
  if (!status) return false;
  return status.status === 'processed' || 
         status.status === 'failed' || 
         status.progress_percentage === 100;
};

interface WebSocketConnection {
  ws: WebSocket | null;
  documentId: string;
  status: DocumentProcessingStatus | null;
  retryCount: number;
  retryTimer: number | null;
  hasError: boolean;
  lastErrorTime: number | null;
  messageCount: number;
  lastMessageTime: number | null;
  pingInterval: number | null;
  processingComplete: boolean; // Nuevo flag para rastrear si el procesamiento se ha completado
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

  // Función para iniciar el envío periódico de pings
  const startPingInterval = (documentId: string) => {
    const connection = activeConnections.current[documentId];
    if (connection && connection.ws && connection.ws.readyState === WebSocket.OPEN) {
      // Limpiar intervalo anterior si existe
      clearPingInterval(documentId);
      
      // Crear nuevo intervalo
      const intervalId = window.setInterval(() => {
        sendPing(documentId);
      }, PING_INTERVAL);
      
      // Guardar referencia al intervalo
      activeConnections.current[documentId].pingInterval = intervalId;
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
          
          const data = JSON.parse(event.data) as DocumentProcessingStatus;
          
          // Actualizar el estado del documento en la conexión
          if (activeConnections.current[document.id]) {
            const connection = activeConnections.current[document.id];
            
            connection.status = data;
            connection.messageCount += 1;
            connection.lastMessageTime = Date.now();
            
            console.log(`[${now.toISOString()}] Actualizado estado documento ${document.id}: ${data.status}, progreso: ${data.progress_percentage}%, etapa: ${data.current_stage}, mensaje #${connection.messageCount}`);
            
            // Forzar actualización de componentes que dependen de este estado
            triggerUpdate();
            
            // Si el documento ya terminó (procesado o falló), cerrar la conexión
            if (data.status === 'processed' || data.status === 'failed' || data.progress_percentage === 100) {
              console.log(`[${now.toISOString()}] Documento ${document.id} ha terminado de procesarse (${data.status || 'progreso 100%'}). Cerrando WebSocket y actualizando mediante API.`);
              
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
            const timerId = window.setTimeout(() => {
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
            
            // Guardar el ID del temporizador
            activeConnections.current[document.id].retryTimer = timerId;
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
  const getDocumentStatus = (documentId: string): DocumentProcessingStatus | null => {
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

  const contextValue: DocumentWebSocketContextProps = {
    connectWebSocket,
    disconnectWebSocket,
    disconnectAll,
    getDocumentStatus,
    isConnected,
    getMessageCount,
    sendPing
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