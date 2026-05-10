import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../contexts/ThemeContext";
import { fontFamily } from "../../../constants/theme";

// v1.5 redesign — Smart suggestion card from screens/budget.jsx.
// Matches design's purple→lime gradient surface with sparkle icon, headline
// proposing a budget move, reasoning underneath, and Apply / Dismiss row.
// The suggestion is computed from category spending vs budget — the card
// hides itself if there is no actionable swap.

interface CategoryData {
  id: string;
  name: string;
  monthlySpent?: number;
  defaultBudget?: number;
}

interface Suggestion {
  fromName: string;
  toName: string;
  amount: number;
  reason: string;
}

interface Props {
  categoryData: CategoryData[];
  formatAmount: (amount: number, currency?: string) => string;
  currency: string;
  onApply?: (suggestion: Suggestion) => void;
}

function computeSuggestion(cats: CategoryData[]): Suggestion | null {
  if (!cats || cats.length < 2) return null;

  const eligible = cats.filter(
    (c) => (c.defaultBudget || 0) > 0 && (c.monthlySpent || 0) > 0
  );
  if (eligible.length < 2) return null;

  // Most-over: highest spent/budget ratio (must be >= 90%).
  const ranked = eligible
    .map((c) => ({
      ...c,
      pct: (c.monthlySpent || 0) / (c.defaultBudget || 1),
      remaining: (c.defaultBudget || 0) - (c.monthlySpent || 0),
    }))
    .sort((a, b) => b.pct - a.pct);

  const over = ranked[0];
  if (!over || over.pct < 0.9) return null;

  // Most-under: lowest pct with at least £20 of headroom.
  const under = ranked
    .filter((c) => c.id !== over.id && c.pct < 0.6 && c.remaining > 20)
    .sort((a, b) => a.pct - b.pct)[0];
  if (!under) return null;

  // Round move to the nearest £10; require at least £10.
  const overShortfall = Math.max(
    (over.monthlySpent || 0) - (over.defaultBudget || 0),
    20
  );
  const move =
    Math.round(Math.min(overShortfall, under.remaining) / 10) * 10;
  if (move < 10) return null;

  const overPct = Math.round((over.pct - 1) * 100);
  const reason =
    overPct > 0
      ? `You're trending ${overPct}% over on ${over.name} but underspending ${under.name}.`
      : `You're approaching the limit on ${over.name} while ${under.name} still has headroom.`;

  return {
    fromName: under.name,
    toName: over.name,
    amount: move,
    reason,
  };
}

export const SmartSuggestionCard: React.FC<Props> = ({
  categoryData,
  formatAmount,
  currency,
  onApply,
}) => {
  const { colors, isDark } = useTheme();
  const [dismissed, setDismissed] = useState(false);

  const suggestion = useMemo(
    () => computeSuggestion(categoryData),
    [categoryData]
  );
  if (!suggestion || dismissed) return null;

  const surface = isDark
    ? (["rgba(157,91,255,0.14)", "rgba(197,242,92,0.08)"] as const)
    : (["rgba(123,63,228,0.10)", "rgba(92,133,25,0.06)"] as const);
  const borderColor = isDark
    ? "rgba(255,255,255,0.10)"
    : "rgba(40,20,80,0.14)";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={surface}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor }]}
      >
        <LinearGradient
          colors={[colors.primary[500], colors.primary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.iconWrap,
            { shadowColor: colors.primary[500] },
          ]}
        >
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
        </LinearGradient>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text.primary,
                fontFamily: fontFamily.semibold,
              },
            ]}
          >
            Move{" "}
            <Text
              style={{
                color: colors.lime[500],
                fontFamily: fontFamily.monoSemibold,
              }}
            >
              {formatAmount(suggestion.amount, currency)}
            </Text>{" "}
            from {suggestion.fromName} to {suggestion.toName}?
          </Text>
          <Text
            style={[
              styles.reason,
              {
                color: colors.text.secondary,
                fontFamily: fontFamily.medium,
              },
            ]}
          >
            {suggestion.reason}
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                onApply?.(suggestion);
                setDismissed(true);
              }}
              hitSlop={6}
              style={({ pressed }) => [
                styles.applyButton,
                {
                  backgroundColor: colors.primary[500],
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.applyText,
                  { fontFamily: fontFamily.semibold },
                ]}
              >
                Apply
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setDismissed(true)}
              hitSlop={6}
              style={({ pressed }) => [
                styles.dismissButton,
                { opacity: pressed ? 0.55 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.dismissText,
                  {
                    color: colors.text.secondary,
                    fontFamily: fontFamily.semibold,
                  },
                ]}
              >
                Dismiss
              </Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
  },
  reason: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 3,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  applyButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  applyText: {
    color: "#FFFFFF",
    fontSize: 11.5,
  },
  dismissButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissText: {
    fontSize: 11.5,
  },
});
