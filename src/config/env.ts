export const env = {
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
    GOOGLE_CLIENT_SECRET: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || "",
    APP_URL: import.meta.env.VITE_APP_URL || "http://localhost:5173",
} as const;
