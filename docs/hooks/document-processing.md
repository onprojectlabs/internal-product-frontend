# Document Processing WebSocket Hook

This document describes the custom hook for connecting to the WebSocket for document processing and receiving real-time updates on the status of a document being processed.

## Hook: `useDocumentProcessingStatus`

This hook facilitates the connection to the WebSocket and automatically handles reconnection, authentication, and message processing.

### Usage

```tsx
import { useDocumentProcessingStatus } from "../hooks";

function MyComponent() {
    const documentId = "123e4567-e89b-12d3-a456-426614174000";

    const { status, connectionStatus } =
        useDocumentProcessingStatus(documentId);

    return (
        <div>
            <p>Connection status: {connectionStatus}</p>
            {status && (
                <div>
                    <p>Document status: {status.status}</p>
                    <p>Progress: {status.progress_percentage}%</p>
                    <p>Current stage: {status.current_stage}</p>
                </div>
            )}
        </div>
    );
}
```

### Advanced Options

The hook accepts an options object as the second parameter:

```tsx
const { status, connectionStatus, connect, disconnect } =
    useDocumentProcessingStatus(documentId, {
        // Function called when the document status changes
        onStatusChange: (newStatus) => {
            console.log("New status:", newStatus);
        },

        // Function called when processing completes
        onComplete: (finalStatus) => {
            console.log("Processing completed:", finalStatus);
        },

        // Function called when an error occurs
        onError: (error) => {
            console.error("Error:", error);
        },

        // Whether to automatically reconnect when the connection is lost
        autoReconnect: true,

        // Reconnection interval in milliseconds
        reconnectInterval: 5000,
    });
```

### Return Values

- `status`: The current document processing status (null if no data yet)
- `connectionStatus`: WebSocket connection status ('disconnected', 'connecting', 'connected', 'error')
- `connect`: Function to manually connect to the WebSocket
- `disconnect`: Function to manually disconnect from the WebSocket

## WebSocket Message Format

Messages received from the WebSocket have this format:

```json
{
    "document_id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "processing",
    "progress_percentage": 65,
    "current_stage": "Extracting metadata",
    "updated_at": "2024-05-15T14:30:45.123456"
}
```

### Main Fields:

- `document_id`: UUID of the document (string)
- `status`: Current document status (string)
    - Possible values: "uploaded", "processing", "processed", "failed"
- `progress_percentage`: Progress percentage (integer from 0 to 100)
- `current_stage`: Description of the current processing stage (string)
- `updated_at`: Timestamp of the last update (ISO 8601)

### Additional Fields for Processed Documents:

- `completed_at`: Timestamp of processing completion (ISO 8601)
- `processing_duration`: Total processing duration in seconds (number)

### Additional Fields for Documents with Errors:

- `error`: Object with error details
    - `error_message`: Error message (string)
    - `error_type`: Error type (string)
    - `timestamp`: Error timestamp (ISO 8601)

## Processing Stages

The system provides updates through these stages:

- 5%: "Verifying file"
- 10%: "Preparing document reading"
- 15%: "Reading document content"
- 20%: "Preparing document for processing"
- 25%: "Loading document"
- 30%: "Initializing language model"
- 35%: "Configuring text processing"
- 40%: "Configuring information extractors"
- 45%: "Preparing processing pipeline"
- 50%: "Transforming document"
- 60%: "Processing document content"
- 65%: "Extracting metadata"
- 75%: "Creating vector index"
- 85%: "Generating document summary"
- 90%: "Collecting final metadata"
- 95%: "Finalizing processing"
- 100%: "Processing completed"
