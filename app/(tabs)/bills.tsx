import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import { BillsSkeleton } from "../../components/ui/SkeletonLoader";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import BillTrackingAlgorithm, { DetectedBill } from "../../services/billTrackingAlgorithm";
import { autoBillDetection } from "../../services/automaticBillDetection";
import { BillPreferencesAPI } from "../../services/api/billPreferencesAPI";
import { BillDetailsModal } from "../../components/BillDetailsModal";
import dayjs from "dayjs";

const { width } = Dimensions.get("window");

export default function BillsScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { isLoggedIn: authLoggedIn } = useAuthGuard();
  const { colors } = useTheme();
  const { showSuccess, showError } = useAlert();

  const [bills, setBills] = useState<DetectedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBill, setSelectedBill] = useState<DetectedBill | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [excludeModalVisible, setExcludeModalVisible] = useState(false);
  const [billToExclude, setBillToExclude] = useState<DetectedBill | null>(null);

  const categories = [
    { name: "All", icon: "apps-outline", color: colors.primary[500] },
    { name: "Subscriptions", icon: "play-circle-outline", color: colors.secondary?.[500] || colors.primary[500] },
    { name: "Utilities", icon: "flash-outline", color: colors.warning?.[500] || colors.primary[500] },
    { name: "Insurance", icon: "shield-checkmark-outline", color: colors.success?.[500] || colors.primary[500] },
    { name: "Housing", icon: "home-outline", color: colors.primary[500] },
    { name: "Transportation", icon: "car-outline", color: colors.secondary?.[500] || colors.primary[500] },
    { name: "Inactive", icon: "pause-circle-outline", color: colors.text.secondary },
  ];

  const fetchBills = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      console.log('[Bills] Fetching bills with improved algorithm...');

      // For the first load after algorithm improvements, invalidate cache
      // This ensures old grocery bills are removed
      let detectedBills: DetectedBill[];

      if (showRefresh) {
        // Manual refresh - force complete cache invalidation
        console.log('[Bills] Manual refresh - invalidating cache and running fresh detection...');
        detectedBills = await autoBillDetection.invalidateCacheAndRefresh();
      } else {
        // Now that cache is cleared, use smart caching for optimal performance
        // The new algorithm will automatically filter out grocery stores
        console.log('[Bills] Loading bills with improved merchant filtering...');
        detectedBills = await autoBillDetection.getBillsWithSmartCaching();
      }

      console.log(`[Bills] Got ${detectedBills.length} bills:`, detectedBills.map(b => `${b.merchant}: £${Math.abs(b.amount)}`));

      let finalBills = detectedBills;

      // Try to fetch user preferences, but don't fail if it doesn't work
      try {
        console.log(`[Bills] Attempting to fetch user preferences...`);
        const userPreferences = await BillPreferencesAPI.getBillPreferences();
        const mergedBills = await BillPreferencesAPI.mergeBillsWithPreferences(detectedBills, userPreferences);
        console.log(`[Bills] Successfully merged with ${userPreferences.length} user preferences`);
        finalBills = mergedBills;
        setBills(mergedBills);
      } catch (error) {
        console.log(`[Bills] Bill preferences API not available yet, using detected bills only:`, error instanceof Error ? error.message : String(error));
        setBills(detectedBills);
      }

      if (showRefresh) {
        showSuccess(`Found ${finalBills.length} recurring bills`);
      } else if (finalBills.length > 0) {
        console.log(`[Bills] Loaded ${finalBills.length} bills from cache/detection`);
      }
    } catch (error) {
      console.error("Error analyzing bills:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      if ((error as any)?.response?.status === 404) {
        showError("Transaction service not available");
      } else if ((error as any)?.response?.status === 401) {
        showError("Please log in again");
      } else {
        showError("Failed to analyze bills");
      }
      setBills([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setRefreshing, setLoading, setBills, showSuccess, showError]);

  // Handle bill exclusion with user-friendly options
  const handleExcludeBill = useCallback(async (reason: 'not_recurring' | 'no_longer_active' | 'incorrect_detection') => {
    if (!billToExclude) return;

    try {
      setExcludeModalVisible(false);

      // Show loading state
      showSuccess('Removing bill...');

      // Exclude the bill via API
      await BillPreferencesAPI.excludeBill({
        merchant: billToExclude.merchant,
        amount: billToExclude.amount,
        category: billToExclude.category,
        reason
      });

      // Remove from current bills list immediately for better UX
      setBills(prevBills => prevBills.filter(bill => bill.id !== billToExclude.id));

      // Show success message with appropriate text
      const reasonText = {
        'not_recurring': 'not a recurring bill',
        'no_longer_active': 'no longer active',
        'incorrect_detection': 'incorrectly detected'
      }[reason];

      showSuccess(`✓ Removed "${billToExclude.merchant}" - marked as ${reasonText}`);

      // Clear selected bill
      setBillToExclude(null);

    } catch (error) {
      console.error('Error excluding bill:', error);
      showError('Failed to remove bill. Please try again.');
      setExcludeModalVisible(true); // Show modal again on error
    }
  }, [billToExclude, showSuccess, showError, setBills]);

  // Open exclusion modal for a bill
  const openExcludeModal = useCallback((bill: DetectedBill) => {
    setBillToExclude(bill);
    setExcludeModalVisible(true);
  }, []);

  const onRefresh = () => {
    fetchBills(true);
  };

  useEffect(() => {
    if (!authLoggedIn) {
      router.replace("/auth/Login");
    }
  }, [authLoggedIn, router]);

  // Clear data when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      // Clear all user-specific data
      setBills([]);
      setSelectedBill(null);
      setBillToExclude(null);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // Load bills using manual transaction data from DynamoDB
    if (isLoggedIn) {
      fetchBills();
    }
  }, [isLoggedIn, fetchBills]);

  // Filter bills by selected category
  const filteredBills = useMemo(() => {
    if (selectedCategory === "All") return bills.filter(bill => bill.status !== 'cancelled');
    if (selectedCategory === "Inactive") return bills.filter(bill => bill.status === 'cancelled');
    return bills.filter(bill => bill.category === selectedCategory && bill.status !== 'cancelled');
  }, [bills, selectedCategory]);

  // Calculate statistics
  const stats = useMemo(() => {
    const monthlyTotal = BillTrackingAlgorithm.calculateMonthlyTotal(bills);
    const upcomingBills = BillTrackingAlgorithm.getUpcomingBills(bills, 7);
    const activeBills = bills.filter(bill => bill.status === 'active').length;
    
    return {
      monthlyTotal,
      upcomingCount: upcomingBills.length,
      activeBills,
      totalBills: bills.length,
    };
  }, [bills]);

  const sortedBillsByCategory = useMemo(() => {
    // First sort all bills by priority (important bills first)
    const sortedBills = BillTrackingAlgorithm.getBillsByPriority(filteredBills);

    // Then group them by category while preserving priority order
    return BillTrackingAlgorithm.getBillsByCategory(sortedBills);
  }, [filteredBills]);

  const showBillDetails = (bill: DetectedBill) => {
    setSelectedBill(bill);
    setModalVisible(true);
  };

  // Generate analysis data for the selected bill
  const getAnalysisForBill = (bill: DetectedBill) => {
    if (!bill || !bill.transactions || bill.transactions.length === 0) return null;

    const transactions = bill.transactions.map(t => ({ ...t, amount: Math.abs(t.amount) }));
    const sortedTransactions = transactions.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

    // Monthly data
    const monthlyMap = new Map<string, number>();
    transactions.forEach(transaction => {
      const monthKey = dayjs(transaction.date).format('YYYY-MM');
      const amount = Math.abs(transaction.amount);

      if (monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, monthlyMap.get(monthKey)! + amount);
      } else {
        monthlyMap.set(monthKey, amount);
      }
    });

    const sortedEntries = Array.from(monthlyMap.entries())
      .sort((a, b) => dayjs(a[0]).valueOf() - dayjs(b[0]).valueOf());

    const monthlyData = sortedEntries
      .map(([month, amount], index) => {
        const monthDate = dayjs(month);
        const prevMonth = index > 0 ? dayjs(sortedEntries[index - 1][0]) : null;

        // Show year if it's January OR if the previous month is in a different year OR if it's the first month
        const isJanuary = monthDate.month() === 0; // January is month 0 (0-indexed)
        const isYearChange = prevMonth && monthDate.year() !== prevMonth.year();
        const isFirstMonth = index === 0;

        const displayMonth = (isJanuary || isYearChange || isFirstMonth)
          ? monthDate.format('MMM YYYY')
          : monthDate.format('MMM');

        return {
          month,
          amount,
          isRecent: dayjs().diff(monthDate, 'months') <= 6,
          displayMonth,
          count: transactions.filter(t => dayjs(t.date).format('YYYY-MM') === month).length
        };
      });

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const averageMonthly = totalSpent / monthlyData.length;
    const firstAmount = sortedTransactions[0].amount;
    const lastAmount = sortedTransactions[sortedTransactions.length - 1].amount;
    const firstPaymentDate = sortedTransactions[0].date;
    const lastPaymentDate = sortedTransactions[sortedTransactions.length - 1].date;

    const totalIncrease = lastAmount - firstAmount;
    const percentageIncrease = firstAmount > 0 ? (totalIncrease / firstAmount) * 100 : 0;

    return {
      totalSpent,
      averageMonthly,
      firstAmount,
      lastAmount,
      firstPaymentDate,
      lastPaymentDate,
      totalIncrease,
      percentageIncrease,
      transactionCount: transactions.length,
      monthlyData,
      highestPayment: Math.max(...transactions.map(t => t.amount)),
      lowestPayment: Math.min(...transactions.map(t => t.amount))
    };
  };

  const showBillManagement = (bill: DetectedBill) => {
    const isInactive = bill.status === 'cancelled';
    
    Alert.alert(
      `Manage ${bill.name}`,
      `What would you like to do with this bill?`,
      [
        { 
          text: "Edit Category", 
          onPress: () => showCategoryEditor(bill),
          style: "default"
        },
        { 
          text: isInactive ? "Reactivate" : "Mark as Inactive", 
          onPress: () => isInactive ? reactivateBill(bill) : markBillInactive(bill),
          style: "default"
        },
        {
          text: "Don't Track This",
          onPress: () => openExcludeModal(bill),
          style: "destructive"
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const showCategoryEditor = (bill: DetectedBill) => {
    Alert.alert(
      "Change Category",
      `Select a new category for ${bill.name}:`,
      [
        ...categories.slice(1).map(category => ({
          text: category.name,
          onPress: () => updateBillCategory(bill, category.name)
        })),
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const updateBillCategory = async (bill: DetectedBill, newCategory: string) => {
    try {
      try {
        await BillPreferencesAPI.updateBillCategory(bill.id, newCategory);
        showSuccess(`Moved ${bill.name} to ${newCategory}`);
      } catch (apiError) {
        console.warn('Backend API not available, using local storage only:', apiError);
        showSuccess(`Moved ${bill.name} to ${newCategory} (local only)`);
      }
      
      // Update local state
      const updatedBills = bills.map(b => 
        b.id === bill.id 
          ? { ...b, category: newCategory, userModified: true }
          : b
      );
      setBills(updatedBills);
    } catch (error) {
      console.error('Failed to update bill category:', error);
      showError(`Failed to update ${bill.name} category`);
    }
  };

  const markBillInactive = async (bill: DetectedBill) => {
    try {
      try {
        await BillPreferencesAPI.updateBillStatus(bill.id, 'inactive');
        showSuccess(`${bill.name} marked as inactive`);
      } catch (apiError) {
        console.warn('Backend API not available, using local storage only:', apiError);
        showSuccess(`${bill.name} marked as inactive (local only)`);
      }
      
      // Update local state
      const updatedBills = bills.map(b => 
        b.id === bill.id 
          ? { ...b, status: 'cancelled' as const, userModified: true }
          : b
      );
      setBills(updatedBills);
    } catch (error) {
      console.error('Failed to mark bill as inactive:', error);
      showError(`Failed to update ${bill.name} status`);
    }
  };

  const reactivateBill = async (bill: DetectedBill) => {
    try {
      try {
        await BillPreferencesAPI.updateBillStatus(bill.id, 'active');
        showSuccess(`${bill.name} reactivated`);
      } catch (apiError) {
        console.warn('Backend API not available, using local storage only:', apiError);
        showSuccess(`${bill.name} reactivated (local only)`);
      }
      
      // Update local state
      const updatedBills = bills.map(b => 
        b.id === bill.id 
          ? { ...b, status: 'active' as const, userModified: true }
          : b
      );
      setBills(updatedBills);
    } catch (error) {
      console.error('Failed to reactivate bill:', error);
      showError(`Failed to reactivate ${bill.name}`);
    }
  };

  const confirmRemoveBill = (bill: DetectedBill) => {
    Alert.alert(
      "Remove Bill",
      `Are you sure you want to remove "${bill.name}"? This action cannot be undone.`,
      [
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeBill(bill)
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const removeBill = async (bill: DetectedBill) => {
    try {
      // Mark bill as ignored in preferences so it won't appear again
      const preference = await BillPreferencesAPI.createPreferenceFromBill(bill, {
        isIgnored: true,
        status: 'inactive' as const
      });

      try {
        await BillPreferencesAPI.saveBillPreference(preference);
        showSuccess(`${bill.name} removed successfully`);
      } catch (apiError) {
        console.warn('Backend API not available, using local storage only:', apiError);
        showSuccess(`${bill.name} removed successfully (local only)`);
      }
      
      // Update local state - remove from display
      const updatedBills = bills.filter(b => b.id !== bill.id);
      setBills(updatedBills);
    } catch (error) {
      console.error('Failed to remove bill:', error);
      showError(`Failed to remove ${bill.name}`);
    }
  };

  const showAddBillOptions = () => {
    Alert.alert(
      "Add New Bill",
      "How would you like to add a new bill?",
      [
        {
          text: "Create Manually",
          onPress: () => showManualBillCreator(),
          style: "default"
        },
        {
          text: "From Recent Transactions",
          onPress: () => router.push("/transactions"),
          style: "default"
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const showManualBillCreator = () => {
    Alert.alert(
      "Manual Bill Creation",
      "This feature allows you to manually create recurring bills. For now, you can:\n\n• Go to Transactions to mark transactions as bills\n• Bills will be automatically detected from your transaction patterns",
      [
        { text: "Go to Transactions", onPress: () => router.push("/transactions") },
        { text: "OK", style: "default" }
      ]
    );
  };

  // Calculate urgency based on days until due
  const getBillUrgency = (dueDate: string) => {
    const daysUntilDue = dayjs(dueDate).diff(dayjs(), 'days');

    if (daysUntilDue < 0) {
      return {
        level: 'overdue',
        color: colors.error?.[500] || '#EF4444',
        bgColor: colors.error?.[500] + '15' || '#EF444415',
        text: 'Overdue',
        daysText: `${Math.abs(daysUntilDue)}d ago`
      };
    } else if (daysUntilDue <= 3) {
      return {
        level: 'urgent',
        color: colors.error?.[500] || '#EF4444',
        bgColor: colors.error?.[500] + '15' || '#EF444415',
        text: 'Due Soon',
        daysText: daysUntilDue === 0 ? 'Today' : `${daysUntilDue}d left`
      };
    } else if (daysUntilDue <= 7) {
      return {
        level: 'soon',
        color: colors.warning?.[500] || '#F59E0B',
        bgColor: colors.warning?.[500] + '15' || '#F59E0B15',
        text: 'This Week',
        daysText: `${daysUntilDue}d left`
      };
    } else {
      return {
        level: 'normal',
        color: colors.success?.[500] || '#10B981',
        bgColor: colors.success?.[500] + '15' || '#10B98115',
        text: 'Upcoming',
        daysText: `${daysUntilDue}d left`
      };
    }
  };

  if (!authLoggedIn) {
    return null;
  }

  // Show loading screen during initial load
  if (loading && bills.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <BillsSkeleton />
      </SafeAreaView>
    );
  }

  // Manual input mode - no need to check for bank connections

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Premium Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                Bills
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
                AI-powered bill tracking
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.upcomingButton, { backgroundColor: colors.primary[500], ...shadows.sm }]}
                onPress={() => router.push("/upcoming-bills")}
              >
                <Ionicons name="calendar" size={16} color="white" />
                <Text style={[styles.upcomingButtonText, { color: "white" }]}>
                  Upcoming
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.transactionsButton, { backgroundColor: colors.background.primary, ...shadows.sm }]}
                onPress={() => router.push("/transactions")}
              >
                <Ionicons name="list-outline" size={16} color={colors.primary[500]} />
                <Text style={[styles.transactionsButtonText, { color: colors.primary[500] }]}>
                  Transactions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.helpButton, { backgroundColor: colors.background.primary, ...shadows.sm }]}
                onPress={() => Alert.alert("Bill Tracking", "Our AI automatically detects recurring payments from your transactions. Bills are grouped by merchant and frequency patterns.")}
              >
                <Ionicons name="information-circle-outline" size={20} color={colors.primary[500]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Analyzing your transactions...
            </Text>
          </View>
        ) : (
          <>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.background.primary, ...shadows.sm }]}>
                  <LinearGradient
                    colors={[colors.primary[100], colors.primary[50]]}
                    style={styles.statIconContainer}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.primary[500]} />
                  </LinearGradient>
                  <Text style={[styles.statValue, { color: colors.text.primary }]}>
                    £{Math.abs(stats.monthlyTotal).toFixed(0)}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                    Monthly Total
                  </Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.background.primary, ...shadows.sm }]}>
                  <LinearGradient
                    colors={[colors.warning?.[100] || colors.primary[100], colors.warning?.[50] || colors.primary[50]]}
                    style={styles.statIconContainer}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.warning?.[500] || colors.primary[500]} />
                  </LinearGradient>
                  <Text style={[styles.statValue, { color: colors.text.primary }]}>
                    {stats.upcomingCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                    Due This Week
                  </Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.background.primary, ...shadows.sm }]}>
                  <LinearGradient
                    colors={[colors.success?.[100] || colors.primary[100], colors.success?.[50] || colors.primary[50]]}
                    style={styles.statIconContainer}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color={colors.success?.[500] || colors.primary[500]} />
                  </LinearGradient>
                  <Text style={[styles.statValue, { color: colors.text.primary }]}>
                    {stats.activeBills}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                    Active Bills
                  </Text>
                </View>
              </View>
            </View>

            {/* Category Filter */}
            <View style={styles.categorySection}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Categories
              </Text>
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
                        backgroundColor: selectedCategory === category.name
                          ? category.color
                          : colors.background.primary,
                      },
                      shadows.sm
                    ]}
                    onPress={() => setSelectedCategory(category.name)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={16}
                      color={selectedCategory === category.name ? "white" : category.color}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        {
                          color: selectedCategory === category.name
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
              <EmptyState
                type="bills"
                description={
                  selectedCategory === "All"
                    ? "We couldn't detect any recurring bills. Make sure you have enough transaction history."
                    : `No bills found in the ${selectedCategory} category.`
                }
                onAction={() => router.push("/transactions")}
                secondaryActionLabel="How It Works"
                onSecondaryAction={() => Alert.alert("Bill Tracking", "Our AI automatically detects recurring payments from your transactions. Bills are grouped by merchant and frequency patterns.")}
              />
            ) : (
              <View style={styles.billsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  {selectedCategory === "All" ? "All Bills" : selectedCategory}
                  <Text style={[styles.billCount, { color: colors.text.secondary }]}>
                    {" "}({filteredBills.length})
                  </Text>
                </Text>

                {Object.entries(sortedBillsByCategory).map(([category, categoryBills]) => (
                  <View key={category} style={styles.categoryGroup}>
                    {selectedCategory === "All" && (
                      <Text style={[styles.categoryGroupTitle, { color: colors.text.secondary }]}>
                        {category}
                      </Text>
                    )}
                    {categoryBills.map((bill) => {
                      const urgency = getBillUrgency(bill.nextDueDate);

                      return (
                        <TouchableOpacity
                          key={bill.id}
                          style={[styles.billCard, { backgroundColor: colors.background.primary, ...shadows.sm }]}
                          onPress={() => showBillDetails(bill)}
                          onLongPress={() => showBillManagement(bill)}
                          delayLongPress={500}
                        >
                          {/* Urgency Indicator Bar */}
                          <View style={[styles.urgencyBar, { backgroundColor: urgency.color }]} />

                          <View style={styles.billCardContent}>
                            <View style={[styles.billIcon, { backgroundColor: categories.find(c => c.name === bill.category)?.color + '20' || colors.primary[100] }]}>
                              <MaterialCommunityIcons
                                name={
                                  bill.category === 'Subscriptions' ? 'play-circle-outline' :
                                  bill.category === 'Utilities' ? 'flash-outline' :
                                  bill.category === 'Insurance' ? 'shield-outline' :
                                  bill.category === 'Housing' ? 'home-outline' :
                                  bill.category === 'Transportation' ? 'car-outline' :
                                  'receipt'
                                }
                                size={24}
                                color={categories.find(c => c.name === bill.category)?.color || colors.primary[500]}
                              />
                            </View>

                            <View style={styles.billDetails}>
                              <View style={styles.billHeader}>
                                <Text style={[styles.billName, { color: colors.text.primary }]}>
                                  {bill.name}
                                </Text>
                                <View style={styles.billHeaderRight}>
                                  <View style={styles.billAmountContainer}>
                                    <Text style={[styles.billAmount, { color: colors.text.primary }]}>
                                      £{Math.abs(bill.amount).toFixed(2)}
                                    </Text>
                                    <Text style={[styles.billFrequency, { color: colors.text.tertiary }]}>
                                      /{bill.frequency === 'monthly' ? 'mo' : bill.frequency === 'yearly' ? 'yr' : bill.frequency === 'weekly' ? 'wk' : 'qtr'}
                                    </Text>
                                  </View>
                                  <TouchableOpacity
                                    style={[styles.billMenuButton, { backgroundColor: colors.background.secondary }]}
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      showBillManagement(bill);
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
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                                  <Text style={[styles.billBank, { color: colors.text.secondary }]}>
                                    {bill.bankName} • {dayjs(bill.nextDueDate).format('MMM DD')}
                                  </Text>
                                  <View style={[styles.urgencyBadge, { backgroundColor: urgency.bgColor }]}>
                                    <Text style={[styles.urgencyText, { color: urgency.color }]}>
                                      {urgency.daysText}
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.billStatus}>
                                  <View
                                    style={[
                                      styles.statusDot,
                                      {
                                        backgroundColor: bill.status === 'active'
                                          ? colors.success?.[500] || colors.primary[500]
                                          : bill.status === 'cancelled'
                                          ? colors.error?.[500] || '#EF4444'
                                          : colors.warning?.[500] || '#F59E0B'
                                      }
                                    ]}
                                  />
                                  <Text style={[styles.statusText, { color: colors.text.tertiary }]}>
                                    {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        
                        <View style={[styles.confidenceBar, { backgroundColor: colors.background.secondary }]}>
                          <View
                            style={[
                              styles.confidenceFill,
                              {
                                width: `${bill.confidence * 100}%`,
                                backgroundColor: bill.confidence > 0.8 
                                  ? colors.success?.[500] || colors.primary[500]
                                  : bill.confidence > 0.6 
                                  ? colors.warning?.[500] || '#F59E0B'
                                  : colors.error?.[500] || '#EF4444'
                              }
                            ]}
                          />
                        </View>
                      </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button for Adding New Bill */}
      <TouchableOpacity
        style={[styles.fabButton, { backgroundColor: colors.primary[500] }]}
        onPress={showAddBillOptions}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Bill Details Modal */}
      {selectedBill && (
        <BillDetailsModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedBill(null);
          }}
          bill={selectedBill}
          analysis={getAnalysisForBill(selectedBill)}
          onViewTransactions={() => {
            setModalVisible(false);
            router.push(`/transactions?merchant=${encodeURIComponent(selectedBill.merchant)}`);
          }}
          onManageBill={() => {
            setModalVisible(false);
            showBillManagement(selectedBill);
          }}
        />
      )}

      {/* User-Friendly Bill Exclusion Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={excludeModalVisible}
        onRequestClose={() => setExcludeModalVisible(false)}
      >
        <View style={excludeModalStyles.overlay}>
          <View style={[excludeModalStyles.modal, { backgroundColor: colors.background.primary }]}>
            <View style={excludeModalStyles.header}>
              <Text style={[excludeModalStyles.title, { color: colors.text.primary }]}>
                Don&apos;t Track This Bill?
              </Text>
              <Text style={[excludeModalStyles.subtitle, { color: colors.text.secondary }]}>
                {billToExclude?.merchant} • £{Math.abs(billToExclude?.amount || 0).toFixed(2)}
              </Text>
            </View>

            <View style={excludeModalStyles.options}>
              <TouchableOpacity
                style={[excludeModalStyles.option, { backgroundColor: colors.background.secondary }]}
                onPress={() => handleExcludeBill('not_recurring')}
              >
                <Ionicons name="close-circle" size={24} color="#F59E0B" />
                <View style={excludeModalStyles.optionText}>
                  <Text style={[excludeModalStyles.optionTitle, { color: colors.text.primary }]}>
                    This isn&apos;t a recurring bill
                  </Text>
                  <Text style={[excludeModalStyles.optionDescription, { color: colors.text.secondary }]}>
                    It&apos;s a one-time purchase or varies too much
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[excludeModalStyles.option, { backgroundColor: colors.background.secondary }]}
                onPress={() => handleExcludeBill('no_longer_active')}
              >
                <Ionicons name="pause-circle" size={24} color="#EF4444" />
                <View style={excludeModalStyles.optionText}>
                  <Text style={[excludeModalStyles.optionTitle, { color: colors.text.primary }]}>
                    I don&apos;t pay this anymore
                  </Text>
                  <Text style={[excludeModalStyles.optionDescription, { color: colors.text.secondary }]}>
                    Cancelled subscription or ended service
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[excludeModalStyles.option, { backgroundColor: colors.background.secondary }]}
                onPress={() => handleExcludeBill('incorrect_detection')}
              >
                <Ionicons name="warning" size={24} color="#8B5CF6" />
                <View style={excludeModalStyles.optionText}>
                  <Text style={[excludeModalStyles.optionTitle, { color: colors.text.primary }]}>
                    This was detected incorrectly
                  </Text>
                  <Text style={[excludeModalStyles.optionDescription, { color: colors.text.secondary }]}>
                    Not actually a bill I want to track
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[excludeModalStyles.cancelButton, { borderColor: colors.primary[500] }]}
              onPress={() => setExcludeModalVisible(false)}
            >
              <Text style={[excludeModalStyles.cancelText, { color: colors.primary[500] }]}>
                Keep Tracking This Bill
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["2xl"],
  },
  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSizes["3xl"],
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.base,
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 0,
  },
  upcomingButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    gap: 4,
  },
  upcomingButtonText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "600" as const,
  },
  transactionsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    gap: 4,
  },
  transactionsButtonText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "600" as const,
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["4xl"],
  },
  loadingText: {
    fontSize: typography.fontSizes.base,
    fontWeight: "500" as const,
  },
  // Empty States
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.base,
    textAlign: "center" as const,
    marginBottom: spacing.xl,
    lineHeight: typography.fontSizes.base * 1.5,
  },
  connectButton: {
    borderRadius: borderRadius["2xl"],
    overflow: "hidden",
  },
  connectButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  connectButtonText: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    color: "white",
  },
  emptyBillsState: {
    alignItems: "center",
    paddingVertical: spacing["3xl"],
    paddingHorizontal: spacing.xl,
  },
  emptyBillsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyBillsTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginBottom: spacing.sm,
  },
  emptyBillsSubtitle: {
    fontSize: typography.fontSizes.base,
    textAlign: "center" as const,
    lineHeight: typography.fontSizes.base * 1.5,
  },
  // Stats
  statsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius["2xl"],
    padding: spacing.lg,
    alignItems: "center",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "800" as const,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
  // Categories
  categorySection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  categoryScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  categoryChipText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
  },
  // Bills
  billsSection: {
    paddingHorizontal: spacing.lg,
  },
  billCount: {
    fontSize: typography.fontSizes.base,
    fontWeight: "500" as const,
  },
  categoryGroup: {
    marginBottom: spacing.lg,
  },
  categoryGroupTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  billCard: {
    borderRadius: borderRadius["2xl"],
    marginBottom: spacing.md,
    overflow: "hidden",
    position: "relative",
  },
  urgencyBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: borderRadius["2xl"],
    borderBottomLeftRadius: borderRadius["2xl"],
  },
  urgencyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: "600",
  },
  billCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
  },
  billIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  billDetails: {
    flex: 1,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  billName: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    flex: 1,
  },
  billHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  billAmountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  billMenuButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  billAmount: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
  },
  billFrequency: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "500" as const,
  },
  billMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  billBank: {
    fontSize: typography.fontSizes.sm,
    flex: 1,
  },
  billStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "500" as const,
  },
  confidenceBar: {
    height: 3,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 1.5,
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 1.5,
  },
  // Floating Action Button
  fabButton: {
    position: "absolute",
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

// Styles for the user-friendly exclusion modal
const excludeModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  options: {
    gap: 12,
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 18,
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});