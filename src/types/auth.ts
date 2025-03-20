export interface User {
    id: string;
    email: string;
    full_name: string;
    role: "user" | "admin";
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_login: string;
    default_language: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
}

export interface LoginRequest {
    username: string; // Es el email
    password: string;
}

export interface AuthError {
    detail: string;
}
