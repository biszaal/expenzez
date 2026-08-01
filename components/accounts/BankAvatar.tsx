import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { fontFamily } from "../../constants/theme";
import { getBankVisual } from "../../constants/banks";

interface BankAvatarProps {
  bankId?: string;
  bankName: string;
  /** Overrides the brand colour (e.g. a colour the user picked). */
  colorHex?: string;
  size?: number;
}

/**
 * An account's mark, in order of preference: the bank's real logo, an icon for
 * the synthetic accounts ("Other bank", "Manual Entry"), or initials on the
 * brand colour.
 *
 * Logos come from a third-party favicon service, so a failure has to look
 * deliberate rather than leaving a hole — hence the initials fallback on the
 * same brand colour.
 */
export const BankAvatar: React.FC<BankAvatarProps> = ({
  bankId,
  bankName,
  colorHex,
  size = 40,
}) => {
  const [logoFailed, setLogoFailed] = useState(false);

  const visual = getBankVisual(bankId, bankName);
  // A caller-supplied colour wins, but only when it isn't the old generic grey
  // the API sends for derived accounts — that would flatten every brand.
  const tint =
    colorHex && colorHex.toLowerCase() !== "#7c8698" ? colorHex : visual.colorHex;

  const radius = size / 3.2;

  if (visual.kind === "logo" && visual.logoUrl && !logoFailed) {
    return (
      <View
        style={[
          styles.logoTile,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: "#FFFFFF",
            borderColor: `${tint}33`,
          },
        ]}
      >
        <Image
          source={{ uri: visual.logoUrl }}
          style={{ width: size * 0.62, height: size * 0.62 }}
          onError={() => setLogoFailed(true)}
          contentFit="contain"
          cachePolicy="memory-disk"
          accessibilityLabel={`${bankName} logo`}
        />
      </View>
    );
  }

  if (visual.kind === "icon" && visual.iconName) {
    return (
      <View
        style={[
          styles.center,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: `${tint}1A`,
            borderWidth: 1,
            borderColor: `${tint}33`,
          },
        ]}
      >
        <Ionicons name={visual.iconName} size={size * 0.5} color={tint} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.center,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: tint,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          { fontSize: size * 0.36, fontFamily: fontFamily.semibold },
        ]}
      >
        {visual.initials || "?"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  logoTile: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  initials: { color: "#FFFFFF", letterSpacing: 0.3 },
});
