import { Document } from "../types/documents";

const API_URL = "http://localhost:8000/api/v1";

export const documentsService = {
    async getDocuments(): Promise<Document[]> {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const response = await fetch(`${API_URL}/documents`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Error al obtener los documentos");
            }

            const data = await response.json();
            // Asumiendo que la API devuelve { items: Document[] }
            return Array.isArray(data.items) ? data.items : [];
        } catch (error) {
            console.error("Error al obtener los documentos:", error);
            throw error;
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
};
