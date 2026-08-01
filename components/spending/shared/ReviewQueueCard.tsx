import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { fontFamily } from "../../../constants/theme";
import { excludedLabel, exclusionReason } from "../../../utils/spend";

export interface ReviewItem {
  id: string;
  amount: number;
  merchant?: string;
  description?: string;
  date?: string;
  spendType?: string;
  spendTypeSource?: string;
  spendTypeConfidence?: number;
}

interface ReviewQueueCardProps {
  items: ReviewItem[];
  formatAmount: (amount: number, currency?: string) => string;
  currency: string;
  /** Count it as spending after all. */
  onKeep: (item: ReviewItem) => void;
  /** Confirm it isn't spending. */
  onExclude: (item: ReviewItem) => void;
  busyId?: string | null;
}

/**
 * Transactions the classifier excluded from spending but isn't confident about.
 *
 * They are already out of the total — the figure is corrected immediately —
 * and this card asks the user to confirm after the fact. Confirming teaches a
 * rule, so the same merchant is handled automatically next time.
 */
export const ReviewQueueCard: React.FC<ReviewQueueCardProps> = ({
  items,
  formatAmount,
  currency,
  onKeep,
  onExclude,
  busyId,
}) => {
  const { colors } = useTheme();

  if (items.length === 0) return null;

  const total = items.reduce((sum, i) => sum + Math.abs(Number(i.amount) || 0), 0);

  return (
    <View
      style={{
        backgroundColor: colors.card.background,
        borderColor: colors.border.medium,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name="help-circle-outline" size={20} color={colors.amber[500]} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              color: colors.text.primary,
              fontFamily: fontFamily.semibold,
            }}
          >
            {items.length} transaction{items.length === 1 ? "" : "s"} to check
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.text.secondary,
              fontFamily: fontFamily.medium,
              marginTop: 2,
            }}
          >
            {formatAmount(total, currency)} left out of your spending — is that
            right?
          </Text>
        </View>
      </View>

      {items.map((item) => {
        const label = excludedLabel(item as any);
        const busy = busyId === item.id;
        return (
          <View
            key={item.id}
            style={{
              gap: 10,
              borderTopWidth: 1,
              borderTopColor: colors.border.medium,
              paddingTop: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 14,
                    color: colors.text.primary,
                    fontFamily: fontFamily.medium,
                  }}
                >
                  {item.merchant || item.description || "Transaction"}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 12,
                    color: colors.text.tertiary,
                    fontFamily: fontFamily.medium,
                    marginTop: 2,
                  }}
                >
                  {label ? `${label} · ` : ""}
                  {exclusionReason(item as any)}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.text.primary,
                  fontFamily: fontFamily.monoMedium,
                }}
              >
                {formatAmount(Math.abs(Number(item.amount) || 0), currency)}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => onKeep(item)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Count as spending"
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 10,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border.medium,
                  opacity: busy ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.text.primary,
                    fontFamily: fontFamily.semibold,
                  }}
                >
                  Count as spending
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onExclude(item)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Confirm not spending"
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: colors.primary[500],
                  opacity: busy ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: "#FFFFFF",
                    fontFamily: fontFamily.semibold,
                  }}
                >
                  Not spending
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
};
