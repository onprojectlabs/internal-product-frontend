import { Document, DocumentStatus } from "../../types/documents";
import { apiGet, apiPatch, apiDelete, getAuthToken } from "../utils/api";

const API_URL = "http://localhost:8000/api/v1";

interface GetDocumentsParams {
    limit?: number;
    skip?: number;
    folder_id?: string;
    status?: DocumentStatus;
    start_date?: string;
    end_date?: string;
    filename?: string;
}

interface GetDocumentsResponse {
    items: Document[];
    total: number;
}

export const documentsService = {
    API_URL,
    async getDocuments(
        params?: GetDocumentsParams
    ): Promise<GetDocumentsResponse> {
        try {
            const response = await apiGet<GetDocumentsResponse>(
                "/documents",
                params as Record<string, unknown>
            );
            return {
                items: response.items || [],
                total: response.total || 0,
            };
        } catch (error) {
            console.error("Error al obtener los documentos:", error);
            throw error;
        }
    },

    async getDocument(id: string): Promise<Document | null> {
        try {
            return await apiGet<Document>(`/documents/${id}`);
        } catch (error) {
            console.error("Error al obtener el documento:", error);
            throw error;
        }
    },

    async uploadDocument(file: File, description?: string): Promise<Document> {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const formData = new FormData();
            formData.append("file", file);
            formData.append("filename", file.name);
            if (description) {
                formData.append("description", description);
            }
            formData.append("auto_process", "true");

            console.log("Enviando archivo:", {
                nombre: file.name,
                tipo: file.type,
                tamaño: file.size,
                formData: Object.fromEntries(formData.entries()),
            });

            const response = await fetch(`${API_URL}/documents`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error detallado de la API:", errorData);

                if (errorData.detail) {
                    throw new Error(
                        typeof errorData.detail === "string"
                            ? errorData.detail
                            : JSON.stringify(errorData.detail)
                    );
                }

                if (errorData.validation_error) {
                    throw new Error(
                        `Error de validación: ${JSON.stringify(errorData.validation_error)}`
                    );
                }

                throw new Error(JSON.stringify(errorData));
            }

            const data = await response.json();
            console.log("Respuesta exitosa:", data);
            return data;
        } catch (error) {
            console.error("Error al subir el documento:", error);
            throw error;
        }
    },

    async updateDocument(
        id: string,
        updates: Partial<Document>
    ): Promise<Document> {
        try {
            return await apiPatch<Document>(
                `/documents/${id}`,
                updates as Record<string, unknown>
            );
        } catch (error) {
            console.error("Error al actualizar el documento:", error);
            throw error;
        }
    },

    async deleteDocument(id: string): Promise<boolean> {
        try {
            await apiDelete(`/documents/${id}`);
            return true;
        } catch (error) {
            console.error("Error al eliminar el documento:", error);
            throw error;
        }
    },

    async downloadDocument(id: string, filename: string): Promise<void> {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const response = await fetch(
                `${API_URL}/documents/${id}/download`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.log("Error en la respuesta:", {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: errorText,
                });
                throw new Error("Error al descargar el documento");
            }

            const blob = await response.blob();
            console.log("Respuesta exitosa:", {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
                blobType: blob.type,
                blobSize: blob.size,
            });

            const url = window.URL.createObjectURL(blob);
            const link = window.document.createElement("a");
            link.href = url;
            link.download = filename;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error al descargar el documento:", error);
            throw error;
        }
    },

    async getPreviewUrl(id: string): Promise<string> {
        const token = localStorage.getItem("access_token");
        if (!token) {
            throw new Error("No hay sesión activa");
        }

        const response = await fetch(`${API_URL}/documents/${id}/download`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Error al obtener la vista previa del documento");
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    },
};
