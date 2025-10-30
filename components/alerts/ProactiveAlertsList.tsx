/**
 * ProactiveAlertsList Component - Phase 2B
 *
 * Displays a list of proactive alerts with filtering and loading states
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { alertsAPI, ProactiveAlert } from "../../services/api/alertsAPI";
import { ProactiveAlertCard } from "./ProactiveAlertCard";

interface ProactiveAlertsListProps {
  maxItems?: number; // Limit number of alerts to show (for home screen)
  showHeader?: boolean;
  onViewAll?: () => void;
}

export const ProactiveAlertsList: React.FC<ProactiveAlertsListProps> = ({
  maxItems,
  showHeader = true,
  onViewAll,
}) => {
  const { colors } = useTheme();
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Early return if colors is not available
  if (!colors) {
    return null;
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await alertsAPI.getPendingAlerts();
      setAlerts(response.alerts);
      setUnacknowledgedCount(response.unacknowledgedCount);
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const handleDismiss = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.alertId !== alertId));
    if (alerts.find((a) => a.alertId === alertId)?.status === "PENDING") {
      setUnacknowledgedCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleAcknowledge = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.alertId === alertId
          ? { ...alert, status: "ACKNOWLEDGED" as const }
          : alert
      )
    );
    setUnacknowledgedCount((prev) => Math.max(0, prev - 1));
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {showHeader && (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                📢 Proactive Alerts
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.secondary.main }]}>
                Stay informed of important updates
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsMinimized(!isMinimized)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMinimized ? "chevron-down" : "chevron-up"}
                size={20}
                color={colors.primary.main}
              />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </View>
    );
  }

  const displayAlerts = maxItems ? alerts.slice(0, maxItems) : alerts;
  const hasMore = maxItems && alerts.length > maxItems;

  if (alerts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {showHeader && (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                📢 Proactive Alerts
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.secondary.main }]}>
                Stay informed of important updates
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsMinimized(!isMinimized)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMinimized ? "chevron-down" : "chevron-up"}
                size={20}
                color={colors.primary.main}
              />
            </TouchableOpacity>
          </View>
        )}
        {!isMinimized && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              All Caught Up!
            </Text>
            <Text style={[styles.emptyText, { color: colors.secondary.main }]}>
              No pending alerts. We'll notify you of important financial events.
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                📢 Proactive Alerts
              </Text>
              {unacknowledgedCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary.main }]}>
                  <Text style={styles.badgeText}>{unacknowledgedCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.secondary.main }]}>
              {alerts.length} alert{alerts.length !== 1 ? "s" : ""} • Stay informed
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsMinimized(!isMinimized)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isMinimized ? "chevron-down" : "chevron-up"}
              size={20}
              color={colors.primary.main}
            />
          </TouchableOpacity>
        </View>
      )}

      {!isMinimized && (
        <FlatList
          data={displayAlerts}
          keyExtractor={(item) => item.alertId}
          renderItem={({ item }) => (
            <ProactiveAlertCard
              alert={item}
              onDismiss={handleDismiss}
              onAcknowledge={handleAcknowledge}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary.main}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity
                style={[styles.viewMoreButton, { backgroundColor: colors.card.background }]}
                onPress={onViewAll}
              >
                <Text style={[styles.viewMoreText, { color: colors.primary.main }]}>
                  View {alerts.length - maxItems!} More Alert
                  {alerts.length - maxItems! !== 1 ? "s" : ""}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.primary.main}
                />
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "400",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  listContent: {
    paddingVertical: 8,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  viewMoreText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
