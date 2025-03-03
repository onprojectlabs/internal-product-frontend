export interface File {
    id: string;
    name: string;
    type: string;
    size: string;
    date: string;
    summary: string;
    downloadUrl: string;
    url?: string; // URL para visualizar el PDF
}
