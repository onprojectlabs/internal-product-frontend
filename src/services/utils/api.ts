/**
 * Utilidades para realizar llamadas a la API
 */

const API_URL = "http://localhost:8000/api/v1";

/**
 * Obtiene el token de autenticación del localStorage
 */
export const getAuthToken = (): string | null => {
    return localStorage.getItem("access_token");
};

/**
 * Verifica si hay un token de autenticación válido
 */
export const isAuthenticated = (): boolean => {
    return !!getAuthToken();
};

/**
 * Opciones por defecto para las peticiones fetch
 */
export const defaultFetchOptions = (options: RequestInit = {}): RequestInit => {
    const token = getAuthToken();

    return {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
        ...options,
    };
};

/**
 * Realiza una petición GET a la API
 */
export const apiGet = async <T>(
    endpoint: string,
    params?: Record<string, unknown>
): Promise<T> => {
    const queryParams = params
        ? new URLSearchParams(
              Object.entries(params)
                  .filter(([, value]) => value !== undefined)
                  .map(([key, value]) => [key, String(value)])
          ).toString()
        : "";

    const url = `${API_URL}${endpoint}${queryParams ? `?${queryParams}` : ""}`;

    const response = await fetch(url, defaultFetchOptions());
    return handleResponse<T>(response);
};

/**
 * Realiza una petición POST a la API
 */
export const apiPost = async <T>(
    endpoint: string,
    data?: Record<string, unknown>
): Promise<T> => {
    const response = await fetch(
        `${API_URL}${endpoint}`,
        defaultFetchOptions({
            method: "POST",
            body: data ? JSON.stringify(data) : undefined,
        })
    );

    return handleResponse<T>(response);
};

/**
 * Realiza una petición PUT a la API
 */
export const apiPut = async <T>(
    endpoint: string,
    data?: Record<string, unknown>
): Promise<T> => {
    const response = await fetch(
        `${API_URL}${endpoint}`,
        defaultFetchOptions({
            method: "PUT",
            body: data ? JSON.stringify(data) : undefined,
        })
    );

    return handleResponse<T>(response);
};

/**
 * Realiza una petición DELETE a la API
 */
export const apiDelete = async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(
        `${API_URL}${endpoint}`,
        defaultFetchOptions({
            method: "DELETE",
        })
    );

    return handleResponse<T>(response);
};

/**
 * Realiza una petición PATCH a la API
 */
export const apiPatch = async <T>(
    endpoint: string,
    data?: Record<string, unknown>
): Promise<T> => {
    const response = await fetch(
        `${API_URL}${endpoint}`,
        defaultFetchOptions({
            method: "PATCH",
            body: data ? JSON.stringify(data) : undefined,
        })
    );

    return handleResponse<T>(response);
};

/**
 * Maneja la respuesta de la API
 */
export const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        await handleApiError(response);
    }

    // Para respuestas vacías (como en DELETE)
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
};

/**
 * Maneja los errores de la API
 */
export const handleApiError = async (response: Response): Promise<never> => {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;

    try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (_error) {
        // Si no se puede parsear como JSON, usamos el mensaje por defecto
    }

    // Si es un error de autenticación, redirigir al login
    if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
    }

    throw new Error(errorMessage);
};
