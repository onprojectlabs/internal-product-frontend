interface ClipTranscriptSegment {
    timestamp: string;
    text: string;
}

export interface Clip {
    id: string;
    title: string;
    url: string;
    createdAt: string;
    duration: string;
    folderId?: string;
    transcript?: ClipTranscriptSegment[];
    summary?: string;
    keywords?: string[];
    topics?: string[];
}
