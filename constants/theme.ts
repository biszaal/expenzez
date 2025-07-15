// Global theme constants for consistent design
export const lightColors = {
  // Primary colors
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },

  // Secondary colors
  secondary: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
    800: "#166534",
    900: "#14532D",
  },

  // Gray scale
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },

  // Status colors
  success: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
  },

  error: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
  },

  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
  },

  // Background colors
  background: {
    primary: "#FFFFFF",
    secondary: "#F8FAFC",
    tertiary: "#F1F5F9",
  },

  // Text colors
  text: {
    primary: "#1F2937",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    inverse: "#FFFFFF",
  },

  // Border colors
  border: {
    light: "#E5E7EB",
    medium: "#D1D5DB",
    dark: "#9CA3AF",
  },

  // Shadow colors
  shadow: {
    light: "rgba(0, 0, 0, 0.05)",
    medium: "rgba(0, 0, 0, 0.1)",
    dark: "rgba(0, 0, 0, 0.15)",
  },
};

export const darkColors = {
  // Primary colors (darker for dark mode)
  primary: {
    50: "#0F172A",
    100: "#1E293B",
    200: "#334155",
    300: "#475569",
    400: "#64748B",
    500: "#8B5CF6",
    600: "#A78BFA",
    700: "#C4B5FD",
    800: "#DDD6FE",
    900: "#EDE9FE",
  },

  // Secondary colors (darker for dark mode)
  secondary: {
    50: "#052e16",
    100: "#064e3b",
    200: "#065f46",
    300: "#047857",
    400: "#059669",
    500: "#10b981",
    600: "#34d399",
    700: "#6ee7b7",
    800: "#a7f3d0",
    900: "#d1fae5",
  },

  // Gray scale (darker for dark mode)
  gray: {
    50: "#0F0F0F",
    100: "#1A1A1A",
    200: "#262626",
    300: "#404040",
    400: "#525252",
    500: "#737373",
    600: "#A3A3A3",
    700: "#D4D4D4",
    800: "#E5E5E5",
    900: "#F5F5F5",
  },

  // Status colors (darker for dark mode)
  success: {
    50: "#052e16",
    100: "#064e3b",
    200: "#065f46",
    300: "#047857",
    400: "#059669",
    500: "#10b981",
    600: "#34d399",
    700: "#6ee7b7",
  },

  error: {
    50: "#450a0a",
    100: "#7f1d1d",
    200: "#991b1b",
    300: "#b91c1c",
    400: "#dc2626",
    500: "#ef4444",
    600: "#f87171",
    700: "#fca5a5",
  },

  warning: {
    50: "#451a03",
    100: "#78350f",
    200: "#92400e",
    300: "#a16207",
    400: "#ca8a04",
    500: "#eab308",
    600: "#fbbf24",
    700: "#fcd34d",
  },

  // Background colors (darker for dark mode)
  background: {
    primary: "#0F0F0F",
    secondary: "#1A1A1A",
    tertiary: "#262626",
  },

  // Text colors (darker for dark mode)
  text: {
    primary: "#F5F5F5",
    secondary: "#D4D4D4",
    tertiary: "#A3A3A3",
    inverse: "#0F0F0F",
  },

  // Border colors (darker for dark mode)
  border: {
    light: "#262626",
    medium: "#404040",
    dark: "#525252",
  },

  // Shadow colors (darker for dark mode)
  shadow: {
    light: "rgba(0, 0, 0, 0.5)",
    medium: "rgba(0, 0, 0, 0.7)",
    dark: "rgba(0, 0, 0, 0.9)",
  },
};

// Legacy colors export for backward compatibility
export const colors = lightColors;

export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
  },

  fontWeights: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },

  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
};

// Create shadow styles for both light and dark modes
export const createShadows = (colorScheme: "light" | "dark") => {
  const shadowColors =
    colorScheme === "dark" ? darkColors.shadow : lightColors.shadow;

  return {
    sm: {
      shadowColor: shadowColors.light,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: shadowColors.medium,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: shadowColors.dark,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 8,
    },
  };
};

// Legacy shadows export for backward compatibility
export const shadows = createShadows("light");

export const layout = {
  screenPadding: 24,
  cardPadding: 24,
  buttonHeight: 48,
  inputHeight: 48,
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
};
