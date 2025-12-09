/**
 * Theme Context
 *
 * React context for managing theme state across the application.
 * Provides the current theme, available themes, and a setter function.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  themes,
  applyTheme,
  getThemeOrDefault,
  DEFAULT_THEME_ID,
  type Theme,
} from "@/themes";
import * as api from "@/lib/api";

interface ThemeContextValue {
  /** Currently active theme */
  currentTheme: Theme;
  /** All available themes */
  themes: Theme[];
  /** Set the active theme by ID */
  setTheme: (themeId: string) => void;
  /** Whether the theme has been loaded from settings */
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  /** Initial theme ID (optional, will load from settings if not provided) */
  initialThemeId?: string;
}

/**
 * ThemeProvider component that wraps the application and provides theme context.
 * Automatically loads the saved theme from settings on mount.
 */
export function ThemeProvider({
  children,
  initialThemeId,
}: ThemeProviderProps) {
  const [currentThemeId, setCurrentThemeId] = useState<string>(
    initialThemeId ?? DEFAULT_THEME_ID
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from settings on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const settings = await api.loadSettings();
        const savedThemeId = settings.themeId as string | undefined;

        if (savedThemeId) {
          // Validate that the saved theme exists
          const theme = getThemeOrDefault(savedThemeId);
          setCurrentThemeId(theme.id);
          applyTheme(theme.id);
        } else {
          // Apply default theme
          applyTheme(DEFAULT_THEME_ID);
        }
      } catch (error) {
        console.error("Failed to load theme settings:", error);
        applyTheme(DEFAULT_THEME_ID);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (isLoaded) {
      applyTheme(currentThemeId);
    }
  }, [currentThemeId, isLoaded]);

  const setTheme = useCallback(async (themeId: string) => {
    const theme = getThemeOrDefault(themeId);
    setCurrentThemeId(theme.id);
    applyTheme(theme.id);

    // Persist to settings
    try {
      const currentSettings = await api.loadSettings();
      await api.saveSettings({
        ...currentSettings,
        themeId: theme.id,
      });
    } catch (error) {
      console.error("Failed to save theme setting:", error);
    }
  }, []);

  const currentTheme = getThemeOrDefault(currentThemeId);

  const value: ThemeContextValue = {
    currentTheme,
    themes,
    setTheme,
    isLoaded,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook to access the theme context.
 * Must be used within a ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
