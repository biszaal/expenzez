import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "../hooks/useColorScheme";
import { lightColors, darkColors, createShadows } from "../constants/theme";

export type ColorScheme = "light" | "dark" | "system";

interface ThemeContextType {
  colorScheme: ColorScheme;
  isDark: boolean;
  colors: typeof lightColors;
  shadows: ReturnType<typeof createShadows>;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@expenzez_theme";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine if we should use dark mode
  const isDark =
    colorScheme === "system"
      ? systemColorScheme === "dark"
      : colorScheme === "dark";

  // Get the appropriate colors based on the current mode
  const colors = isDark ? darkColors : lightColors;
  const shadows = createShadows(isDark ? "dark" : "light");

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          setColorSchemeState(savedTheme as ColorScheme);
        }
      } catch (error) {
        console.error("Error loading theme preference:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, []);

  // Save theme preference
  const setColorScheme = async (scheme: ColorScheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
      setColorSchemeState(scheme);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    const newScheme = isDark ? "light" : "dark";
    setColorScheme(newScheme);
  };

  const value: ThemeContextType = {
    colorScheme,
    isDark,
    colors,
    shadows,
    setColorScheme,
    toggleTheme,
  };

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return (
      <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a fallback with light colors if context is not available
    const fallbackColors = lightColors;
    const fallbackShadows = createShadows("light");

    return {
      colorScheme: "light" as ColorScheme,
      isDark: false,
      colors: fallbackColors,
      shadows: fallbackShadows,
      setColorScheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
};
