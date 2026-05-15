import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import type { ImportUsageResponse } from "../../services/api/transactionAPI";

type Props = {
  usage: ImportUsageResponse | null;
  loading?: boolean;
};

// Shared header card shown on the CSV import + PDF import screens.
// Displays this month's usage and, when the user has run out, surfaces
// the appropriate next step (upgrade for free users, "resets on the 1st"
// for premium users who hit 15/month).
export const ImportQuotaCard: React.FC<Props> = ({ usage, loading }) => {
  const { colors } = useTheme();

  if (loading || !usage) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <ActivityIndicator size="small" color={colors.primary.main} />
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Loading import quota…
        </Text>
      </View>
    );
  }

  const isFree = usage.tier === "FREE";
  const exhausted = usage.remaining === 0;
  const lowWarning = !exhausted && usage.remaining <= 1;

  const accentColor = exhausted
    ? colors.error.main
    : lowWarning
      ? colors.warning?.main || colors.primary.main
      : colors.primary.main;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.background.secondary }]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconBubble,
            { backgroundColor: `${accentColor}22` },
          ]}
        >
          <Ionicons
            name={exhausted ? "alert-circle" : "cloud-upload-outline"}
            size={22}
            color={accentColor}
          />
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {usage.used} / {usage.limit} imports used this month
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {exhausted
              ? isFree
                ? `You've used all ${usage.limit} free imports. Upgrade to Premium for ${usage.premiumLimit}/month.`
                : `You've reached your monthly limit. Quota resets on the 1st.`
              : isFree
                ? `${usage.remaining} left this month on the free plan. Upgrade for ${usage.premiumLimit}/month.`
                : `${usage.remaining} left this month.`}
          </Text>
        </View>
      </View>

      {/* progress bar */}
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: accentColor,
              width: `${Math.min(100, (usage.used / usage.limit) * 100)}%`,
            },
          ]}
        />
      </View>

      {/* upgrade CTA for free users — always offered, more prominent when low/exhausted */}
      {isFree && (
        <TouchableOpacity
          onPress={() => router.push("/subscription/plans")}
          style={[
            styles.cta,
            {
              backgroundColor: exhausted
                ? colors.primary.main
                : `${colors.primary.main}11`,
            },
          ]}
        >
          <Ionicons
            name="sparkles"
            size={16}
            color={exhausted ? "#fff" : colors.primary.main}
          />
          <Text
            style={[
              styles.ctaText,
              { color: exhausted ? "#fff" : colors.primary.main },
            ]}
          >
            Upgrade to Premium
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
