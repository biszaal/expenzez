import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { BillPreferencesAPI } from "../../services/api/billPreferencesAPI";
import dayjs from "dayjs";

// Bill Icon Component with fallbacks
interface BillIconProps {
  merchant: string;
  category: string;
  size: number;
  color: string;
}

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

const BillIcon: React.FC<BillIconProps> = ({
  merchant,
  category,
  size,
  color,
}) => {
  const getIconName = () => {
    const merchantLower = merchant.toLowerCase();

    // Try merchant-specific icons first
    if (
      merchantLower.includes("netflix") ||
      merchantLower.includes("spotify") ||
      merchantLower.includes("youtube") ||
      merchantLower.includes("disney")
    ) {
      return { name: "play-circle-outline", library: "Ionicons" };
    }
    if (
      merchantLower.includes("amazon") ||
      merchantLower.includes("shop") ||
      merchantLower.includes("store") ||
      merchantLower.includes("walmart")
    ) {
      return { name: "bag-outline", library: "Ionicons" };
    }
    if (
      merchantLower.includes("uber") ||
      merchantLower.includes("lyft") ||
      merchantLower.includes("taxi") ||
      merchantLower.includes("transport")
    ) {
      return { name: "car-outline", library: "Ionicons" };
    }
    if (
      merchantLower.includes("starbucks") ||
      merchantLower.includes("coffee") ||
      merchantLower.includes("restaurant") ||
      merchantLower.includes("food")
    ) {
      return { name: "restaurant-outline", library: "Ionicons" };
    }
    if (
      merchantLower.includes("gym") ||
      merchantLower.includes("fitness") ||
      merchantLower.includes("health") ||
      merchantLower.includes("medical")
    ) {
      return { name: "fitness-outline", library: "Ionicons" };
    }
    if (
      merchantLower.includes("bank") ||
      merchantLower.includes("credit") ||
      merchantLower.includes("loan") ||
      merchantLower.includes("finance")
    ) {
      return { name: "card-outline", library: "Ionicons" };
    }
    if (
      merchantLower.includes("phone") ||
      merchantLower.includes("mobile") ||
      merchantLower.includes("telecom") ||
      merchantLower.includes("verizon")
    ) {
      return { name: "phone-portrait-outline", library: "Ionicons" };
    }
    if (
      merchantLower.includes("gas") ||
      merchantLower.includes("fuel") ||
      merchantLower.includes("petrol") ||
      merchantLower.includes("shell")
    ) {
      return { name: "car-sport-outline", library: "Ionicons" };
    }
    if (
      merchantLower.includes("electric") ||
      merchantLower.includes("water") ||
      merchantLower.includes("utility") ||
      merchantLower.includes("power")
    ) {
      return { name: "flash-outline", library: "Ionicons" };
    }
    if (
      merchantLower.includes("insurance") ||
      merchantLower.includes("geico") ||
      merchantLower.includes("state farm") ||
      merchantLower.includes("allstate")
    ) {
      return { name: "shield-outline", library: "Ionicons" };
    }
    if (
      merchantLower.includes("rent") ||
      merchantLower.includes("mortgage") ||
      merchantLower.includes("housing") ||
      merchantLower.includes("apartment")
    ) {
      return { name: "home-outline", library: "Ionicons" };
    }
    if (
      merchantLower.includes("school") ||
      merchantLower.includes("university") ||
      merchantLower.includes("college") ||
      merchantLower.includes("education")
    ) {
      return { name: "school-outline", library: "Ionicons" };
    }
    if (
      merchantLower.includes("hotel") ||
      merchantLower.includes("airline") ||
      merchantLower.includes("travel") ||
      merchantLower.includes("booking")
    ) {
      return { name: "airplane-outline", library: "Ionicons" };
    }

    // Fallback to category-based icons
    switch (category) {
      case "Subscriptions":
        return { name: "play-circle-outline", library: "Ionicons" };
      case "Utilities":
        return { name: "flash-outline", library: "Ionicons" };
      case "Insurance":
        return { name: "shield-outline", library: "Ionicons" };
      case "Housing":
        return { name: "home-outline", library: "Ionicons" };
      case "Transportation":
        return { name: "car-outline", library: "Ionicons" };
      case "Food & Dining":
        return { name: "restaurant-outline", library: "Ionicons" };
      case "Healthcare":
        return { name: "medical-outline", library: "Ionicons" };
      case "Entertainment":
        return { name: "film-outline", library: "Ionicons" };
      case "Shopping":
        return { name: "bag-outline", library: "Ionicons" };
      case "Education":
        return { name: "school-outline", library: "Ionicons" };
      case "Travel":
        return { name: "airplane-outline", library: "Ionicons" };
      case "Bills & Utilities":
        return { name: "receipt-outline", library: "Ionicons" };
      default:
        return { name: "receipt-outline", library: "Ionicons" };
    }
  };

  const iconInfo = getIconName();

  try {
    if (iconInfo.library === "Ionicons") {
      return <Ionicons name={iconInfo.name as any} size={size} color={color} />;
    } else {
      return (
        <MaterialCommunityIcons
          name={iconInfo.name as any}
          size={size}
          color={color}
        />
      );
    }
  } catch (error) {
    // Ultimate fallback
    return <Ionicons name="receipt-outline" size={size} color={color} />;
  }
};

interface DetectedBill {
  id: string;
  name: string;
  merchant: string;
  amount: number;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  category: string;
  nextDueDate: string;
  lastPaymentDate: string;
  accountId: string;
  bankName: string;
  confidence: number;
  transactions: any[];
  averageAmount: number;
  status: "active" | "cancelled" | "irregular";
}

interface EnhancedBillsListProps {
  bills: DetectedBill[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onBillPress: (bill: DetectedBill) => void;
  onBillLongPress: (bill: DetectedBill) => void;
}

const categories = [
  { name: "All", icon: "apps-outline" },
  { name: "Subscriptions", icon: "play-circle-outline" },
  { name: "Utilities", icon: "flash-outline" },
  { name: "Insurance", icon: "shield-checkmark-outline" },
  { name: "Housing", icon: "home-outline" },
  { name: "Transportation", icon: "car-outline" },
  { name: "Inactive", icon: "pause-circle-outline" },
];

export const EnhancedBillsList: React.FC<EnhancedBillsListProps> = ({
  bills,
  selectedCategory,
  onCategoryChange,
  onBillPress,
  onBillLongPress,
}) => {
  const { colors } = useTheme();
  const [paidBills, setPaidBills] = React.useState<Set<string>>(new Set());
  const [loadingBillId, setLoadingBillId] = React.useState<string | null>(null);

  // Load paid bills from backend on component mount
  useEffect(() => {
    const loadPaidBills = async () => {
      try {
        const preferences = await BillPreferencesAPI.getBillPreferences();
        // Find all bills that have been marked as paid (have paidAt timestamp)
        const paidBillIds = preferences
          .filter(p => (p as any).paidAt !== undefined && (p as any).paidAt !== null)
          .map(p => p.billId);
        setPaidBills(new Set(paidBillIds));
        console.log("[EnhancedBillsList] Loaded paid bills from backend:", paidBillIds);
      } catch (error) {
        console.error("[EnhancedBillsList] Error loading paid bills:", error);
      }
    };
    loadPaidBills();
  }, []);

  // Handle marking bill as paid - call backend API
  const handleMarkAsPaid = async (bill: DetectedBill) => {
    try {
      const newPaidBills = new Set(paidBills);
      const isPaid = !newPaidBills.has(bill.id);

      // Set loading state
      setLoadingBillId(bill.id);

      // Call backend API
      const success = await BillPreferencesAPI.markBillAsPaid(bill.id, isPaid);

      if (success) {
        // Update local state only after successful backend call
        if (isPaid) {
          newPaidBills.add(bill.id);
        } else {
          newPaidBills.delete(bill.id);
        }
        setPaidBills(newPaidBills);
        console.log("[EnhancedBillsList] Bill marked as paid in backend:", { billId: bill.id, isPaid });
      } else {
        console.error("[EnhancedBillsList] Failed to mark bill as paid on backend");
      }
    } catch (error) {
      console.error("[EnhancedBillsList] Error marking bill as paid:", error);
    } finally {
      setLoadingBillId(null);
    }
  };

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

  const filteredBills = bills
    .filter((bill) => {
      if (selectedCategory === "All") return bill.status !== "cancelled";
      if (selectedCategory === "Inactive") return bill.status === "cancelled";
      return bill.category === selectedCategory && bill.status !== "cancelled";
    })
    .filter((bill) => {
      // Only show truly recurring bills - require at least 2 transactions
      const transactionCount = bill.transactions?.length || 0;
      return transactionCount >= 2;
    })
    .filter((bill) => {
      // Hide past bills (bills with due dates in the past)
      const dueDate = dayjs(bill.nextDueDate);
      const today = dayjs();
      return dueDate.isAfter(today) || dueDate.isSame(today, "day");
    })
    // Deduplicate bills with same merchant and similar amounts (within 5%)
    .reduce((uniqueBills, currentBill) => {
      const isDuplicate = uniqueBills.some((bill) => {
        const sameMerchant =
          bill.merchant.toLowerCase() === currentBill.merchant.toLowerCase();
        const similarAmount =
          Math.abs(bill.amount - currentBill.amount) /
            Math.min(bill.amount, currentBill.amount) <
          0.05; // Within 5%
        return sameMerchant && similarAmount;
      });

      if (!isDuplicate) {
        uniqueBills.push(currentBill);
      }
      return uniqueBills;
    }, [] as DetectedBill[])
    .sort((a, b) => {
      // Sort by next due date (ascending - earliest first)
      const dateA = dayjs(a.nextDueDate);
      const dateB = dayjs(b.nextDueDate);

      // Handle invalid dates - put them at the end
      if (!dateA.isValid() && !dateB.isValid()) return 0;
      if (!dateA.isValid()) return 1;
      if (!dateB.isValid()) return -1;

      return dateA.diff(dateB);
    });

  return (
    <View style={styles.container}>
      {/* Minimal Category Filter */}
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
                      ? colors.primary[500]
                      : colors.background.secondary,
                  borderWidth: selectedCategory === category.name ? 0 : 1,
                  borderColor: colors.border.light,
                },
              ]}
              onPress={() => onCategoryChange(category.name)}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={
                  selectedCategory === category.name
                    ? "white"
                    : colors.text.secondary
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
                  {
                    backgroundColor: colors.background.primary,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                  },
                ]}
                onPress={() => onBillPress(bill)}
                onLongPress={() => onBillLongPress(bill)}
                delayLongPress={500}
              >
                <View style={styles.billCardContent}>
                  <View
                    style={[
                      styles.billIcon,
                      {
                        backgroundColor: colors.background.secondary,
                        borderWidth: 1,
                        borderColor: colors.border.light,
                      },
                    ]}
                  >
                    <BillIcon
                      merchant={bill.merchant}
                      category={bill.category}
                      size={20}
                      color={colors.text.secondary}
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
                            £{formatAmount(bill.amount)}
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

                        {/* Mark Paid Button */}
                        <TouchableOpacity
                          style={[
                            styles.paidButton,
                            paidBills.has(bill.id)
                              ? {
                                  backgroundColor: colors.success[500],
                                  borderColor: colors.success[500],
                                }
                              : {
                                  backgroundColor: "transparent",
                                  borderColor: colors.text.tertiary,
                                },
                            loadingBillId === bill.id && { opacity: 0.6 },
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            if (loadingBillId !== bill.id) {
                              handleMarkAsPaid(bill);
                            }
                          }}
                          disabled={loadingBillId === bill.id}
                        >
                          {paidBills.has(bill.id) && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color="white"
                            />
                          )}
                          <Text
                            style={[
                              styles.paidButtonText,
                              {
                                color: paidBills.has(bill.id)
                                  ? "white"
                                  : colors.text.tertiary,
                              },
                            ]}
                          >
                            {paidBills.has(bill.id) ? "Paid" : "Mark Paid"}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.billMenuButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            onBillLongPress(bill);
                          }}
                        >
                          <Ionicons
                            name="ellipsis-vertical"
                            size={16}
                            color={colors.text.tertiary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.billMeta}>
                      <Text
                        style={[
                          styles.billBank,
                          { color: colors.text.tertiary },
                        ]}
                      >
                        {dayjs(bill.nextDueDate).format("MMM DD")}
                      </Text>
                      <Text
                        style={[
                          styles.billStatus,
                          {
                            color: urgency.color,
                            fontWeight: urgency.daysText.includes("ago")
                              ? "600"
                              : "400",
                          },
                        ]}
                      >
                        {urgency.daysText}
                      </Text>
                    </View>
                  </View>
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
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  categoryScroll: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  billsSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  billCount: {
    fontSize: 16,
    fontWeight: "400" as const,
    opacity: 0.7,
  },
  billCard: {
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden" as const,
  },
  billCardContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 12,
  },
  billIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  billDetails: {
    flex: 1,
  },
  billHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 6,
  },
  billName: {
    fontSize: 15,
    fontWeight: "500" as const,
    flex: 1,
    letterSpacing: -0.1,
  },
  billHeaderRight: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  billAmountContainer: {
    flexDirection: "row" as const,
    alignItems: "baseline" as const,
  },
  billMenuButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  paidButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  paidButtonText: {
    fontSize: 11,
    fontWeight: "500" as const,
    marginLeft: 4,
  },
  billAmount: {
    fontSize: 16,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  billFrequency: {
    fontSize: 12,
    fontWeight: "400" as const,
    opacity: 0.7,
  },
  billMeta: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  billBank: {
    fontSize: 12,
    flex: 1,
    opacity: 0.7,
  },
  billStatus: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  emptyState: {
    alignItems: "center" as const,
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "500" as const,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center" as const,
    lineHeight: 20,
    opacity: 0.7,
  },
};
