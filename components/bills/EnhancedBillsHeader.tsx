import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../app/auth/AuthContext";

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
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Simple Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Bills
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {totalBills} recurring bills • £{Math.abs(monthlyTotal).toFixed(0)}/month
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.background.secondary }]}
          onPress={onRefresh}
          disabled={isRefreshing}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isRefreshing ? "refresh" : "refresh-outline"}
            size={20}
            color={colors.primary[500]}
          />
        </TouchableOpacity>
      </View>

      {/* Quick Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statItem, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {totalBills}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Total Bills
          </Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            £{Math.abs(monthlyTotal).toFixed(0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Monthly Total
          </Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.statValue, { color: colors.error[500] }]}>
            {upcomingCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Due Soon
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = {
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  statsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    gap: 12,
  },
  statItem: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center" as const,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
};