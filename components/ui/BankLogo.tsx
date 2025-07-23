import React, { useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { spacing, borderRadius } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";
import { BANK_LOGOS } from "../../constants/data";

interface BankLogoProps {
  bankName: string | { name: string; logo?: string };
  logoUrl?: string;
  size?: "small" | "medium" | "large";
  showName?: boolean;
  variant?: "default" | "compact" | "detailed";
}

/**
 * Reusable BankLogo component for consistent bank logo display
 * Now uses actual bank logo images from the internet
 *
 * @param bankName - Name of the bank (must match BANK_LOGOS keys) or object with name and logo
 * @param size - Size variant for the logo
 * @param showName - Whether to show the bank name
 * @param variant - Display variant (default, compact, detailed)
 */
export default function BankLogo({
  bankName,
  logoUrl,
  size = "medium",
  showName = false,
  variant = "default",
}: BankLogoProps) {
  const { colors, shadows } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Extract bank name string from the prop
  const bankNameString =
    typeof bankName === "string" ? bankName : bankName?.name || "Bank";

  // Extract logo URL from the prop if it's an object
  const logoFromProp =
    typeof bankName === "object" ? bankName?.logo : undefined;

  // Get bank info from our data
  const bankInfo = BANK_LOGOS[bankNameString as keyof typeof BANK_LOGOS];

  // Fallback for unknown banks
  const fallbackInfo = {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Bank_logo_placeholder.svg/1200px-Bank_logo_placeholder.svg.png",
    color: colors.primary[500],
    type: "traditional",
    description: "Bank",
  };

  // Use the provided logoUrl prop if available, otherwise fallback to BANK_LOGOS or default
  const logoToUse =
    !imageError && logoUrl
      ? logoUrl
      : !imageError && logoFromProp
        ? logoFromProp
        : !imageError && bankInfo?.logoUrl
          ? bankInfo.logoUrl
          : fallbackInfo.logoUrl;

  const bank = bankInfo || fallbackInfo;

  // Size configurations
  const getSizeConfig = () => {
    switch (size) {
      case "small":
        return {
          containerSize: 32,
          imageSize: 24,
          textSize: 12,
        };
      case "large":
        return {
          containerSize: 64,
          imageSize: 48,
          textSize: 16,
        };
      default:
        return {
          containerSize: 48,
          imageSize: 36,
          textSize: 14,
        };
    }
  };

  const sizeConfig = getSizeConfig();

  // Variant configurations
  const getVariantConfig = () => {
    switch (variant) {
      case "compact":
        return {
          showDescription: false,
          showType: false,
          padding: spacing.xs,
        };
      case "detailed":
        return {
          showDescription: true,
          showType: true,
          padding: spacing.sm,
        };
      default:
        return {
          showDescription: false,
          showType: false,
          padding: spacing.sm,
        };
    }
  };

  const getLogoContainerStyle = () => {
    const variantConfig = getVariantConfig();
    return {
      borderRadius: borderRadius.lg,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      width: sizeConfig.containerSize,
      height: sizeConfig.containerSize,
      backgroundColor: bank.color + "20", // 20% opacity
      padding: variantConfig.padding,
      ...shadows.sm,
    };
  };

  const getBankNameStyle = () => {
    return {
      fontWeight: "600" as const,
      color: colors.text.primary,
      fontSize: sizeConfig.textSize,
    };
  };

  const getBankTypeStyle = () => {
    return {
      fontSize: 10,
      color: colors.text.secondary,
      textTransform: "capitalize" as const,
      marginTop: 2,
    };
  };

  const getBankDescriptionStyle = () => {
    return {
      fontSize: 10,
      color: colors.text.tertiary,
      marginTop: 2,
    };
  };

  const variantConfig = getVariantConfig();

  return (
    <View style={styles.container}>
      {/* Logo Container */}
      <View style={getLogoContainerStyle()}>
        {!imageError ? (
          <Image
            source={{
              uri: logoToUse,
              // Add cache policy to improve loading
              cache: "force-cache",
            }}
            style={[
              styles.logoImage,
              {
                width: sizeConfig.imageSize,
                height: sizeConfig.imageSize,
              },
            ]}
            resizeMode="contain"
            onError={() => {
              console.log(`Failed to load bank logo for: ${bankNameString}`);
              setImageError(true);
            }}
            onLoad={() => {
              console.log(
                `Successfully loaded bank logo for: ${bankNameString}`
              );
            }}
          />
        ) : (
          // Fallback to emoji if image fails to load
          <Text
            style={[
              styles.emoji,
              {
                fontSize: sizeConfig.imageSize * 0.8,
              },
            ]}
          >
            🏦
          </Text>
        )}
      </View>

      {/* Bank Name */}
      {showName && (
        <View style={styles.textContainer}>
          <Text style={getBankNameStyle()} numberOfLines={1}>
            {bankNameString}
          </Text>

          {/* Bank Type (for detailed variant) */}
          {variantConfig.showType && (
            <Text style={getBankTypeStyle()} numberOfLines={1}>
              {bank.type}
            </Text>
          )}

          {/* Bank Description (for detailed variant) */}
          {variantConfig.showDescription && (
            <Text style={getBankDescriptionStyle()} numberOfLines={2}>
              {bank.description}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    borderRadius: borderRadius.sm,
  },
  emoji: {
    textAlign: "center",
  },
  textContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
});
