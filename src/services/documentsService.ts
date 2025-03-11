import { Document, DocumentStatus } from "../types/documents";

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

const handleApiError = (error: unknown) => {
    // Error de red (servidor no disponible)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
            "El servicio no está disponible en este momento. Por favor, inténtalo más tarde."
        );
    }

    // Error de la API
    if (
        error instanceof Response ||
        (error as any).response instanceof Response
    ) {
        const response =
            error instanceof Response ? error : (error as any).response;
        switch (response.status) {
            case 401:
                throw new Error("No tienes autorización para acceder");
            case 403:
                throw new Error("No tienes permisos para realizar esta acción");
            case 404:
                throw new Error("El recurso solicitado no existe");
            case 500:
                throw new Error(
                    "Ha ocurrido un error en el servidor. Por favor, inténtalo más tarde"
                );
            default:
                throw new Error(
                    "Ha ocurrido un error. Por favor, inténtalo de nuevo"
                );
        }
    }

    // Error genérico
    throw new Error(
        "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo"
    );
};

export const documentsService = {
    API_URL,
    async getDocuments(
        params?: GetDocumentsParams
    ): Promise<GetDocumentsResponse> {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            // Construir query params
            const queryParams = new URLSearchParams();
            if (params?.limit) {
                queryParams.append("limit", params.limit.toString());
            }
            if (params?.skip) {
                queryParams.append("skip", params.skip.toString());
            }
            if (params?.folder_id) {
                queryParams.append("folder_id", params.folder_id);
            }
            if (params?.status) {
                queryParams.append("status", params.status);
            }
            if (params?.start_date) {
                queryParams.append("start_date", params.start_date);
            }
            if (params?.end_date) {
                queryParams.append("end_date", params.end_date);
            }
            if (params?.filename) {
                queryParams.append("filename", params.filename);
            }

            const response = await fetch(
                `${API_URL}/documents?${queryParams}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw response;
            }

            const data = await response.json();
            return {
                items: data.items || [],
                total: data.total || 0,
            };
        } catch (error) {
            console.error("Error al obtener los documentos:", error);
            throw handleApiError(error);
        }
    },

    async getDocument(id: string): Promise<Document | null> {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const response = await fetch(`${API_URL}/documents/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            console.log("Respuesta de la API:", response);

            if (!response.ok) {
                throw new Error("Error al obtener el documento");
            }

            return await response.json();
        } catch (error) {
            console.error("Error al obtener el documento:", error);
            throw error;
        }
    },

    async uploadDocument(file: File, description?: string): Promise<Document> {
        try {
            const token = localStorage.getItem("access_token");
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
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            console.log("Actualizando documento:", { id, updates });

            const response = await fetch(`${API_URL}/documents/${id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error detallado de la API:", errorData);
                throw new Error(
                    errorData.detail || "Error al actualizar el documento"
                );
            }

            const data = await response.json();
            console.log("Documento actualizado:", data);
            return data;
        } catch (error) {
            console.error("Error al actualizar el documento:", error);
            throw error;
        }
    },

    async deleteDocument(id: string): Promise<boolean> {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const response = await fetch(`${API_URL}/documents/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Error al eliminar el documento");
            }

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
