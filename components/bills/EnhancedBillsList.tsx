import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import dayjs from "dayjs";

interface DetectedBill {
  id: string;
  name: string;
  merchant: string;
  amount: number;
  frequency: string;
  category: string;
  status: "active" | "cancelled" | "inactive";
  nextDueDate: string;
  confidence: number;
  bankName: string;
}

interface EnhancedBillsListProps {
  bills: DetectedBill[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onBillPress: (bill: DetectedBill) => void;
  onBillLongPress: (bill: DetectedBill) => void;
}

const categories = [
  { name: "All", icon: "apps-outline", color: "#6366F1" },
  { name: "Subscriptions", icon: "play-circle-outline", color: "#8B5CF6" },
  { name: "Utilities", icon: "flash-outline", color: "#F59E0B" },
  { name: "Insurance", icon: "shield-checkmark-outline", color: "#10B981" },
  { name: "Housing", icon: "home-outline", color: "#EF4444" },
  { name: "Transportation", icon: "car-outline", color: "#06B6D4" },
  { name: "Inactive", icon: "pause-circle-outline", color: "#6B7280" },
];

export const EnhancedBillsList: React.FC<EnhancedBillsListProps> = ({
  bills,
  selectedCategory,
  onCategoryChange,
  onBillPress,
  onBillLongPress,
}) => {
  const { colors } = useTheme();

  const getBillUrgency = (dueDate: string) => {
    const daysUntilDue = dayjs(dueDate).diff(dayjs(), "days");

    if (daysUntilDue < 0) {
      return {
        level: "overdue",
        color: colors.error[500],
        bgColor: colors.error[500] + "15",
        text: "Overdue",
        daysText: `${Math.abs(daysUntilDue)}d ago`,
      };
    } else if (daysUntilDue <= 3) {
      return {
        level: "urgent",
        color: colors.error[500],
        bgColor: colors.error[500] + "15",
        text: "Due Soon",
        daysText: daysUntilDue === 0 ? "Today" : `${daysUntilDue}d left`,
      };
    } else if (daysUntilDue <= 7) {
      return {
        level: "soon",
        color: colors.warning[500],
        bgColor: colors.warning[500] + "15",
        text: "This Week",
        daysText: `${daysUntilDue}d left`,
      };
    } else {
      return {
        level: "normal",
        color: colors.success[500],
        bgColor: colors.success[500] + "15",
        text: "Upcoming",
        daysText: `${daysUntilDue}d left`,
      };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Subscriptions":
        return "play-circle-outline";
      case "Utilities":
        return "flash-outline";
      case "Insurance":
        return "shield-outline";
      case "Housing":
        return "home-outline";
      case "Transportation":
        return "car-outline";
      default:
        return "receipt";
    }
  };

  const filteredBills = bills.filter((bill) => {
    if (selectedCategory === "All") return bill.status !== "cancelled";
    if (selectedCategory === "Inactive") return bill.status === "cancelled";
    return bill.category === selectedCategory && bill.status !== "cancelled";
  });

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === category.name
                      ? category.color
                      : colors.background.primary,
                },
              ]}
              onPress={() => onCategoryChange(category.name)}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={
                  selectedCategory === category.name ? "white" : category.color
                }
              />
              <Text
                style={[
                  styles.categoryChipText,
                  {
                    color:
                      selectedCategory === category.name
                        ? "white"
                        : colors.text.primary,
                  },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.background.primary },
            ]}
          >
            <Ionicons
              name="receipt-outline"
              size={32}
              color={colors.text.tertiary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No bills found
          </Text>
          <Text
            style={[styles.emptySubtitle, { color: colors.text.secondary }]}
          >
            {selectedCategory === "All"
              ? "We couldn't detect any recurring bills. Make sure you have enough transaction history."
              : `No bills found in the ${selectedCategory} category.`}
          </Text>
        </View>
      ) : (
        <View style={styles.billsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            {selectedCategory === "All" ? "All Bills" : selectedCategory}
            <Text style={[styles.billCount, { color: colors.text.secondary }]}>
              {" "}
              ({filteredBills.length})
            </Text>
          </Text>

          {filteredBills.map((bill) => {
            const urgency = getBillUrgency(bill.nextDueDate);
            const categoryInfo = categories.find(
              (c) => c.name === bill.category
            );

            return (
              <TouchableOpacity
                key={bill.id}
                style={[
                  styles.billCard,
                  { backgroundColor: colors.background.primary },
                ]}
                onPress={() => onBillPress(bill)}
                onLongPress={() => onBillLongPress(bill)}
                delayLongPress={500}
              >
                {/* Urgency Indicator Bar */}
                <View
                  style={[
                    styles.urgencyBar,
                    { backgroundColor: urgency.color },
                  ]}
                />

                <View style={styles.billCardContent}>
                  <View
                    style={[
                      styles.billIcon,
                      {
                        backgroundColor:
                          (categoryInfo?.color || colors.primary[500]) + "20",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getCategoryIcon(bill.category) as any}
                      size={24}
                      color={categoryInfo?.color || colors.primary[500]}
                    />
                  </View>

                  <View style={styles.billDetails}>
                    <View style={styles.billHeader}>
                      <Text
                        style={[
                          styles.billName,
                          { color: colors.text.primary },
                        ]}
                      >
                        {bill.name}
                      </Text>
                      <View style={styles.billHeaderRight}>
                        <View style={styles.billAmountContainer}>
                          <Text
                            style={[
                              styles.billAmount,
                              { color: colors.text.primary },
                            ]}
                          >
                            £{Math.abs(bill.amount).toFixed(2)}
                          </Text>
                          <Text
                            style={[
                              styles.billFrequency,
                              { color: colors.text.tertiary },
                            ]}
                          >
                            /
                            {bill.frequency === "monthly"
                              ? "mo"
                              : bill.frequency === "yearly"
                                ? "yr"
                                : bill.frequency === "weekly"
                                  ? "wk"
                                  : "qtr"}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.billMenuButton,
                            { backgroundColor: colors.background.secondary },
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            onBillLongPress(bill);
                          }}
                        >
                          <Ionicons
                            name="ellipsis-vertical"
                            size={16}
                            color={colors.text.secondary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.billMeta}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Text
                          style={[
                            styles.billBank,
                            { color: colors.text.secondary },
                          ]}
                        >
                          {bill.bankName} •{" "}
                          {dayjs(bill.nextDueDate).format("MMM DD")}
                        </Text>
                        <View
                          style={[
                            styles.urgencyBadge,
                            { backgroundColor: urgency.bgColor },
                          ]}
                        >
                          <Text
                            style={[
                              styles.urgencyText,
                              { color: urgency.color },
                            ]}
                          >
                            {urgency.daysText}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.billStatus}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                bill.status === "active"
                                  ? colors.success[500]
                                  : bill.status === "cancelled"
                                    ? colors.error[500]
                                    : colors.warning[500],
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: colors.text.tertiary },
                          ]}
                        >
                          {bill.status.charAt(0).toUpperCase() +
                            bill.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Confidence Bar */}
                <View
                  style={[
                    styles.confidenceBar,
                    { backgroundColor: colors.background.secondary },
                  ]}
                >
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${bill.confidence * 100}%`,
                        backgroundColor:
                          bill.confidence > 0.8
                            ? colors.success[500]
                            : bill.confidence > 0.6
                              ? colors.warning[500]
                              : colors.error[500],
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  categoryScroll: {
    gap: 12,
  },
  categoryChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  billsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 16,
  },
  billCount: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  billCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden" as const,
    position: "relative" as const,
  },
  urgencyBar: {
    position: "absolute" as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  billCardContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 16,
  },
  billIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 16,
  },
  billDetails: {
    flex: 1,
  },
  billHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  billName: {
    fontSize: 16,
    fontWeight: "600" as const,
    flex: 1,
  },
  billHeaderRight: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  billAmountContainer: {
    flexDirection: "row" as const,
    alignItems: "baseline" as const,
  },
  billMenuButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  billAmount: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  billFrequency: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  billMeta: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  billBank: {
    fontSize: 14,
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  billStatus: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  confidenceBar: {
    height: 3,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 1.5,
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 1.5,
  },
  emptyState: {
    alignItems: "center" as const,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center" as const,
    lineHeight: 20,
  },
};
