export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    folders: Folder[];
}

export interface FolderItem {
    id: string;
    type: "meeting" | "clip" | "document";
    name: string;
    date: string;
    size?: string;
    status?: string;
    file_type?: string;
    description?: string;
}

export interface Folder {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    items: FolderItem[];
}

export type MeetingSource = "zoom" | "meet" | "teams" | "clip";

export type ProcessingStep =
    | "scheduled"
    | "transcribing"
    | "transcribed"
    | "processing"
    | "processed"
    | "completed"
    | "summarizing";

export interface Meeting {
    id: string;
    name: string;
    platform: MeetingSource;
    status: ProcessingStep;
    duration: string;
    date: string;
    participants: string[];
    summary?: string;
    transcription?: string;
    recording?: string;
    tasks?: Task[];
    source?: MeetingSource;
    folderId?: string;
}

export interface Task {
    id: string;
    description: string;
    assignee?: string;
    dueDate?: string;
    status: "pending" | "completed";
    platform?: "clickup" | "asana" | "trello";
}

export interface Upload {
    id: string;
    name: string;
    progress: number;
    status: "uploading" | "processing" | "completed" | "error";
    type: "clip" | "file";
}

export type ActivityEvent =
    | "scheduled"
    | "transcribing"
    | "transcribed"
    | "uploading"
    | "uploaded"
    | "processing"
    | "processed";

export interface Activity {
    id: string;
    type: "meeting" | "clip" | "document";
    name: string;
    event: ActivityEvent;
    platform?: MeetingSource;
    timestamp: string;
}

export interface Document {
    id: string;
    name: string;
    fileType: string;
    createdAt: string;
    updatedAt: string;
    folderId?: string;
    size?: string;
    content?: string;
}
