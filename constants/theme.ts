// Expenzez v1.6 — Midnight Cobalt, dark/light variants.
// Source: design handoff (Expenzez Logo Final + Color Recommendations).
// Brand cobalt #4E7CFF is accent-only (<10% of screen); navy surfaces, never pure black.
export const lightColors = {
  // Primary colors - Midnight Cobalt
  primary: {
    50: "#EAEFFE",
    100: "#D6E0FE",
    200: "#B0C4FC",
    300: "#7B9CF8",
    400: "#4A6FF4",
    500: "#2547F0", // Main cobalt (light mode contrast-safe)
    600: "#1E3AC4", // Dim variant for hover/pressed/gradients
    700: "#182F9C",
    800: "#142578",
    900: "#0F1C5C",
    main: "#2547F0",
    glow: "rgba(37,71,240,0.22)", // Soft glow for shadows behind primary CTAs
  },

  // Secondary - cool mint (positive / income / savings) — harmonizes with cobalt
  secondary: {
    50: "#E4F8EF",
    100: "#C6F1DE",
    200: "#94E6C2",
    300: "#5FE3A1",
    400: "#2EC988",
    500: "#13A06B", // Main mint (light mode contrast-safe)
    600: "#0F855A",
    700: "#0C6B49",
    800: "#095338",
    900: "#063C28",
    main: "#13A06B",
  },

  // Accent — kept as cyan for charts / informational badges
  accent: {
    50: "#E6F2FA",
    100: "#C5E0F1",
    200: "#9BC9E5",
    300: "#5BA1CC",
    400: "#3F8FBF",
    500: "#2D7DB8", // Cyan accent
    600: "#256594",
    700: "#1D4D71",
    800: "#15364E",
    900: "#0D2030",
    main: "#2D7DB8",
  },

  // Neutral gray scale - Essential only
  gray: {
    50: "#FAFAFA",
    100: "#F4F4F5",
    200: "#E4E4E7",
    300: "#D4D4D8",
    400: "#A1A1AA",
    500: "#71717A",
    600: "#52525B",
    700: "#3F3F46",
    800: "#27272A",
    900: "#18181B",
  },

  // Status colors — light mode tones
  success: {
    50: "#E4F8EF",
    100: "#C6F1DE",
    500: "#13A06B", // Mint as success in light mode
    600: "#0F855A",
    700: "#0C6B49",
    main: "#13A06B",
  },

  error: {
    50: "#FCE7EA",
    100: "#F8C2CA",
    500: "#E0455A", // Coral (light mode contrast-safe)
    600: "#B83345",
    700: "#8C2735",
    main: "#E0455A",
  },

  warning: {
    50: "#F8EBD0",
    100: "#EFD49B",
    500: "#B8761A", // Amber
    600: "#8C5A14",
    700: "#664210",
    main: "#B8761A",
  },

  // Backgrounds (light)
  background: {
    primary: "#F7F9FF", // bg
    secondary: "#EEF2FE", // bgSoft
    tertiary: "#F2F5FE", // cardSoft
    overlay: "rgba(37,71,240,0.06)",
  },

  // Text hierarchy (light)
  text: {
    primary: "#0A1226",
    secondary: "rgba(10,18,38,0.62)",
    tertiary: "rgba(10,18,38,0.42)",
    inverse: "#FFFFFF",
    muted: "rgba(10,18,38,0.30)",
    textSecondary: "rgba(10,18,38,0.62)",
  },

  divider: "rgba(10,18,38,0.05)",

  // Borders (light)
  border: {
    light: "rgba(10,18,38,0.05)",
    medium: "rgba(10,18,38,0.08)",
    dark: "rgba(10,18,38,0.14)",
    focus: "#2547F0",
  },

  shadow: {
    subtle: "rgba(10,18,38,0.04)",
    soft: "rgba(10,18,38,0.08)",
    medium: "rgba(10,18,38,0.12)",
    strong: "rgba(10,18,38,0.18)",
  },

  // Cards (light)
  card: {
    background: "#FFFFFF",
    border: "rgba(10,18,38,0.08)",
    shadow: "rgba(10,18,38,0.04)",
  },

  // Accent palettes — mint (positive), coral (negative), cobalt-light, cyan (data).
  lime: { 500: "#13A06B", 600: "#0F855A", main: "#13A06B" },
  rose: { 500: "#E0455A", 600: "#B83345", main: "#E0455A" },
  amber: { 500: "#B8761A", 600: "#8C5A14", main: "#B8761A" },
  cyan: { 500: "#2D7DB8", 600: "#256594", main: "#2D7DB8" },

  // Soft positive / negative tints (used for cashflow chips / badges)
  posBg: "rgba(19,160,107,0.12)",
  posFg: "#0F855A",
  negBg: "rgba(224,69,90,0.10)",
  negFg: "#B83345",

  // Category color pairs (light)
  category: {
    food: { bg: "rgba(200,90,30,0.10)", fg: "#8C4515" },
    transport: { bg: "rgba(45,125,184,0.10)", fg: "#1F5680" },
    shopping: { bg: "rgba(190,55,90,0.10)", fg: "#8C2A4A" },
    entertainment: { bg: "rgba(19,160,107,0.12)", fg: "#0C6B49" },
    bills: { bg: "rgba(37,71,240,0.10)", fg: "#1E3AC4" },
    healthcare: { bg: "rgba(50,130,90,0.10)", fg: "#1F5638" },
    travel: { bg: "rgba(80,90,180,0.10)", fg: "#2F3A8A" },
    groceries: { bg: "rgba(184,118,26,0.12)", fg: "#7A4F12" },
    income: { bg: "rgba(19,160,107,0.14)", fg: "#0C6B49" },
  },

  // Additional utility colors for components
  red: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
  },

  green: {
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

  blue: {
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

  orange: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316",
    600: "#EA580C",
    700: "#C2410C",
    800: "#9A3412",
    900: "#7C2D12",
  },

  yellow: {
    50: "#FEFCE8",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
};

export const darkColors = {
  // Primary - Midnight Cobalt in dark mode
  primary: {
    50: "#0E1A3D",
    100: "#16245A",
    200: "#1F347F",
    300: "#2F4FB8",
    400: "#3E66E0",
    500: "#4E7CFF", // Main cobalt (dark mode)
    600: "#3559CC", // Dim variant for hover/pressed/gradients
    700: "#2B47A6",
    800: "#1F347F",
    900: "#16245A",
    main: "#4E7CFF",
    glow: "rgba(78,124,255,0.35)",
  },

  // Secondary - cool mint accent (dark mode)
  secondary: {
    50: "#063C28",
    100: "#095338",
    200: "#0C6B49",
    300: "#13A06B",
    400: "#2EC988",
    500: "#5FE3A1", // Mint (dark mode contrast-safe)
    600: "#7CEBB5",
    700: "#98F0C7",
    800: "#B6F5D9",
    900: "#D4FAEB",
    main: "#5FE3A1",
  },

  // Accent - cyan
  accent: {
    50: "#0D2030",
    100: "#15364E",
    200: "#1D4D71",
    300: "#256594",
    400: "#2D7DB8",
    500: "#5BC8FF", // Cyan (dark mode bright)
    600: "#7AD4FF",
    700: "#9FDDFF",
    800: "#C5E8FF",
    900: "#E5F4FF",
    main: "#5BC8FF",
  },

  // Neutral gray scale - Inverted for dark mode
  gray: {
    50: "#18181B",
    100: "#27272A",
    200: "#3F3F46",
    300: "#52525B",
    400: "#71717A",
    500: "#A1A1AA",
    600: "#D4D4D8",
    700: "#E4E4E7",
    800: "#F4F4F5",
    900: "#FAFAFA",
  },

  // Status colors — dark mode
  success: {
    50: "#063C28",
    100: "#095338",
    500: "#5FE3A1", // Mint as success in dark mode
    600: "#7CEBB5",
    700: "#98F0C7",
    main: "#5FE3A1",
  },

  error: {
    50: "#3D0E15",
    100: "#5E1722",
    500: "#FF6B7A", // Coral
    600: "#E5505F",
    700: "#C03B49",
    main: "#FF6B7A",
  },

  warning: {
    50: "#3B2A0A",
    100: "#5A3F12",
    500: "#F5B342", // Amber
    600: "#D89A2E",
    700: "#B57F22",
    main: "#F5B342",
  },

  // Backgrounds (dark) — deep navy, never pure black
  background: {
    primary: "#0A1226", // bg
    secondary: "#10193A", // bgSoft
    tertiary: "#16224D", // cardSoft
    overlay: "rgba(78,124,255,0.10)",
  },

  // Text hierarchy (dark)
  text: {
    primary: "#EEF1FA",
    secondary: "rgba(238,241,250,0.62)",
    tertiary: "rgba(238,241,250,0.38)",
    inverse: "#0A1226",
    muted: "rgba(238,241,250,0.30)",
    textSecondary: "rgba(238,241,250,0.62)",
  },

  divider: "rgba(180,200,255,0.06)",

  // Borders (dark)
  border: {
    light: "rgba(180,200,255,0.06)",
    medium: "rgba(180,200,255,0.09)",
    dark: "rgba(180,200,255,0.14)",
    focus: "#4E7CFF",
  },

  shadow: {
    subtle: "rgba(0,0,0,0.40)",
    soft: "rgba(0,0,0,0.55)",
    medium: "rgba(0,0,0,0.70)",
    strong: "rgba(0,0,0,0.85)",
  },

  card: {
    background: "#10193A", // card
    border: "rgba(180,200,255,0.09)",
    shadow: "rgba(0,0,0,0.55)",
  },

  // Accent palettes — mint (positive), coral (negative), cobalt-light, cyan (data).
  lime: { 500: "#5FE3A1", 600: "#7CEBB5", main: "#5FE3A1" },
  rose: { 500: "#FF6B7A", 600: "#E5505F", main: "#FF6B7A" },
  amber: { 500: "#F5B342", 600: "#D89A2E", main: "#F5B342" },
  cyan: { 500: "#5BC8FF", 600: "#7AD4FF", main: "#5BC8FF" },

  posBg: "rgba(95,227,161,0.16)",
  posFg: "#5FE3A1",
  negBg: "rgba(255,107,122,0.14)",
  negFg: "#FF6B7A",

  // Category color pairs (dark)
  category: {
    food: { bg: "rgba(255,143,90,0.16)", fg: "#FFB48A" },
    transport: { bg: "rgba(91,200,255,0.16)", fg: "#7AD4FF" },
    shopping: { bg: "rgba(255,107,122,0.16)", fg: "#FF95A0" },
    entertainment: { bg: "rgba(95,227,161,0.16)", fg: "#5FE3A1" },
    bills: { bg: "rgba(78,124,255,0.18)", fg: "#9CB4FF" },
    healthcare: { bg: "rgba(112,221,165,0.16)", fg: "#7BE5B0" },
    travel: { bg: "rgba(120,140,255,0.16)", fg: "#9FAFFF" },
    groceries: { bg: "rgba(245,179,66,0.16)", fg: "#F5C77A" },
    income: { bg: "rgba(95,227,161,0.18)", fg: "#5FE3A1" },
  },

  // Additional utility colors for components (same as light theme)
  red: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
  },

  green: {
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

  blue: {
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

  orange: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316",
    600: "#EA580C",
    700: "#C2410C",
    800: "#9A3412",
    900: "#7C2D12",
  },

  yellow: {
    50: "#FEFCE8",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
};

// Legacy colors export for backward compatibility
export const colors = lightColors;

// Geist font family — primary (body) and Geist Mono (numerals/currency).
// Loaded via @expo-google-fonts/geist + @expo-google-fonts/geist-mono in
// the root layout. Falls back to system if fonts haven't loaded yet.
export const fontFamily = {
  // Body — Geist
  regular: "Geist_400Regular",
  medium: "Geist_500Medium",
  semibold: "Geist_600SemiBold",
  bold: "Geist_700Bold",
  // Mono — for currency, balances, account numbers (tabular numerals)
  mono: "GeistMono_400Regular",
  monoMedium: "GeistMono_500Medium",
  monoSemibold: "GeistMono_600SemiBold",
};

// Minimal typography system - clean and readable
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

  // Alias for backward compatibility
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
  },

  // Simplified font weights - professional hierarchy
  fontWeights: {
    normal: "400", // Regular text
    medium: "500", // Slightly emphasized
    semibold: "600", // Important text
    bold: "700", // Headings and strong emphasis
  },

  // Alias for backward compatibility
  weights: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    // Removed extrabold and black for minimal approach
  },

  // Clean line heights for readability
  lineHeights: {
    tight: 1.25, // Headings
    normal: 1.5, // Body text
    relaxed: 1.6, // Long form content
  },

  // Minimal letter spacing
  letterSpacing: {
    tight: -0.25, // Headings
    normal: 0, // Body text
    wide: 0.25, // Buttons and labels
  },
};

// Minimal spacing system - consistent rhythm
export const spacing = {
  xs: 4, // Tight spacing
  sm: 8, // Small gaps
  md: 16, // Standard spacing
  lg: 24, // Comfortable spacing
  xl: 32, // Large spacing
  "2xl": 48, // Section spacing
  "3xl": 64, // Page spacing
};

// Minimal border radius system - subtle and clean with more curves
export const borderRadius = {
  sm: 8, // Small elements
  md: 12, // Standard elements
  lg: 16, // Cards and containers
  xl: 20, // Large containers
  "2xl": 24, // Special containers
  "3xl": 32, // Extra large containers - more curved
  "4xl": 40, // Very large containers - very curved
  full: 9999, // Circular elements
};

// Create minimal shadow styles for both light and dark modes
export const createShadows = (colorScheme: "light" | "dark") => {
  const shadowColors =
    colorScheme === "dark" ? darkColors.shadow : lightColors.shadow;

  return {
    sm: {
      shadowColor: shadowColors.subtle,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: shadowColors.soft,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: shadowColors.medium,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: shadowColors.strong,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 8,
    },
  };
};

// Legacy shadows export for backward compatibility
export const shadows = createShadows("light");

// Minimal layout system - clean and spacious
export const layout = {
  screenPadding: 20, // Reduced padding for cleaner look
  cardPadding: 16, // More compact cards
  buttonHeight: 44, // Slightly smaller buttons
  inputHeight: 44, // Matching input height
  headerHeight: 56, // Standard header height
  tabHeight: 60, // Tab bar height
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
};
