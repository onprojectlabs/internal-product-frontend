export type DocumentType = "pdf" | "doc" | "docx" | "txt" | "other";
export type DocumentStatus = "uploaded" | "processing" | "processed" | "failed";

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
    error_details: Array<Record<string, unknown>>;
    processing_stats: Record<string, unknown>;
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
