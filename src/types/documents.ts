export type DocumentType = "pdf" | "doc" | "docx" | "txt" | "other";
export type DocumentStatus = "uploaded" | "processing" | "processed" | "failed";
export type TranslatedBy = "auto" | "manual" | "hybrid";

// Tipos para mensajes WebSocket
export type TaskType = "document_processing" | "document_translation";

// Estados específicos para traducción de documentos
export type TranslationStatus =
    | "pending"
    | "translating"
    | "completed"
    | "failed";

// Interfaz base para todos los mensajes de progreso
export interface BaseProgressMessage {
    document_id: string;
    task_type: TaskType;
    progress_percentage: number;
    current_stage: string;
    updated_at: string;
}

// Interfaz específica para procesamiento de documentos
export interface DocumentProcessingMessage extends BaseProgressMessage {
    task_type: "document_processing";
    status: DocumentStatus;
    completed_at?: string;
    processing_duration?: number;
    error?: {
        error_message: string;
        error_type: string;
        timestamp: string;
    };
}

// Interfaz específica para traducciones
export interface DocumentTranslationMessage extends BaseProgressMessage {
    task_type: "document_translation";
    status: TranslationStatus;
    task_id: string;
    target_language: string;
    completed_at?: string;
    processing_duration?: number;
    error?: string;
}

// Tipo unión para cualquier mensaje de progreso
export type ProgressMessage =
    | DocumentProcessingMessage
    | DocumentTranslationMessage;

export interface DocumentTranslation {
    id: string;
    document_id: string;
    language_code: string;
    title: string;
    summary: string;
    main_topics: string[];
    translated_by: TranslatedBy;
    created_at: string;
    updated_at: string;
}

export interface Document {
    id: string;
    filename: string;
    file_type: DocumentType;
    file_size: number;
    file_path: string;
    content_type: string;
    uploaded_by_id: string;
    folder_id?: string;
    created_at: string;
    updated_at: string;
    description?: string;
    status: DocumentStatus;
    processed_at?: string;
    title?: string;
    summary?: string;
    document_metadata: Record<string, unknown>;
    error_details: Record<string, unknown>;
    processing_stats: Record<string, unknown>;
    processing_progress: number;
    processing_stage?: string;
    detected_language?: string;
    translations: DocumentTranslation[];
}

// Interfaz para la respuesta del árbol de carpetas
export interface FolderTreeResponse {
    name: string;
    description: string;
    id: string;
    created_by_id: string;
    created_at: string;
    updated_at: string;
    documents: Document[];
    total_documents: number;
    subfolders: FolderTreeResponse[];
    total_subfolders: number;
}

export interface GetDocumentsResponse {
    items: Document[];
    total: number;
}
