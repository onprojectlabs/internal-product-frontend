import { tokens } from "../styles/tokens";
import { useThemeContext } from "../context/ThemeContext";

export function useTheme() {
    const { theme } = useThemeContext();
    return {
        colors: tokens[theme].colors,
        // Otros tokens según necesitemos
    };
}
