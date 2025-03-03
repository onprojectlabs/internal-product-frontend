export const tokens = {
    light: {
        colors: {
            // Fondos
            background: {
                DEFAULT: "hsl(0 0% 100%)",
                card: "hsl(0 0% 98%)",
                hover: "hsl(0 0% 96%)",
            },
            // Textos
            text: {
                DEFAULT: "hsl(240 10% 3.9%)",
                muted: "hsl(240 3.8% 46.1%)",
                primary: "hsl(240 5.9% 10%)",
            },
            // Bordes
            border: {
                DEFAULT: "hsl(240 5.9% 90%)",
                hover: "hsl(240 4.9% 83.9%)",
            },
            // Estados
            state: {
                active: "hsl(221.2 83.2% 53.3% / 0.1)",
                hover: "hsl(240 4.9% 93.9%)",
            },
            // Acciones
            action: {
                destructive: "hsl(0 84.2% 60.2%)",
                success: "hsl(142.1 76.2% 36.3%)",
                warning: "hsl(38 92% 50%)",
            },
        },
    },
    dark: {
        colors: {
            // Fondos
            background: {
                DEFAULT: "hsl(240 10% 3.9%)",
                card: "hsl(240 10% 3.9%)",
                hover: "hsl(240 3.7% 15.9%)",
            },
            // Textos
            text: {
                DEFAULT: "hsl(0 0% 98%)",
                muted: "hsl(240 5% 64.9%)",
                primary: "hsl(0 0% 98%)",
            },
            // Bordes
            border: {
                DEFAULT: "hsl(240 3.7% 15.9%)",
                hover: "hsl(240 5% 64.9%)",
            },
            // Estados
            state: {
                active: "hsl(217.2 91.2% 59.8% / 0.2)",
                hover: "hsl(240 3.7% 15.9%)",
            },
            // Acciones
            action: {
                destructive: "hsl(0 62.8% 30.6%)",
                success: "hsl(142.1 70.6% 45.3%)",
                warning: "hsl(48 96.5% 53.3%)",
            },
        },
    },
} as const;

// Tipos de utilidad
type ThemeTokens = typeof tokens.light | typeof tokens.dark;
export type ColorTokens = ThemeTokens["colors"];
