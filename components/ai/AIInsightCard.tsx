import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from "../../contexts/ThemeContext";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get('window');

// Responsive sizing based on screen dimensions
const getResponsiveSizes = () => {
  const isSmallDevice = width < 375 || height < 667;
  const isMediumDevice = width >= 375 && width < 414;
  const isLargeDevice = width >= 414;

  return {
    titleFontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16,
    bodyFontSize: isSmallDevice ? 13 : isMediumDevice ? 14 : 15,
    lineHeight: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    expandedLineHeight: isSmallDevice ? 22 : isMediumDevice ? 24 : 26,
    paddingH: isSmallDevice ? 16 : isMediumDevice ? 20 : 24,
    paddingV: isSmallDevice ? 14 : isMediumDevice ? 16 : 20,
    iconSize: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    badgeSize: isSmallDevice ? 28 : isMediumDevice ? 32 : 36,
    borderRadius: isSmallDevice ? 14 : isMediumDevice ? 16 : 18,
    gap: isSmallDevice ? 10 : isMediumDevice ? 12 : 14,
  };
};

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type InsightPriority = "high" | "medium" | "low";

interface AIInsightCardProps {
  insight: string;
  expandedInsight?: string;
  priority?: InsightPriority;
  loading?: boolean;
  actionable?: string;
  onDeepDive?: () => void;
  collapsedByDefault?: boolean;
  showDeepDiveButton?: boolean;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  insight,
  expandedInsight,
  priority = "medium",
  loading = false,
  actionable,
  onDeepDive,
  collapsedByDefault = true,
  showDeepDiveButton = true,
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const sizes = getResponsiveSizes();
  const [isExpanded, setIsExpanded] = useState(!collapsedByDefault);
  const fadeAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Detect if this is a rate limit message
  const isRateLimited = insight?.toLowerCase().includes('rate limit') ||
                        insight?.toLowerCase().includes('temporarily unavailable');

  // Handle expand/collapse with animation
  const toggleExpand = () => {
    // Configure layout animation for smooth transition
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    // Animate fade in/out of expanded content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: newExpandedState ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: newExpandedState ? 1 : 0.98,
        useNativeDriver: true,
        friction: 8,
      }),
    ]).start();
  };

  const handleDeepDive = () => {
    if (onDeepDive) {
      onDeepDive();
    } else {
      // Default: Navigate to AI assistant with context
      router.push("/ai-assistant");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary, borderRadius: sizes.borderRadius }]}>
        <LinearGradient
          colors={[`${colors.primary.main}08`, `${colors.primary.main}03`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.loadingContainer, { paddingHorizontal: sizes.paddingH, paddingVertical: sizes.paddingV }]}
        >
          <ActivityIndicator size="small" color={colors.primary.main} />
          <Text style={[styles.loadingText, { color: colors.text.secondary, fontSize: sizes.bodyFontSize }]}>
            Analyzing your data...
          </Text>
        </LinearGradient>
      </View>
    );
  }

  if (!insight) {
    return null;
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: colors.background.primary,
            borderRadius: sizes.borderRadius,
          },
        ]}
        onPress={toggleExpand}
        activeOpacity={0.95}
      >
        {/* Collapsed State: Minimal chip/badge */}
        {!isExpanded && (
          <View
            style={[
              styles.collapsedContainer,
              {
                paddingVertical: sizes.paddingV,
                paddingHorizontal: sizes.paddingH,
              },
            ]}
          >
            <View style={[styles.collapsedLeft, { gap: sizes.gap }]}>
              <LinearGradient
                colors={
                  isRateLimited
                    ? ['#F59E0B20', '#F59E0B10']
                    : [`${colors.primary.main}20`, `${colors.primary.main}10`]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.iconBadge,
                  {
                    width: sizes.badgeSize,
                    height: sizes.badgeSize,
                    borderRadius: sizes.badgeSize / 2,
                  },
                ]}
              >
                <Ionicons
                  name={isRateLimited ? "time-outline" : "sparkles"}
                  size={sizes.iconSize}
                  color={isRateLimited ? "#F59E0B" : colors.primary.main}
                />
              </LinearGradient>
              <Text
                style={[
                  styles.collapsedText,
                  {
                    color: colors.text.primary,
                    fontSize: sizes.bodyFontSize,
                  },
                ]}
                numberOfLines={1}
              >
                {isRateLimited ? "Rate limit notice" : "AI Insight available"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={sizes.iconSize} color={colors.text.tertiary} />
          </View>
        )}

        {/* Expanded State: Full insight card */}
        {isExpanded && (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Header */}
            <View
              style={[
                styles.expandedHeader,
                {
                  paddingTop: sizes.paddingV,
                  paddingHorizontal: sizes.paddingH,
                  paddingBottom: sizes.paddingV * 0.7,
                },
              ]}
            >
              <View style={[styles.expandedHeaderLeft, { gap: sizes.gap }]}>
                <LinearGradient
                  colors={
                    isRateLimited
                      ? ['#F59E0B20', '#F59E0B10']
                      : [`${colors.primary.main}20`, `${colors.primary.main}10`]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.iconBadge,
                    {
                      width: sizes.badgeSize,
                      height: sizes.badgeSize,
                      borderRadius: sizes.badgeSize / 2,
                    },
                  ]}
                >
                  <Ionicons
                    name={isRateLimited ? "time-outline" : "sparkles"}
                    size={sizes.iconSize}
                    color={isRateLimited ? "#F59E0B" : colors.primary.main}
                  />
                </LinearGradient>
                <Text
                  style={[
                    styles.expandedHeaderTitle,
                    {
                      color: colors.text.primary,
                      fontSize: sizes.titleFontSize,
                    },
                  ]}
                >
                  AI Insight
                </Text>
              </View>
              <Ionicons name="chevron-up" size={sizes.iconSize + 2} color={colors.text.tertiary} />
            </View>

            {/* Main insight text */}
            <Text
              style={[
                styles.insightText,
                {
                  color: colors.text.secondary,
                  fontSize: sizes.bodyFontSize,
                  lineHeight: sizes.lineHeight,
                  paddingHorizontal: sizes.paddingH,
                },
              ]}
            >
              {insight}
            </Text>

            {/* Expanded insight */}
            {expandedInsight && (
              <Text
                style={[
                  styles.expandedText,
                  {
                    color: colors.text.secondary,
                    fontSize: sizes.bodyFontSize,
                    lineHeight: sizes.expandedLineHeight,
                    paddingHorizontal: sizes.paddingH,
                  },
                ]}
              >
                {expandedInsight}
              </Text>
            )}

            {/* Actionable recommendation */}
            {actionable && (
              <LinearGradient
                colors={[`${colors.primary.main}10`, `${colors.primary.main}05`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.actionableContainer,
                  {
                    marginHorizontal: sizes.paddingH,
                    gap: sizes.gap,
                    borderRadius: sizes.borderRadius - 4,
                  },
                ]}
              >
                <Ionicons
                  name="bulb"
                  size={sizes.iconSize - 2}
                  color={colors.primary.main}
                  style={styles.actionableIcon}
                />
                <Text
                  style={[
                    styles.actionableText,
                    {
                      color: colors.primary.main,
                      fontSize: sizes.bodyFontSize - 1,
                      lineHeight: sizes.lineHeight,
                    },
                  ]}
                >
                  {actionable}
                </Text>
              </LinearGradient>
            )}

            {/* Deep dive button */}
            {showDeepDiveButton && (
              <TouchableOpacity
                style={[
                  styles.deepDiveButton,
                  {
                    borderTopColor: `${colors.border.light}80`,
                    paddingVertical: sizes.paddingV,
                  },
                ]}
                onPress={handleDeepDive}
                activeOpacity={0.7}
              >
                <Ionicons name="analytics" size={sizes.iconSize - 2} color={colors.primary.main} />
                <Text
                  style={[
                    styles.deepDiveText,
                    {
                      color: colors.primary.main,
                      fontSize: sizes.bodyFontSize - 1,
                    },
                  ]}
                >
                  Analyze with AI
                </Text>
                <Ionicons name="arrow-forward" size={sizes.iconSize - 2} color={colors.primary.main} />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Clean container with enhanced shadow
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },

  // Loading state
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
  },
  loadingText: {
    fontWeight: "500",
  },

  // Collapsed state: minimal chip
  collapsedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collapsedLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBadge: {
    justifyContent: "center",
    alignItems: "center",
  },
  collapsedText: {
    fontWeight: "600",
    flex: 1,
  },

  // Expanded state header
  expandedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expandedHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandedHeaderTitle: {
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  // Insight text
  insightText: {
    paddingTop: 8,
    paddingBottom: 6,
    fontWeight: "400",
  },

  // Expanded insight text
  expandedText: {
    paddingTop: 14,
    paddingBottom: 10,
    fontWeight: "400",
  },

  // Actionable recommendation
  actionableContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 18,
    marginBottom: 6,
    padding: 16,
  },
  actionableIcon: {
    marginTop: 2,
  },
  actionableText: {
    flex: 1,
    fontWeight: "600",
  },

  // Deep dive button
  deepDiveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingTop: 18,
    marginTop: 14,
    borderTopWidth: 1,
  },
  deepDiveText: {
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
