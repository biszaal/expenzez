/**
 * ProactiveAlertCard Component - Phase 2B
 *
 * Displays individual proactive alerts with dismiss/acknowledge actions
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { alertsAPI, ProactiveAlert } from "../../services/api/alertsAPI";
import { useRouter } from "expo-router";

interface ProactiveAlertCardProps {
  alert: ProactiveAlert;
  onDismiss?: (alertId: string) => void;
  onAcknowledge?: (alertId: string) => void;
}

export const ProactiveAlertCard: React.FC<ProactiveAlertCardProps> = ({
  alert,
  onDismiss,
  onAcknowledge,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [dismissing, setDismissing] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Early return if theme is not available
  if (!theme || !theme.colors) {
    return null;
  }

  const handleDismiss = async () => {
    try {
      setDismissing(true);

      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      await alertsAPI.dismissAlert(alert.alertId);

      setTimeout(() => {
        setDismissed(true);
        onDismiss?.(alert.alertId);
      }, 300);
    } catch (error) {
      console.error("Error dismissing alert:", error);
      setDismissing(false);

      // Reset fade animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleAcknowledge = async () => {
    try {
      setAcknowledging(true);
      await alertsAPI.acknowledgeAlert(alert.alertId);
      onAcknowledge?.(alert.alertId);
    } catch (error) {
      console.error("Error acknowledging alert:", error);
    } finally {
      setAcknowledging(false);
    }
  };

  const handleAction = () => {
    if (alert.actionRoute) {
      router.push(alert.actionRoute as any);
    }
  };

  if (dismissed) {
    return null;
  }

  const alertIcon = alertsAPI.getAlertIcon(alert.type);
  const alertColor = alertsAPI.getAlertColor(alert.priority);
  const priorityLabel = alertsAPI.getAlertPriorityLabel(alert.priority);
  const isUnacknowledged = alert.status === "PENDING";

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          opacity: fadeAnim,
          borderLeftColor: alertColor,
        },
      ]}
    >
      {/* Priority Badge */}
      {alert.priority === "URGENT" && (
        <View style={[styles.urgentBadge, { backgroundColor: alertColor }]}>
          <Text style={styles.urgentText}>URGENT</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.alertIcon}>{alertIcon}</Text>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {alert.title}
            </Text>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: `${alertColor}20` },
                ]}
              >
                <Text style={[styles.priorityText, { color: alertColor }]}>
                  {priorityLabel}
                </Text>
              </View>
              {isUnacknowledged && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleDismiss}
          disabled={dismissing}
          style={styles.closeButton}
        >
          {dismissing ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.textSecondary}
            />
          ) : (
            <Ionicons
              name="close"
              size={20}
              color={theme.colors.textSecondary}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Message */}
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        {alert.message}
      </Text>

      {/* Metadata */}
      {alert.metadata && (
        <View style={styles.metadata}>
          {alert.metadata.percentage !== undefined && (
            <View style={styles.metadataItem}>
              <Text
                style={[
                  styles.metadataLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Usage:
              </Text>
              <Text
                style={[styles.metadataValue, { color: theme.colors.text }]}
              >
                {alert.metadata.percentage}%
              </Text>
            </View>
          )}
          {alert.metadata.remaining !== undefined && (
            <View style={styles.metadataItem}>
              <Text
                style={[
                  styles.metadataLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Remaining:
              </Text>
              <Text
                style={[styles.metadataValue, { color: theme.colors.text }]}
              >
                £{alert.metadata.remaining.toFixed(2)}
              </Text>
            </View>
          )}
          {alert.metadata.amount !== undefined && (
            <View style={styles.metadataItem}>
              <Text
                style={[
                  styles.metadataLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Amount:
              </Text>
              <Text
                style={[styles.metadataValue, { color: theme.colors.text }]}
              >
                £{alert.metadata.amount.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {alert.actionable && alert.actionText && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: alertColor }]}
            onPress={handleAction}
          >
            <Text style={styles.actionButtonText}>{alert.actionText}</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        {isUnacknowledged && (
          <TouchableOpacity
            style={[
              styles.acknowledgeButton,
              { borderColor: theme.colors.border },
            ]}
            onPress={handleAcknowledge}
            disabled={acknowledging}
          >
            {acknowledging ? (
              <ActivityIndicator size="small" color={theme.colors.text} />
            ) : (
              <>
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={theme.colors.text}
                />
                <Text
                  style={[
                    styles.acknowledgeButtonText,
                    { color: theme.colors.text },
                  ]}
                >
                  Got it
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Timestamp */}
      <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
        {getRelativeTime(alert.createdAt)}
      </Text>
    </Animated.View>
  );
};

// Helper function to format relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
  },
  urgentBadge: {
    position: "absolute",
    top: -4,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  urgentText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: 12,
  },
  alertIcon: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
  },
  newBadge: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metadataLabel: {
    fontSize: 12,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  acknowledgeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  acknowledgeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 11,
    textAlign: "right",
  },
});
