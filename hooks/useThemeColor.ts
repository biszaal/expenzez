/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { lightColors, darkColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof lightColors & keyof typeof darkColors
) {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];
  const Colors = theme === "light" ? lightColors : darkColors;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[colorName];
  }
}
