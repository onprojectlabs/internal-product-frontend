import { useState, useEffect, useCallback, useRef } from "react";
import {
    DocumentProcessingMessage,
    ProgressMessage,
    DocumentTranslationMessage,
} from "../../types/documents";

interface UseDocumentProcessingStatusOptions {
    onStatusChange?: (status: ProgressMessage) => void;
    onDocumentProcessing?: (status: DocumentProcessingMessage) => void;
    onTranslationProcessing?: (status: DocumentTranslationMessage) => void;
    onError?: (error: Error) => void;
    onComplete?: (status: ProgressMessage) => void;
    autoReconnect?: boolean;
    reconnectInterval?: number;
}

/**
 * Hook to connect to the document processing WebSocket and get real-time updates
 * @param documentId The ID of the document to track
 * @param options Configuration options
 * @returns An object with the current status and connection control functions
 */
export function useDocumentProcessingStatus(
    documentId: string,
    options: UseDocumentProcessingStatusOptions = {}
) {
    const {
        onStatusChange,
        onDocumentProcessing,
        onTranslationProcessing,
        onError,
        onComplete,
        autoReconnect = true,
        reconnectInterval = 5000,
    } = options;

    // State to track the current processing status
    const [status, setStatus] = useState<ProgressMessage | null>(null);

    // State to track connection status
    const [connectionStatus, setConnectionStatus] = useState<
        "disconnected" | "connecting" | "connected" | "error"
    >("disconnected");

    // Ref to store the WebSocket instance
    const wsRef = useRef<WebSocket | null>(null);

    // Ref to track if we should reconnect
    const shouldReconnectRef = useRef(autoReconnect);

    // Ref to track if the component is mounted
    const isMountedRef = useRef(true);

    // Function to connect to the WebSocket
    const connect = useCallback(() => {
        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close();
        }

        if (!documentId) {
            console.error("Document ID is required to connect to WebSocket");
            return;
        }

        // Get the authentication token directly from localStorage as specified in the backend documentation
        const token = localStorage.getItem("access_token");
        if (!token) {
            const error = new Error("No authentication token available");
            setConnectionStatus("error");
            if (onError) onError(error);
            return;
        }

        try {
            setConnectionStatus("connecting");

            // Get the API URL from the environment or use default
            const apiBaseUrl =
                (import.meta.env.VITE_API_BASE_URL as string) ||
                "http://localhost:8000";

            console.log("API Base URL:", apiBaseUrl);

            // Create the WebSocket URL exactly as specified in the backend documentation
            const wsUrl = `${apiBaseUrl.replace(/^http/, "ws")}/api/v1/documents/ws/${documentId}?token=${token}`;

            console.log("Connecting to WebSocket URL:", wsUrl);

            // Create a new WebSocket connection
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            // Set up event handlers
            ws.onopen = () => {
                if (!isMountedRef.current) return;

                console.log("WebSocket connection opened");
                setConnectionStatus("connected");
                console.log(`WebSocket connected for document ${documentId}`);

                // According to the backend documentation, we don't need to send the token again
                // since it's already included in the URL
            };

            ws.onmessage = (event) => {
                if (!isMountedRef.current) return;

                console.log("WebSocket message received:", event.data);

                try {
                    const data = JSON.parse(event.data) as ProgressMessage;
                    setStatus(data);

                    // Call the onStatusChange callback if provided
                    if (onStatusChange) onStatusChange(data);

                    // Route to specific handlers based on task_type
                    if (
                        data.task_type === "document_processing" &&
                        onDocumentProcessing
                    ) {
                        onDocumentProcessing(data as DocumentProcessingMessage);
                    } else if (
                        data.task_type === "document_translation" &&
                        onTranslationProcessing
                    ) {
                        onTranslationProcessing(
                            data as DocumentTranslationMessage
                        );
                    }

                    // Handle completion based on task type
                    if (data.task_type === "document_processing") {
                        const docData = data as DocumentProcessingMessage;
                        if (docData.status === "processed" && onComplete) {
                            onComplete(docData);

                            // Close the connection if the document is processed
                            if (wsRef.current) {
                                wsRef.current.close();
                                setConnectionStatus("disconnected");
                            }
                        }

                        // Handle error for document processing
                        if (
                            docData.status === "failed" &&
                            onError &&
                            docData.error
                        ) {
                            onError(new Error(docData.error.error_message));

                            // Close the connection if the document processing failed
                            if (wsRef.current) {
                                wsRef.current.close();
                                setConnectionStatus("disconnected");
                            }
                        }
                    } else if (data.task_type === "document_translation") {
                        const translationData =
                            data as DocumentTranslationMessage;
                        if (
                            translationData.status === "completed" &&
                            onComplete
                        ) {
                            onComplete(translationData);
                        }

                        // Handle error for translation
                        if (
                            translationData.status === "failed" &&
                            onError &&
                            translationData.error
                        ) {
                            onError(new Error(translationData.error));

                            // Close the connection if the translation failed
                            if (wsRef.current) {
                                wsRef.current.close();
                                setConnectionStatus("disconnected");
                            }
                        }
                    }
                } catch (error) {
                    console.error(
                        "Error parsing WebSocket message:",
                        error,
                        "Raw message:",
                        event.data
                    );
                    if (onError)
                        onError(
                            error instanceof Error
                                ? error
                                : new Error(
                                      `Failed to parse WebSocket message: ${event.data}`
                                  )
                        );
                }
            };

            ws.onerror = (error) => {
                if (!isMountedRef.current) return;

                console.error("WebSocket error:", error);
                setConnectionStatus("error");
                if (onError) onError(new Error("WebSocket connection error"));
            };

            ws.onclose = (event) => {
                if (!isMountedRef.current) return;

                console.log(
                    "WebSocket connection closed with code:",
                    event.code,
                    "reason:",
                    event.reason
                );
                setConnectionStatus("disconnected");

                // Reconnect if autoReconnect is enabled and the document is still processing
                if (
                    shouldReconnectRef.current &&
                    status &&
                    ((status.task_type === "document_processing" &&
                        (status as DocumentProcessingMessage).status ===
                            "processing") ||
                        (status.task_type === "document_translation" &&
                            (status as DocumentTranslationMessage).status ===
                                "translating"))
                ) {
                    console.log(`Reconnecting in ${reconnectInterval}ms...`);
                    setTimeout(() => {
                        if (isMountedRef.current) {
                            connect();
                        }
                    }, reconnectInterval);
                }
            };
        } catch (error) {
            console.error("Error connecting to WebSocket:", error);
            setConnectionStatus("error");
            if (onError)
                onError(
                    error instanceof Error
                        ? error
                        : new Error(`Failed to connect to WebSocket: ${error}`)
                );
        }
    }, [documentId, onStatusChange, onError, onComplete, reconnectInterval]);

    // Function to disconnect from the WebSocket
    const disconnect = useCallback(() => {
        shouldReconnectRef.current = false;

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setConnectionStatus("disconnected");
    }, []);

    // Connect to the WebSocket when the component mounts or when the document ID changes
    useEffect(() => {
        isMountedRef.current = true;
        shouldReconnectRef.current = autoReconnect;

        if (documentId) {
            connect();
        }

        // Clean up when the component unmounts
        return () => {
            isMountedRef.current = false;
            disconnect();
        };
    }, [documentId, connect, disconnect, autoReconnect]);

    // Return the current status and connection control functions
    return {
        status,
        connectionStatus,
        connect,
        disconnect,
    };
}
