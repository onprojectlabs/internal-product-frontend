import { User } from "../../types/auth";

const API_URL = "http://localhost:8000/api/v1";

interface ProfileUpdateRequest {
    full_name?: string;
    default_language?: string;
    password?: string;
}

export interface Language {
    code: string;
    name: string;
    native_name: string;
    icon_url: string;
}

interface LanguagesResponse {
    languages: Language[];
}

export const profileService = {
    // Obtener datos del perfil del usuario actual
    async getProfile(): Promise<User> {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw {
                    detail: errorData.detail,
                    response: response,
                };
            }

            return await response.json();
        } catch (error) {
            console.error("Error al obtener el perfil:", error);
            throw error;
        }
    },

    // Actualizar el perfil del usuario
    async updateProfile(data: ProfileUpdateRequest): Promise<User> {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            const response = await fetch(`${API_URL}/auth/me`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw {
                    detail: errorData.detail,
                    response: response,
                };
            }

            return await response.json();
        } catch (error) {
            console.error("Error al actualizar el perfil:", error);
            throw error;
        }
    },

    // Obtener los idiomas disponibles
    async getAvailableLanguages(): Promise<Language[]> {
        try {
            const token = localStorage.getItem("access_token");
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
                const errorData = await response.json();
                throw {
                    detail: errorData.detail,
                    response: response,
                };
            }

            const data = (await response.json()) as LanguagesResponse;
            return data.languages;
        } catch (error) {
            console.error("Error al obtener los idiomas disponibles:", error);
            throw error;
        }
    },
};
