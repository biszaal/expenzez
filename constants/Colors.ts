/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const COLORS = {
  primary: {
    main: "#7C3AED", // Purple
    light: "#A78BFA",
    dark: "#5B21B6",
    gradient: ["#7C3AED", "#8B5CF6"],
  },
  secondary: {
    main: "#10B981", // Green
    light: "#34D399",
    dark: "#059669",
    gradient: ["#10B981", "#059669"],
  },
  accent: {
    main: "#F59E0B", // Amber
    light: "#FBBF24",
    dark: "#D97706",
    gradient: ["#F59E0B", "#D97706"],
  },
  success: {
    main: "#10B981",
    light: "#34D399",
    dark: "#059669",
  },
  warning: {
    main: "#F59E0B",
    light: "#FBBF24",
    dark: "#D97706",
  },
  error: {
    main: "#EF4444",
    light: "#F87171",
    dark: "#DC2626",
  },
  info: {
    main: "#3B82F6",
    light: "#60A5FA",
    dark: "#2563EB",
  },
  text: {
    primary: "#1F2937",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    inverse: "#FFFFFF",
  },
  background: {
    primary: "#FFFFFF",
    secondary: "#F9FAFB",
    tertiary: "#F3F4F6",
    gradient: {
      primary: ["#F8FAFC", "#FFFFFF"],
      secondary: ["#FEF3C7", "#FDE68A"],
      tertiary: ["#DBEAFE", "#BFDBFE"],
    },
  },
  border: {
    light: "#E5E7EB",
    medium: "#D1D5DB",
    dark: "#9CA3AF",
  },
  shadow: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
  gradients: {
    primary: ["#7C3AED", "#8B5CF6"],
    secondary: ["#10B981", "#059669"],
    accent: ["#F59E0B", "#D97706"],
    success: ["#10B981", "#059669"],
    warning: ["#F59E0B", "#D97706"],
    error: ["#EF4444", "#DC2626"],
    info: ["#3B82F6", "#2563EB"],
    dark: ["#1F2937", "#374151"],
    light: ["#F8FAFC", "#FFFFFF"],
    warm: ["#FEF3C7", "#FDE68A"],
    cool: ["#DBEAFE", "#BFDBFE"],
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
};

export const FONT_WEIGHT = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
};

export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
  },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
  },
};

export const ANIMATIONS = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
  },
};

export const LAYOUT = {
  maxWidth: 1200,
  containerPadding: 16,
  sectionSpacing: 32,
};

export default COLORS;
