/**
 * Utilidades para el manejo de errores
 */

/**
 * Clase personalizada para errores de API
 */
export class ApiError extends Error {
    status: number;
    statusText: string;
    data?: unknown;

    constructor(response: Response, message?: string, data?: unknown) {
        super(message || `Error ${response.status}: ${response.statusText}`);
        this.name = "ApiError";
        this.status = response.status;
        this.statusText = response.statusText;
        this.data = data;
    }
}

/**
 * Clase para errores de autenticación
 */
export class AuthenticationError extends ApiError {
    constructor(response: Response, message?: string, data?: unknown) {
        super(response, message || "Error de autenticación", data);
        this.name = "AuthenticationError";
    }
}

/**
 * Clase para errores de permisos
 */
export class PermissionError extends ApiError {
    constructor(response: Response, message?: string, data?: unknown) {
        super(
            response,
            message || "No tienes permisos para realizar esta acción",
            data
        );
        this.name = "PermissionError";
    }
}

/**
 * Clase para errores de validación
 */
export class ValidationError extends ApiError {
    constructor(response: Response, message?: string, data?: unknown) {
        super(response, message || "Error de validación en los datos", data);
        this.name = "ValidationError";
    }
}

/**
 * Clase para errores de servidor
 */
export class ServerError extends ApiError {
    constructor(response: Response, message?: string, data?: unknown) {
        super(response, message || "Error interno del servidor", data);
        this.name = "ServerError";
    }
}

/**
 * Clase para errores de red
 */
export class NetworkError extends Error {
    constructor(message?: string) {
        super(message || "Error de conexión. Verifica tu conexión a internet");
        this.name = "NetworkError";
    }
}

/**
 * Función para crear el error apropiado según el código de estado
 */
export const createErrorFromResponse = async (
    response: Response
): Promise<Error> => {
    let data: unknown;

    try {
        data = await response.json();
    } catch {
        // Si no se puede parsear como JSON, continuamos sin datos
    }

    const message =
        data && typeof data === "object" && "message" in data
            ? String(data.message)
            : undefined;

    switch (response.status) {
        case 401:
            return new AuthenticationError(response, message, data);
        case 403:
            return new PermissionError(response, message, data);
        case 400:
        case 422:
            return new ValidationError(response, message, data);
        case 500:
        case 502:
        case 503:
        case 504:
            return new ServerError(response, message, data);
        default:
            return new ApiError(response, message, data);
    }
};
