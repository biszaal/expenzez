# Dark Mode Implementation Guide

## Overview

The Expenzez app now supports a comprehensive dark mode system with three theme options:

- **Light Mode**: Traditional light theme
- **Dark Mode**: Dark theme for low-light environments
- **System Mode**: Automatically follows the device's system preference

## Architecture

### Theme Context (`contexts/ThemeContext.tsx`)

The theme system is built around a React Context that provides:

```typescript
interface ThemeContextType {
  colorScheme: ColorScheme; // 'light' | 'dark' | 'system'
  isDark: boolean; // Current dark mode state
  colors: typeof lightColors; // Current theme colors
  shadows: ReturnType<typeof createShadows>; // Theme-aware shadows
  setColorScheme: (scheme: ColorScheme) => void;
  toggleTheme: () => void;
}
```

### Color Schemes

#### Light Colors (`constants/theme.ts`)

- Primary colors: Blue gradient (#3B82F6 to #1E3A8A)
- Background: White (#FFFFFF), Light Gray (#F8FAFC)
- Text: Dark Gray (#1F2937), Medium Gray (#6B7280)
- Borders: Light Gray (#E5E7EB)

#### Dark Colors (`constants/theme.ts`)

- Primary colors: Inverted blue gradient
- Background: Dark Gray (#111827), Medium Dark (#1F2937)
- Text: Light Gray (#F9FAFB), Medium Light (#D1D5DB)
- Borders: Dark Gray (#374151)

## Usage

### 1. Using the Theme Hook

```typescript
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background.primary }}>
      <Text style={{ color: colors.text.primary }}>
        Hello World
      </Text>
    </View>
  );
}
```

### 2. Theme Toggle Component

Three variants available:

```typescript
// Simple icon toggle
<ThemeToggle variant="icon" size="medium" />

// Button with text
<ThemeToggle variant="button" size="small" />

// Full selector (Light/Dark/Auto)
<ThemeToggle variant="full" />
```

### 3. Dynamic Styling

Instead of static styles, use dynamic functions:

```typescript
// ❌ Static (won't adapt to theme)
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF", // Hardcoded
  },
});

// ✅ Dynamic (theme-aware)
const { colors } = useTheme();
const getContainerStyle = () => ({
  backgroundColor: colors.background.primary,
});
```

## Updated Components

### Core UI Components

All UI components have been updated to support dark mode:

- **Typography**: Dynamic text colors
- **Button**: Theme-aware backgrounds and borders
- **Card**: Dynamic backgrounds and shadows
- **TextField**: Adaptive input styling
- **Header**: Dynamic header styling
- **Section**: Theme-aware titles
- **ListItem**: Adaptive list items
- **Badge**: Dynamic status colors
- **EmptyState**: Theme-aware empty states
- **BankLogo**: Adaptive bank logo display

### Screen Updates

Key screens updated for dark mode:

- **Login/Register**: Adaptive form styling
- **Profile**: Theme-aware profile management
- **Banks**: Dynamic bank account display
- **All Tab Screens**: Consistent dark mode support

## Theme Persistence

The theme preference is automatically saved to AsyncStorage and restored on app launch:

```typescript
const THEME_STORAGE_KEY = "@expenzez_theme";
```

## System Integration

The app respects the device's system theme setting when in "System" mode:

```typescript
const isDark =
  colorScheme === "system"
    ? systemColorScheme === "dark"
    : colorScheme === "dark";
```

## Shadow System

Shadows are dynamically generated based on the current theme:

```typescript
export const createShadows = (colorScheme: 'light' | 'dark') => {
  const shadowColors = colorScheme === 'dark'
    ? darkColors.shadow
    : lightColors.shadow;

  return {
    sm: { shadowColor: shadowColors.light, ... },
    md: { shadowColor: shadowColors.medium, ... },
    lg: { shadowColor: shadowColors.dark, ... },
  };
};
```

## Best Practices

### 1. Use Theme Hook

Always use `useTheme()` instead of importing static colors:

```typescript
// ✅ Good
const { colors } = useTheme();
const style = { color: colors.text.primary };

// ❌ Bad
import { colors } from "../constants/theme";
const style = { color: colors.text.primary };
```

### 2. Dynamic Styling Functions

Create functions for dynamic styles:

```typescript
const getButtonStyle = () => ({
  backgroundColor: colors.primary[500],
  borderColor: colors.border.light,
});
```

### 3. Conditional Rendering

Use `isDark` for conditional logic:

```typescript
const { isDark } = useTheme();
const iconName = isDark ? "moon" : "sun";
```

### 4. Test Both Themes

Always test your components in both light and dark modes to ensure proper contrast and readability.

## Accessibility

The dark mode implementation includes:

- **High Contrast**: Proper contrast ratios for text readability
- **Color Blindness Support**: Not relying solely on color for information
- **System Integration**: Respects user's system preferences
- **Persistent Settings**: Remembers user's theme choice

## Performance

- **Efficient Updates**: Only re-renders when theme actually changes
- **Memoized Styles**: Dynamic styles are computed efficiently
- **Minimal Bundle Size**: Theme system adds minimal overhead

## Future Enhancements

Potential improvements:

1. **Custom Themes**: Allow users to create custom color schemes
2. **Scheduled Themes**: Automatically switch themes based on time
3. **Per-Screen Themes**: Different themes for different screens
4. **Animation Support**: Smooth transitions between themes
5. **Brand Themes**: Special themes for different brands/partners

## Troubleshooting

### Common Issues

1. **Component Not Updating**: Ensure you're using `useTheme()` hook
2. **Colors Not Changing**: Check if component is wrapped in `ThemeProvider`
3. **Flash on Load**: Theme loads asynchronously to prevent flash
4. **Inconsistent Colors**: Use theme colors instead of hardcoded values

### Debug Mode

Enable theme debugging:

```typescript
const { colors, isDark, colorScheme } = useTheme();
console.log("Current theme:", { isDark, colorScheme, colors });
```

## Migration Guide

To update existing components:

1. Import `useTheme` hook
2. Replace static color imports with dynamic theme colors
3. Convert static styles to dynamic functions
4. Test in both light and dark modes
5. Update any hardcoded colors to use theme colors

Example migration:

```typescript
// Before
import { colors } from "../constants/theme";
const styles = StyleSheet.create({
  container: { backgroundColor: colors.background.primary },
});

// After
import { useTheme } from "../contexts/ThemeContext";
const { colors } = useTheme();
const getContainerStyle = () => ({
  backgroundColor: colors.background.primary,
});
```

This comprehensive dark mode system provides a modern, accessible, and user-friendly experience that adapts to user preferences and system settings.
