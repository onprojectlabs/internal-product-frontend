# Arquitectura WebSocket

Este documento describe la implementación de WebSockets en la aplicación, específicamente para el seguimiento del procesamiento de documentos en tiempo real.

## Visión General

La aplicación utiliza WebSockets para proporcionar actualizaciones en tiempo real sobre el estado de procesamiento de documentos. Este enfoque permite a los usuarios ver el progreso de sus documentos sin necesidad de recargar la página o hacer polling constante al servidor.

## Componentes Principales

### 1. Contexto WebSocket (`DocumentWebSocketContext`)

El núcleo de la implementación es un contexto React que gestiona las conexiones WebSocket:

```tsx
// Simplificado para claridad
const DocumentWebSocketContext = createContext<
    DocumentWebSocketContextProps | undefined
>(undefined);

export function DocumentWebSocketProvider({
    children,
}: {
    children: ReactNode;
}) {
    // Estado para mantener las conexiones activas
    const activeConnections = useRef<Record<string, WebSocketConnection>>({});

    // Métodos para conectar, desconectar y obtener estado
    const connectWebSocket = (document: Document) => {
        /* ... */
    };
    const disconnectWebSocket = (documentId: string) => {
        /* ... */
    };
    const getDocumentStatus = (documentId: string) => {
        /* ... */
    };

    return (
        <DocumentWebSocketContext.Provider
            value={{
                connectWebSocket,
                disconnectWebSocket,
                getDocumentStatus,
                // ...otros métodos
            }}
        >
            {children}
        </DocumentWebSocketContext.Provider>
    );
}
```

### 2. Hook Personalizado (`useDocumentProcessingStatus`)

Un hook personalizado que simplifica la conexión y manejo de mensajes WebSocket:

```tsx
export function useDocumentProcessingStatus(documentId: string, options = {}) {
    // Estado para el status del documento
    const [status, setStatus] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState("disconnected");

    // Función para conectar al WebSocket
    const connect = useCallback(() => {
        /* ... */
    }, [documentId]);

    // Función para desconectar
    const disconnect = useCallback(() => {
        /* ... */
    }, []);

    // Efecto para conectar/desconectar automáticamente
    useEffect(() => {
        /* ... */
    }, [documentId]);

    return { status, connectionStatus, connect, disconnect };
}
```

### 3. Componente de Visualización (`DocumentCard`)

Componentes que consumen el estado de WebSocket y muestran el progreso:

```tsx
function DocumentCard({ document }) {
    const { status, connectionStatus } = useDocumentProcessingStatus(
        document.id
    );

    return (
        <div>
            <div>Estado: {status?.status || document.status}</div>
            <div>Progreso: {status?.progress_percentage || 0}%</div>
            <div>Etapa: {status?.current_stage || "Esperando..."}</div>
            <div>Conexión: {connectionStatus}</div>
        </div>
    );
}
```

## Flujo de Datos

1. **Inicialización**:

    - Cuando un componente que necesita actualizaciones en tiempo real se monta, utiliza el hook `useDocumentWebSocket` o `useDocumentProcessingStatus`
    - El hook establece una conexión WebSocket con el servidor para documentos específicos

2. **Gestión de Conexión**:

    - El contexto `DocumentWebSocketContext` mantiene un registro de todas las conexiones activas
    - Implementa reconexión automática con backoff exponencial en caso de errores
    - Limpia las conexiones cuando los componentes se desmontan

3. **Procesamiento de Mensajes**:

    - Los mensajes recibidos se analizan y convierten en objetos `DocumentProcessingStatus`
    - El estado se actualiza en el contexto y se notifica a los componentes suscritos
    - Se implementa un sistema de ping-pong para mantener activas las conexiones

4. **Finalización**:
    - Cuando un documento completa su procesamiento, la conexión WebSocket se cierra automáticamente
    - Se realiza una última actualización vía API REST para asegurar el estado final correcto

## Optimizaciones

### Conexiones Selectivas

La aplicación solo abre conexiones WebSocket para documentos que están en proceso de procesamiento, no para todos los documentos:

```tsx
// Solo conectar si el documento está en procesamiento o recién subido
if (document.status !== "processing" && document.status !== "uploaded") {
    return;
}
```

### Gestión de Reconexión

Se implementa una estrategia de backoff exponencial para reintentos:

```tsx
const calculateRetryDelay = (retryCount: number): number => {
    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
    return Math.min(delay, MAX_RETRY_DELAY);
};
```

### Protocolo Ping-Pong

Para mantener activas las conexiones y verificar el estado actual:

```tsx
const startPingInterval = (documentId: string) => {
    const intervalId = window.setInterval(() => {
        sendPing(documentId);
    }, PING_INTERVAL);
};
```

## Consideraciones de Seguridad

- **Autenticación**: Cada conexión WebSocket incluye un token JWT para autenticación
- **Validación**: Los mensajes recibidos se validan antes de procesarse
- **Scope**: Cada conexión WebSocket es específica para un documento, limitando el acceso

## Manejo de Errores

- **Reconexión Automática**: Intenta reconectar automáticamente con backoff exponencial
- **Límite de Reintentos**: Después de varios intentos fallidos, se detiene la reconexión
- **Fallback a API**: Si WebSocket falla permanentemente, se utiliza la API REST como respaldo

## Diagrama de Secuencia

```
┌─────┐          ┌───────────┐          ┌────────┐
│ UI  │          │ Frontend  │          │ Backend│
└──┬──┘          └─────┬─────┘          └───┬────┘
   │  Montar componente │                    │
   │ ─────────────────> │                    │
   │                    │    Conectar WS     │
   │                    │ ──────────────────>│
   │                    │                    │
   │                    │  Status inicial    │
   │                    │ <──────────────────│
   │   Actualizar UI    │                    │
   │ <─────────────────┐│                    │
   │                    │      Ping          │
   │                    │ ──────────────────>│
   │                    │                    │
   │                    │  Actualización     │
   │                    │ <──────────────────│
   │   Actualizar UI    │                    │
   │ <─────────────────┐│                    │
   │                    │                    │
   │ Desmontar          │                    │
   │ ─────────────────> │                    │
   │                    │   Cerrar WS        │
   │                    │ ──────────────────>│
   │                    │                    │
┌──┴──┐          ┌─────┴─────┐          ┌───┴────┐
│ UI  │          │ Frontend  │          │ Backend│
└─────┘          └───────────┘          └────────┘
```

## Referencias

- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [React Context API](https://react.dev/reference/react/createContext)
- [useDocumentProcessingStatus Hook](../hooks/document-processing.md)
