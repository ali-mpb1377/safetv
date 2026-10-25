import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/theme";

type ThemeMode = "light" | "dark" | "pitchblack";

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  theme: typeof Colors.dark;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = "prysm_theme_mode";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Three fixed themes - light, dark, pitch black - taken straight from
 * constants/theme.ts. The TV screens build their chrome from the same tokens
 * (createTvPalette), so phone, tablet and TV always look identical. There is
 * no wallpaper / seed-color theming.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("pitchblack");
  const [isLoaded, setIsLoaded] = useState(false);

  const isDark = themeMode !== "light";

  const loadTheme = useCallback(async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (
        savedTheme === "light" ||
        savedTheme === "dark" ||
        savedTheme === "pitchblack"
      ) {
        setThemeModeState(savedTheme);
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const toggleTheme = async () => {
    const newMode = themeMode === "dark" ? "light" : "dark";
    await setThemeMode(newMode);
  };

  const theme = useMemo(
    () =>
      themeMode === "pitchblack"
        ? Colors.pitchblack
        : isDark
          ? Colors.dark
          : Colors.light,
    [themeMode, isDark],
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{ themeMode, isDark, theme, setThemeMode, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
