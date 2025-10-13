import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../app/auth/AuthContext";

// Number formatting utility
const formatAmount = (amount: number): string => {
  const absAmount = Math.abs(amount);

  if (absAmount >= 100000) {
    // For amounts >= 1,00,000 (Indian numbering system)
    return absAmount.toLocaleString("en-IN");
  } else if (absAmount >= 10000) {
    // For amounts >= 10,000, use comma separation
    return absAmount.toLocaleString("en-US");
  } else {
    // For smaller amounts, show as is
    return absAmount.toFixed(2);
  }
};

interface EnhancedBillsHeaderProps {
  totalBills: number;
  monthlyTotal: number;
  upcomingCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const EnhancedBillsHeader: React.FC<EnhancedBillsHeaderProps> = ({
  totalBills,
  monthlyTotal,
  upcomingCount,
  onRefresh,
  isRefreshing,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      {/* Clean Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Bills
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>
            {totalBills} bills • £{formatAmount(monthlyTotal)}/month
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={isRefreshing}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isRefreshing ? "refresh" : "refresh-outline"}
            size={16}
            color={colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = {
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "600" as const,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400" as const,
    opacity: 0.7,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  statsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center" as const,
    paddingVertical: 12,
    minWidth: 0,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 4,
    letterSpacing: -0.3,
    flexWrap: "nowrap" as const,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
    textAlign: "center" as const,
    opacity: 0.7,
  },
};
