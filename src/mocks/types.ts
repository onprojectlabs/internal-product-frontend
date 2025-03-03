import { Meeting, MeetingSource, Folder } from "../context/MeetingsContext";

// Tipos específicos para la API
export interface ApiResponse<T> {
    data: T;
    status: number;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}

export interface Clip {
    id: string;
    title: string;
    name: string; // Para compatibilidad con la vista
    duration: string;
    source: "upload" | "meeting";
    createdAt: Date;
    date: string; // Para mostrar en la UI
    folderId?: string;
    status: "processing" | "ready" | "error";
    thumbnailUrl?: string;
    summary: string;
    highlights: string[];
    downloadUrl: string;
}

export interface File {
    id: string;
    name: string;
    type: "document" | "presentation" | "spreadsheet";
    size: number;
    createdAt: Date;
    folderId?: string;
    status: "processing" | "ready" | "error";
    summary: string;
    downloadUrl: string;
    date: string;
}
