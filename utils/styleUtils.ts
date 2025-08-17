import { TextStyle, ViewStyle } from 'react-native';

// Utility function to properly type style arrays for React Native
export function combineStyles<T extends TextStyle | ViewStyle>(...styles: (T | any)[]): T {
  return styles as any;
}

// Specific utilities for common style types
export function combineTextStyles(...styles: (TextStyle | any)[]): TextStyle {
  return styles as any;
}

export function combineViewStyles(...styles: (ViewStyle | any)[]): ViewStyle {
  return styles as any;
}