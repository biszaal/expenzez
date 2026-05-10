import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useTheme } from "../../../contexts/ThemeContext";
import { fontFamily } from "../../../constants/theme";

// v1.5 redesign — Recent transactions list at the bottom of the Spending
// tab. Mirrors the design's grouped card with hairline dividers; the right
// column shows the signed amount in mono with credit values in lime.
type CategoryKey =
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "bills"
  | "healthcare"
  | "travel"
  | "groceries"
  | "income";

const CATEGORY_ICON: Record<CategoryKey, keyof typeof Ionicons.glyphMap> = {
  food: "restaurant",
  transport: "car",
  shopping: "bag-handle",
  entertainment: "game-controller",
  bills: "receipt",
  healthcare: "medkit",
  travel: "airplane",
  groceries: "cart",
  income: "trending-up",
};

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  food: "Food",
  transport: "Transport",
  shopping: "Shopping",
  entertainment: "Entertainment",
  bills: "Bills",
  healthcare: "Healthcare",
  travel: "Travel",
  groceries: "Groceries",
  income: "Income",
};

function normalizeCategory(raw?: string): CategoryKey {
  const s = (raw || "").toLowerCase().trim();
  if (s.includes("grocer") || s.includes("supermarket")) return "groceries";
  if (s.includes("food") || s.includes("dining") || s.includes("restaurant"))
    return "food";
  if (
    s.includes("transport") ||
    s.includes("uber") ||
    s.includes("taxi") ||
    s.includes("rail")
  )
    return "transport";
  if (s.includes("shop") || s.includes("amazon") || s.includes("retail"))
    return "shopping";
  if (s.includes("bill") || s.includes("utility") || s.includes("rent"))
    return "bills";
  if (s.includes("travel") || s.includes("hotel") || s.includes("flight"))
    return "travel";
  if (s.includes("health") || s.includes("pharma") || s.includes("medic"))
    return "healthcare";
  if (
    s.includes("game") ||
    s.includes("netflix") ||
    s.includes("spotify") ||
    s.includes("entertainment")
  )
    return "entertainment";
  if (s.includes("salary") || s.includes("income") || s.includes("refund"))
    return "income";
  return "shopping";
}

function formatGBP(amount: number): { whole: string; decimals: string } {
  const absolute = Math.abs(amount);
  const [whole, dec] = absolute.toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return { whole: grouped, decimals: `.${dec}` };
}

interface Transaction {
  id?: string;
  date?: string;
  amount: number;
  category?: string;
  description?: string;
  merchant?: string;
  type?: string;
}

interface Props {
  transactions: Transaction[];
  onSeeAllPress?: () => void;
  limit?: number;
}

export const SpendingRecentTransactions: React.FC<Props> = ({
  transactions,
  onSeeAllPress,
  limit = 6,
}) => {
  const { colors } = useTheme();

  const recent = React.useMemo(() => {
    return [...transactions]
      .sort(
        (a, b) =>
          dayjs(b.date || 0).valueOf() - dayjs(a.date || 0).valueOf()
      )
      .slice(0, limit);
  }, [transactions, limit]);

  if (recent.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Recent
        </Text>
        {onSeeAllPress && (
          <Pressable onPress={onSeeAllPress} hitSlop={6}>
            <Text style={[styles.sectionLink, { color: colors.primary[500] }]}>
              View all
            </Text>
          </Pressable>
        )}
      </View>
      <View
        style={[
          styles.list,
          {
            backgroundColor: colors.card.background,
            borderColor: colors.border.medium,
          },
        ]}
      >
        {recent.map((tx, idx) => {
          const amt = Number(tx.amount) || 0;
          const isCredit = tx.type === "credit" || amt > 0;
          const cat = normalizeCategory(tx.category);
          const pal = colors.category[cat];
          const formatted = formatGBP(amt);
          const desc =
            (tx as any).merchant ||
            tx.description ||
            CATEGORY_LABEL[cat];
          const dateLabel = tx.date
            ? (() => {
                const d = dayjs(tx.date);
                const today = dayjs().startOf("day");
                if (d.isSame(today, "day")) return "Today";
                if (d.isSame(today.subtract(1, "day"), "day"))
                  return "Yesterday";
                return d.format("D MMM");
              })()
            : "";

          return (
            <View
              key={`${tx.id || idx}-${idx}`}
              style={[
                styles.row,
                {
                  borderBottomColor: idx === recent.length - 1
                    ? "transparent"
                    : colors.border.light,
                },
              ]}
            >
              <View style={[styles.rowIcon, { backgroundColor: pal.bg }]}>
                <Ionicons
                  name={CATEGORY_ICON[cat]}
                  size={17}
                  color={pal.fg}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={[styles.rowName, { color: colors.text.primary }]}
                >
                  {desc}
                </Text>
                <Text
                  style={[styles.rowSub, { color: colors.text.secondary }]}
                >
                  {CATEGORY_LABEL[cat]} · {dateLabel}
                </Text>
              </View>
              <Text
                style={[
                  styles.rowAmount,
                  {
                    color: isCredit ? colors.lime[500] : colors.text.primary,
                  },
                ]}
              >
                {isCredit ? "+" : "−"}£{formatted.whole}
                <Text style={{ color: colors.text.tertiary }}>
                  {formatted.decimals}
                </Text>
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
  },
  sectionLink: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
  },
  list: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    letterSpacing: -0.1,
  },
  rowSub: {
    fontSize: 11.5,
    fontFamily: fontFamily.medium,
    marginTop: 2,
  },
  rowAmount: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 14,
    letterSpacing: -0.4,
  },
});
