import type { FolderItem } from "../../types/index";
import type { FolderTreeResponse } from "../../types/documents";

const API_URL = "http://localhost:8000/api/v1";

export const foldersService = {
    async getFolders(params?: {
        limit?: number;
        skip?: number;
        order_by_recent?: boolean;
    }) {
        try {
            const queryParams = new URLSearchParams();
            if (params?.limit)
                queryParams.append("limit", params.limit.toString());
            if (params?.skip)
                queryParams.append("skip", params.skip.toString());
            if (params?.order_by_recent)
                queryParams.append(
                    "order_by_recent",
                    params.order_by_recent.toString()
                );

            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            console.log("Obteniendo carpetas con params:", params);
            const response = await fetch(`${API_URL}/folders?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            console.log("Estado de la respuesta:", response.status);
            console.log(
                "Headers de la respuesta:",
                Object.fromEntries(response.headers.entries())
            );

            const data = await response.json();
            console.log("Datos recibidos de la API:", data);

            if (!response.ok) {
                throw new Error(data.detail || "Error al obtener las carpetas");
            }

            return data;
        } catch (error) {
            console.error("Error al obtener las carpetas:", error);
            throw error;
        }
    },

    async getFolder(id: string): Promise<FolderTreeResponse> {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            console.log("Obteniendo carpeta con ID:", id);
            const url = `${API_URL}/folders/${id}/tree`;
            console.log("URL de la petición:", url);

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            console.log("Estado de la respuesta:", response.status);
            console.log(
                "Headers de la respuesta:",
                Object.fromEntries(response.headers.entries())
            );

            if (response.status === 404) {
                throw new Error("La carpeta no existe o fue eliminada");
            }

            const data = await response.json();
            console.log("Datos de la carpeta recibidos:", data);

            if (!response.ok) {
                throw new Error(data.detail || "Error al obtener la carpeta");
            }

            // Verificar que tenemos los datos mínimos necesarios
            if (!data || !data.id) {
                throw new Error(
                    "Los datos de la carpeta están incompletos o son inválidos"
                );
            }

            return data;
        } catch (error) {
            console.error("Error al obtener la carpeta:", error);
            throw error;
        }
    },

    async createFolder(data: {
        name: string;
        description: string;
        parent_folder_id?: string;
    }) {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const response = await fetch(`${API_URL}/folders`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || "Error al crear la carpeta");
            }

            return await response.json();
        } catch (error) {
            console.error("Error al crear la carpeta:", error);
            throw error;
        }
    },

    async deleteFolder(id: string) {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const response = await fetch(`${API_URL}/folders/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || "Error al eliminar la carpeta");
            }

            return true;
        } catch (error) {
            console.error("Error al eliminar la carpeta:", error);
            throw error;
        }
    },

    async updateFolder(
        id: string,
        data: {
            name: string;
            description: string;
        }
    ) {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const response = await fetch(`${API_URL}/folders/${id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.detail || "Error al actualizar la carpeta"
                );
            }

            return await response.json();
        } catch (error) {
            console.error("Error al actualizar la carpeta:", error);
            throw error;
        }
    },

    async assignToFolder(folderId: string, item: FolderItem) {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const response = await fetch(
                `${API_URL}/folders/${folderId}/items`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(item),
                }
            );

            if (!response.ok) {
                throw new Error("Error al asignar el elemento a la carpeta");
            }

            return response.json();
        } catch (error) {
            console.error("Error al asignar el elemento a la carpeta:", error);
            throw error;
        }
    },
};
