export type DocumentStatus =
    | "uploaded"
    | "to_process"
    | "processing"
    | "processed"
    | "failed";

export interface Document {
    id: string;
    filename: string;
    file_type: string;
    description?: string;
    folder_id?: string;
    file_size: number;
    file_path: string;
    content_type: string;
    uploaded_by_id: string;
    created_at: string;
    updated_at: string;
    status: DocumentStatus;
    processed_at?: string;
    analysis_summary?: string;
    key_points?: Record<string, any>;
    error_message?: string;
    analysis_metadata?: Record<string, any>;
    summary?: string;
    keywords?: string[];
    topics?: string[];
}
