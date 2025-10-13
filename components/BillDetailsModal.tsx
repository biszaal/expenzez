import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Switch,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../contexts/ThemeContext";
import { DetectedBill } from "../services/billTrackingAlgorithm";
import { BillNotificationService } from "../services/billNotificationService";
import dayjs from "dayjs";

const { width, height } = Dimensions.get("window");

interface MonthlyData {
  month: string;
  amount: number;
  isRecent: boolean;
  displayMonth: string;
  count: number;
}

interface BillDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  bill: any;
  analysis: any;
  onViewTransactions: () => void;
  onManageBill: () => void;
}

// Simplified Monthly Chart Component
const MonthlyChart: React.FC<{
  monthlyData: MonthlyData[];
  colors: any;
  maxAmount: number;
}> = ({ monthlyData, colors, maxAmount }) => {
  const [loading, setLoading] = useState(true);
  const [visibleData, setVisibleData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const sortedData = [...monthlyData].sort(
        (a, b) => dayjs(a.month).valueOf() - dayjs(b.month).valueOf()
      );
      setVisibleData(sortedData);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [monthlyData]);

  const renderMonthlyBar = ({
    item,
    index,
  }: {
    item: MonthlyData;
    index: number;
  }) => {
    const barHeight = maxAmount > 0 ? (item.amount / maxAmount) * 80 : 0;
    const currentMonth = dayjs().format("YYYY-MM");
    const isCurrentMonth = item.month === currentMonth;

    return (
      <View style={styles.monthlyBarContainer}>
        <View style={styles.barWrapper}>
          <Text style={[styles.barAmount, { color: colors.text.primary }]}>
            £{item.amount.toFixed(0)}
          </Text>
          <View
            style={[
              styles.barBackground,
              { backgroundColor: colors.background.primary },
            ]}
          >
            <View
              style={[
                styles.bar,
                {
                  height: Math.max(barHeight, 4),
                  backgroundColor: isCurrentMonth
                    ? colors.primary[500]
                    : colors.primary[300],
                },
              ]}
            />
          </View>
        </View>
        <Text style={[styles.monthLabel, { color: colors.text.secondary }]}>
          {item.displayMonth}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.chartLoading}>
        <ActivityIndicator size="small" color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading chart...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.chartContainer}>
      <FlatList
        data={visibleData}
        renderItem={renderMonthlyBar}
        keyExtractor={(item) => item.month}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartContent}
        ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
      />
    </View>
  );
};

export const BillDetailsModal: React.FC<BillDetailsModalProps> = ({
  visible,
  bill,
  analysis,
  onClose,
  onViewTransactions,
  onManageBill,
}) => {
  const { colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loadingNotification, setLoadingNotification] = useState(false);

  const maxMonthlyAmount = useMemo(() => {
    if (!analysis?.monthlyData) return 0;
    return Math.max(...analysis.monthlyData.map((m) => m.amount), 0);
  }, [analysis?.monthlyData]);

  if (!bill || !analysis) return null;

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "utilities":
        return "flash";
      case "subscriptions":
        return "play-circle";
      case "insurance":
        return "shield-checkmark";
      case "housing":
        return "home";
      case "transportation":
        return "car";
      case "financial":
        return "card";
      case "health":
        return "medical";
      default:
        return "card";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return colors.success[500];
      case "cancelled":
        return colors.error[500];
      case "irregular":
        return colors.warning[500];
      default:
        return colors.primary[500];
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      setLoadingNotification(true);
      await BillNotificationService.updateBillNotificationSettings(
        bill.id,
        enabled
      );
      setNotificationsEnabled(enabled);

      Alert.alert(
        enabled ? "Notifications Enabled" : "Notifications Disabled",
        enabled
          ? `You'll receive reminders for ${bill.name} payments`
          : `You won't receive reminders for ${bill.name} anymore`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to update notification settings. Please try again."
      );
    } finally {
      setLoadingNotification(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View
        style={[
          styles.modalContainer,
          { backgroundColor: colors.background.primary },
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Bill Details
            </Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.billHeader}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: colors.background.secondary },
              ]}
            >
              <Ionicons
                name={getCategoryIcon(bill.category)}
                size={20}
                color={colors.text.primary}
              />
            </View>
            <View style={styles.billInfo}>
              <Text style={[styles.billName, { color: colors.text.primary }]}>
                {bill.name}
              </Text>
              <Text
                style={[styles.billMerchant, { color: colors.text.tertiary }]}
              >
                {bill.merchant}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(bill.status) },
                ]}
              />
              <Text style={[styles.statusText, { color: colors.text.primary }]}>
                {bill.status}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Bill Info */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Current Bill Information
            </Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text
                  style={[styles.infoLabel, { color: colors.text.secondary }]}
                >
                  Amount
                </Text>
                <Text
                  style={[styles.infoValue, { color: colors.text.primary }]}
                >
                  £{Math.abs(bill.amount).toFixed(2)}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text
                  style={[styles.infoLabel, { color: colors.text.secondary }]}
                >
                  Frequency
                </Text>
                <Text
                  style={[styles.infoValue, { color: colors.text.primary }]}
                >
                  {bill.frequency}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text
                  style={[styles.infoLabel, { color: colors.text.secondary }]}
                >
                  Next Due
                </Text>
                <Text
                  style={[styles.infoValue, { color: colors.text.primary }]}
                >
                  {dayjs(bill.nextDueDate).format("MMM DD")}
                </Text>
              </View>
            </View>
          </View>

          {/* Monthly Cost Chart */}
          {analysis.monthlyData.length > 0 && (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.background.secondary },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="bar-chart"
                  size={20}
                  color={colors.primary[500]}
                />
                <Text
                  style={[styles.sectionTitle, { color: colors.text.primary }]}
                >
                  Monthly Costs
                </Text>
              </View>

              <MonthlyChart
                monthlyData={analysis.monthlyData}
                colors={colors}
                maxAmount={maxMonthlyAmount}
              />
            </View>
          )}

          {/* Payment Summary */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="history"
                size={20}
                color={colors.primary[500]}
              />
              <Text
                style={[styles.sectionTitle, { color: colors.text.primary }]}
              >
                Payment Summary
              </Text>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Total Spent
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: colors.text.primary },
                    ]}
                  >
                    £{analysis.totalSpent.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Avg Monthly
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: colors.text.primary },
                    ]}
                  >
                    £{analysis.averageMonthly.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Highest
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: colors.text.primary },
                    ]}
                  >
                    £{analysis.highestPayment.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Lowest
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: colors.text.primary },
                    ]}
                  >
                    £{analysis.lowestPayment.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.trackingInfo,
                { backgroundColor: colors.background.primary },
              ]}
            >
              <Ionicons
                name="analytics"
                size={16}
                color={colors.primary[500]}
              />
              <Text
                style={[styles.trackingText, { color: colors.text.secondary }]}
              >
                {analysis.transactionCount} payments tracked since{" "}
                {dayjs(analysis.firstPaymentDate).format("MMM YYYY")}
              </Text>
            </View>
          </View>

          {/* Notification Settings */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons
                name="notifications"
                size={20}
                color={colors.primary[500]}
              />
              <Text
                style={[styles.sectionTitle, { color: colors.text.primary }]}
              >
                Notifications
              </Text>
            </View>

            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Text
                  style={[
                    styles.notificationTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  Bill Reminders
                </Text>
                <Text
                  style={[
                    styles.notificationSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  Get notified before payments are due
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{
                  false: colors.background.primary,
                  true: colors.primary[200],
                }}
                thumbColor={
                  notificationsEnabled
                    ? colors.primary[500]
                    : colors.text.tertiary
                }
                disabled={loadingNotification}
              />
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View
          style={[
            styles.actions,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.primary[500] },
            ]}
            onPress={onViewTransactions}
          >
            <Ionicons name="list" size={20} color="white" />
            <Text style={styles.actionButtonText}>View Transactions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.background.primary,
                borderWidth: 1,
                borderColor: colors.border.light,
              },
            ]}
            onPress={onManageBill}
          >
            <Ionicons name="settings" size={20} color={colors.text.primary} />
            <Text
              style={[styles.actionButtonText, { color: colors.text.primary }]}
            >
              Manage Bill
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  billHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  billMerchant: {
    fontSize: 13,
    opacity: 0.7,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  infoItem: {
    width: "48%",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  summaryGrid: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 11,
    marginBottom: 4,
    textAlign: "center",
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  trackingInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  trackingText: {
    fontSize: 11,
    marginLeft: 6,
    opacity: 0.7,
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(0,0,0,0.02)",
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  // Chart Styles
  chartContainer: {
    marginTop: 8,
  },
  chartContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chartLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  monthlyBarContainer: {
    alignItems: "center",
    width: 80,
  },
  barWrapper: {
    alignItems: "center",
    marginBottom: 8,
  },
  barAmount: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  barBackground: {
    width: 24,
    height: 80,
    borderRadius: 12,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 12,
    minHeight: 4,
  },
  monthLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  // Notification Styles
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
});
