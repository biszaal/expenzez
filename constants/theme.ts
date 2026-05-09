// Expenzez v1.5 — electric purple + lime, dark/light variants.
// Source: Claude Design handoff (Expenzez Redesign).
export const lightColors = {
  // Primary colors - Electric purple
  primary: {
    50: "#F5EFFD",
    100: "#E8DAFB",
    200: "#D6BBF7",
    300: "#B58BF0",
    400: "#9461E9",
    500: "#7B3FE4", // Main electric purple
    600: "#5B23B8", // Dim variant for gradients
    700: "#481B91",
    800: "#36156D",
    900: "#270F50",
    main: "#7B3FE4",
    glow: "rgba(123,63,228,0.24)", // Soft glow for shadows behind primary CTAs
  },

  // Secondary - lime accent (positive / income / savings)
  secondary: {
    50: "#F1F8E1",
    100: "#E2F1C3",
    200: "#C8E68A",
    300: "#9FCB48",
    400: "#7AA827",
    500: "#5C8519", // Main lime (light mode contrast-safe)
    600: "#496B14",
    700: "#3F5B12",
    800: "#33490E",
    900: "#27370B",
    main: "#5C8519",
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
    50: "#F1F8E1",
    100: "#E2F1C3",
    500: "#5C8519", // Lime as success in light mode
    600: "#496B14",
    700: "#3F5B12",
    main: "#5C8519",
  },

  error: {
    50: "#FBE4EB",
    100: "#F4BCCC",
    500: "#D63A66", // Rose
    600: "#A8294F",
    700: "#7E1F3B",
    main: "#D63A66",
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
    primary: "#FAF8FF", // bg
    secondary: "#F3EFFB", // bgSoft
    tertiary: "#F7F4FE", // cardSoft
    overlay: "rgba(123,63,228,0.08)",
  },

  // Text hierarchy (light)
  text: {
    primary: "#1A1430",
    secondary: "rgba(26,20,48,0.62)",
    tertiary: "rgba(26,20,48,0.42)",
    inverse: "#FFFFFF",
    muted: "rgba(26,20,48,0.30)",
    textSecondary: "rgba(26,20,48,0.62)",
  },

  divider: "rgba(40,20,80,0.05)",

  // Borders (light)
  border: {
    light: "rgba(40,20,80,0.05)",
    medium: "rgba(40,20,80,0.08)",
    dark: "rgba(40,20,80,0.14)",
    focus: "#7B3FE4",
  },

  shadow: {
    subtle: "rgba(40,20,80,0.04)",
    soft: "rgba(40,20,80,0.08)",
    medium: "rgba(40,20,80,0.12)",
    strong: "rgba(40,20,80,0.18)",
  },

  // Cards (light)
  card: {
    background: "#FFFFFF",
    border: "rgba(40,20,80,0.08)",
    shadow: "rgba(40,20,80,0.04)",
  },

  // New v1.5 accent palettes — used directly via colors.lime, colors.rose, etc.
  lime: { 500: "#5C8519", 600: "#496B14", main: "#5C8519" },
  rose: { 500: "#D63A66", 600: "#A8294F", main: "#D63A66" },
  amber: { 500: "#B8761A", 600: "#8C5A14", main: "#B8761A" },
  cyan: { 500: "#2D7DB8", 600: "#256594", main: "#2D7DB8" },

  // Soft positive / negative tints (used for cashflow chips / badges)
  posBg: "rgba(92,133,25,0.14)",
  posFg: "#3F5B12",
  negBg: "rgba(214,58,102,0.10)",
  negFg: "#A8294F",

  // Category color pairs (light)
  category: {
    food: { bg: "rgba(200,90,30,0.10)", fg: "#8C4515" },
    transport: { bg: "rgba(45,125,184,0.10)", fg: "#1F5680" },
    shopping: { bg: "rgba(190,55,90,0.10)", fg: "#8C2A4A" },
    entertainment: { bg: "rgba(92,133,25,0.12)", fg: "#3F5B12" },
    bills: { bg: "rgba(123,63,228,0.10)", fg: "#5B23B8" },
    healthcare: { bg: "rgba(50,130,90,0.10)", fg: "#1F5638" },
    travel: { bg: "rgba(80,90,180,0.10)", fg: "#2F3A8A" },
    groceries: { bg: "rgba(184,118,26,0.12)", fg: "#7A4F12" },
    income: { bg: "rgba(92,133,25,0.14)", fg: "#3F5B12" },
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
  // Primary - electric purple in dark mode
  primary: {
    50: "#1F0F36",
    100: "#311854",
    200: "#492279",
    300: "#5B23B8",
    400: "#7E40D6",
    500: "#9D5BFF", // Main electric purple (dark mode)
    600: "#6B2EB8", // Dim variant for gradients
    700: "#5B23B8",
    800: "#481B91",
    900: "#36156D",
    main: "#9D5BFF",
    glow: "rgba(157,91,255,0.35)",
  },

  // Secondary - lime accent (dark mode)
  secondary: {
    50: "#27370B",
    100: "#33490E",
    200: "#3F5B12",
    300: "#496B14",
    400: "#5C8519",
    500: "#C5F25C", // Lime (dark mode contrast-safe)
    600: "#A8D848",
    700: "#8FB83C",
    800: "#769830",
    900: "#5C7826",
    main: "#C5F25C",
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
    50: "#27370B",
    100: "#33490E",
    500: "#C5F25C", // Lime as success in dark mode
    600: "#A8D848",
    700: "#8FB83C",
    main: "#C5F25C",
  },

  error: {
    50: "#3D0E1B",
    100: "#5E1729",
    500: "#FF6B8A", // Rose
    600: "#E54E72",
    700: "#C0395B",
    main: "#FF6B8A",
  },

  warning: {
    50: "#3B2A0A",
    100: "#5A3F12",
    500: "#F5B342", // Amber
    600: "#D89A2E",
    700: "#B57F22",
    main: "#F5B342",
  },

  // Backgrounds (dark)
  background: {
    primary: "#0A0712", // bg
    secondary: "#100B1B", // bgSoft
    tertiary: "#1B1428", // cardSoft
    overlay: "rgba(157,91,255,0.10)",
  },

  // Text hierarchy (dark)
  text: {
    primary: "#F4F1FA",
    secondary: "rgba(244,241,250,0.62)",
    tertiary: "rgba(244,241,250,0.38)",
    inverse: "#1A1430",
    muted: "rgba(244,241,250,0.30)",
    textSecondary: "rgba(244,241,250,0.62)",
  },

  divider: "rgba(255,255,255,0.04)",

  // Borders (dark)
  border: {
    light: "rgba(255,255,255,0.04)",
    medium: "rgba(255,255,255,0.06)",
    dark: "rgba(255,255,255,0.10)",
    focus: "#9D5BFF",
  },

  shadow: {
    subtle: "rgba(0,0,0,0.40)",
    soft: "rgba(0,0,0,0.55)",
    medium: "rgba(0,0,0,0.70)",
    strong: "rgba(0,0,0,0.85)",
  },

  card: {
    background: "#161122", // card
    border: "rgba(255,255,255,0.06)",
    shadow: "rgba(0,0,0,0.55)",
  },

  // New v1.5 accent palettes
  lime: { 500: "#C5F25C", 600: "#A8D848", main: "#C5F25C" },
  rose: { 500: "#FF6B8A", 600: "#E54E72", main: "#FF6B8A" },
  amber: { 500: "#F5B342", 600: "#D89A2E", main: "#F5B342" },
  cyan: { 500: "#5BC8FF", 600: "#7AD4FF", main: "#5BC8FF" },

  posBg: "rgba(197,242,92,0.16)",
  posFg: "#C5F25C",
  negBg: "rgba(255,107,138,0.14)",
  negFg: "#FF6B8A",

  // Category color pairs (dark)
  category: {
    food: { bg: "rgba(255,143,90,0.16)", fg: "#FFB48A" },
    transport: { bg: "rgba(91,200,255,0.16)", fg: "#7AD4FF" },
    shopping: { bg: "rgba(255,107,138,0.16)", fg: "#FF95B0" },
    entertainment: { bg: "rgba(197,242,92,0.16)", fg: "#C5F25C" },
    bills: { bg: "rgba(157,91,255,0.18)", fg: "#C29CFF" },
    healthcare: { bg: "rgba(112,221,165,0.16)", fg: "#7BE5B0" },
    travel: { bg: "rgba(120,140,255,0.16)", fg: "#9FAFFF" },
    groceries: { bg: "rgba(245,179,66,0.16)", fg: "#F5C77A" },
    income: { bg: "rgba(197,242,92,0.18)", fg: "#C5F25C" },
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
