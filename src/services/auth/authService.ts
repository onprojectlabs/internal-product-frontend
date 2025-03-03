import {
    User,
    LoginResponse,
    RegisterRequest,
    LoginRequest,
} from "../../types/auth";

const API_URL = "http://localhost:8000/api/v1";

interface ApiError {
    detail: string;
    response?: Response;
}

const getErrorMessage = (error: unknown) => {
    // Error de red (servidor no disponible)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
        return "El servicio no está disponible en este momento. Por favor, inténtalo más tarde.";
    }

    // Error de la API
    const apiError = error as ApiError;
    if (apiError.response) {
        switch (apiError.response.status) {
            case 401:
                return apiError.detail === "Incorrect email or password"
                    ? "El correo electrónico o la contraseña son incorrectos"
                    : "No tienes autorización para acceder";
            case 403:
                return "Tu cuenta está inactiva. Por favor, contacta con soporte";
            case 404:
                return "El recurso solicitado no existe";
            case 500:
                return "Ha ocurrido un error en el servidor. Por favor, inténtalo más tarde";
            default:
                return "Ha ocurrido un error. Por favor, inténtalo de nuevo";
        }
    }

    // Errores específicos del backend por el mensaje
    if (apiError.detail) {
        switch (apiError.detail) {
            case "Email already registered":
                return "Este correo electrónico ya está registrado";
            case "Incorrect email or password":
                return "El correo electrónico o la contraseña son incorrectos";
            case "Inactive user":
                return "Tu cuenta está inactiva. Por favor, contacta con soporte";
            case "Could not validate credentials":
                return "Tu sesión ha expirado. Por favor, inicia sesión de nuevo";
            default:
                return "Ha ocurrido un error. Por favor, inténtalo de nuevo";
        }
    }

    return "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo";
};

export const authService = {
    async register(data: RegisterRequest): Promise<User> {
        try {
            console.log("Intentando registrar usuario:", {
                email: data.email,
                fullName: data.full_name,
            });

            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const responseData = await response.json();
            console.log("Respuesta del registro:", {
                status: response.status,
                data: responseData,
            });

            if (!response.ok) {
                throw {
                    detail: responseData.detail,
                    response: response,
                };
            }

            return responseData;
        } catch (error) {
            console.error("Error en registro:", error);
            throw new Error(getErrorMessage(error));
        }
    },

    async login(data: LoginRequest): Promise<LoginResponse> {
        try {
            console.log("Intentando login con:", { username: data.username });

            const formData = new URLSearchParams();
            formData.append("username", data.username);
            formData.append("password", data.password);

            // Log de la petición completa (sin la contraseña)
            console.log("URL:", `${API_URL}/auth/login`);
            console.log("Headers:", {
                "Content-Type": "application/x-www-form-urlencoded",
            });
            console.log(
                "Body format:",
                formData.toString().replace(data.password, "[PASSWORD]")
            );

            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "application/json",
                },
                body: formData,
            });

            console.log("Estado de la respuesta:", response.status);
            console.log(
                "Headers de la respuesta:",
                Object.fromEntries(response.headers.entries())
            );

            // Si hay un error de red, fetch lanzará un TypeError
            const responseData = await response.json();
            console.log("Datos de la respuesta:", {
                status: response.status,
                ok: response.ok,
                data: responseData,
            });

            if (!response.ok) {
                throw {
                    detail: responseData.detail,
                    response: response,
                };
            }

            localStorage.setItem("access_token", responseData.access_token);
            localStorage.setItem("refresh_token", responseData.refresh_token);

            return responseData;
        } catch (error) {
            console.error("Error en login:", error);
            throw new Error(getErrorMessage(error));
        }
    },

    async getCurrentUser(): Promise<User> {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            console.log(
                "Obteniendo usuario actual con token:",
                token.substring(0, 10) + "..."
            );

            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const responseData = await response.json();
            console.log("Respuesta de usuario actual:", {
                status: response.status,
                data: responseData,
            });

            if (!response.ok) {
                throw {
                    detail: responseData.detail,
                    response: response,
                };
            }

            return responseData;
        } catch (error) {
            console.error("Error al obtener usuario:", error);
            throw new Error(getErrorMessage(error));
        }
    },

    logout() {
        console.log("Cerrando sesión...");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
    },

    isAuthenticated(): boolean {
        const hasToken = !!localStorage.getItem("access_token");
        console.log("¿Está autenticado?:", hasToken);
        return hasToken;
    },
};
