import {
    Document,
    DocumentStatus,
    DocumentTranslation,
    GetDocumentsResponse,
} from "../../types/documents";
import { apiGet, apiPatch, apiDelete, getAuthToken } from "../utils/api";

// Interfaz para la respuesta de idiomas
export interface Language {
    code: string;
    name: string;
    native_name: string;
}

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
            console.log(`Obteniendo documento con ID: ${id}`);

            // Obtener directamente como Document
            const doc = await apiGet<Document>(`/documents/${id}`);

            console.log("Documento encontrado:", doc);
            return doc;
        } catch (error) {
            console.error("Error al obtener el documento:", error);

            // En caso de error, devolver null en lugar de propagar la excepción
            // para mantener la compatibilidad con el código existente
            return null;
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
            return await apiPatch<Document>(`/documents/${id}`, updates);
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
            const token = getAuthToken();
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            // Iniciar la descarga
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

            // Obtener el blob
            const blob = await response.blob();
            console.log("Respuesta exitosa:", {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
                blobType: blob.type,
                blobSize: blob.size,
            });

            // Crear un objeto URL
            const url = window.URL.createObjectURL(blob);

            // Crear un elemento de enlace
            const link = window.document.createElement("a");
            link.href = url;
            link.download = filename;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);

            // Limpiar
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error al descargar el documento:", error);
            throw error;
        }
    },

    async getPreviewUrl(id: string): Promise<string> {
        const token = getAuthToken();
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

    // Traducir un documento a un idioma específico
    async translateDocument(
        documentId: string,
        targetLanguage: string,
        forceRetranslate: boolean = false
    ): Promise<DocumentTranslation> {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const data = {
                target_language: targetLanguage,
                force_retranslate: forceRetranslate,
            };

            // Usar fetch directamente como en uploadDocument
            const response = await fetch(
                `${API_URL}/translations/documents/${documentId}/translate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                }
            );

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

                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const responseData = await response.json();
            console.log("Traducción creada:", responseData);
            return responseData;
        } catch (error) {
            console.error("Error al traducir el documento:", error);
            throw error;
        }
    },

    // Obtener traducciones disponibles para un documento
    async getDocumentTranslations(
        documentId: string
    ): Promise<DocumentTranslation[]> {
        try {
            const document = await this.getDocument(documentId);
            return document?.translations || [];
        } catch (error) {
            console.error(
                "Error al obtener las traducciones del documento:",
                error
            );
            throw error;
        }
    },

    // Obtener los idiomas disponibles en el sistema
    async getAvailableLanguages(): Promise<Language[]> {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const response = await fetch(`${API_URL}/translations/languages`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();
            return data.languages || [];
        } catch (error) {
            console.error("Error al obtener los idiomas disponibles:", error);
            // En caso de error, devolver un array vacío
            return [];
        }
    },
};
