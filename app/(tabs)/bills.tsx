import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { getTransactions } from "../../services/dataSource";
import BillTrackingAlgorithm, { DetectedBill, Transaction } from "../../services/billTrackingAlgorithm";
import * as BillPreferencesAPI from "../../services/billPreferencesAPI";
import dayjs from "dayjs";

const { width } = Dimensions.get("window");

export default function BillsScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { isLoggedIn: authLoggedIn, hasBank, checkingBank } = useAuthGuard(undefined, true);
  const { colors } = useTheme();
  const { showSuccess, showError } = useAlert();

  const [bills, setBills] = useState<DetectedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    { name: "All", icon: "apps-outline", color: colors.primary[500] },
    { name: "Subscriptions", icon: "play-circle-outline", color: colors.secondary?.[500] || colors.primary[500] },
    { name: "Utilities", icon: "flash-outline", color: colors.warning?.[500] || colors.primary[500] },
    { name: "Insurance", icon: "shield-checkmark-outline", color: colors.success?.[500] || colors.primary[500] },
    { name: "Housing", icon: "home-outline", color: colors.primary[500] },
    { name: "Transportation", icon: "car-outline", color: colors.secondary?.[500] || colors.primary[500] },
    { name: "Inactive", icon: "pause-circle-outline", color: colors.text.secondary },
  ];

  const fetchBills = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      // Fetch transactions from the last 12 months for pattern analysis
      const startDate = dayjs().subtract(12, 'months').format('YYYY-MM-DD');
      const endDate = dayjs().format('YYYY-MM-DD');
      
      const transactionsData = await getTransactions();
      console.log(`[Bills] Raw transactions data:`, transactionsData?.length || 0, 'transactions');
      
      if (transactionsData && transactionsData.length > 0) {
        console.log(`[Bills] Sample transaction:`, transactionsData[0]);
        // Convert to our Transaction interface
        // IMPORTANT: Keep original amount sign for bill detection (negative = spending)
        const transactions: Transaction[] = transactionsData.map((tx: any) => ({
          id: tx.id || tx.transaction_id,
          amount: tx.amount || 0, // Keep negative amounts for spending detection
          description: tx.description || tx.merchant_name || 'Unknown',
          date: tx.date || tx.timestamp,
          merchant: tx.merchant_name || tx.description || 'Unknown Merchant',
          category: tx.category,
          accountId: tx.account_id || 'unknown',
          bankName: tx.bank_name || 'Unknown Bank',
          type: (tx.amount || 0) < 0 ? 'debit' : 'credit',
        }));

        // Run bill detection algorithm
        console.log(`[Bills] Processing ${transactions.length} transactions for bill detection`);
        
        // Debug: Analyze transaction data structure
        const merchantCounts = transactions.reduce((acc, tx) => {
          const merchant = tx.merchant || 'Unknown';
          acc[merchant] = (acc[merchant] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log(`[Bills] Transactions by merchant:`, merchantCounts);
        console.log(`[Bills] Sample transactions:`, transactions.slice(0, 3).map(tx => ({
          merchant: tx.merchant,
          amount: tx.amount,
          description: tx.description,
          date: tx.date,
          type: tx.type
        })));
        
        // Debug: Check for spending transactions (negative amounts)
        const spendingTransactions = transactions.filter(tx => tx.amount < 0);
        console.log(`[Bills] Spending transactions: ${spendingTransactions.length}/${transactions.length}`);
        
        const algorithm = new BillTrackingAlgorithm(transactions);
        const detectedBills = algorithm.detectBills();
        
        console.log(`[Bills] Detected ${detectedBills.length} bills:`, detectedBills.map(b => `${b.merchant}: £${Math.abs(b.amount)}`));
        
        // TEMPORARY: Show debug info on screen if no bills found
        if (detectedBills.length === 0 && transactions.length > 0) {
          console.log(`[Bills] DEBUG: No bills detected from ${transactions.length} transactions`);
          console.log(`[Bills] DEBUG: Merchants with multiple transactions:`, 
            Object.entries(merchantCounts).filter(([_, count]) => count >= 2)
          );
        }
        
        let finalBills = detectedBills;
        
        // Try to fetch user preferences, but don't fail if it doesn't work
        try {
          console.log(`[Bills] Attempting to fetch user preferences...`);
          const userPreferences = await BillPreferencesAPI.getBillPreferences();
          const mergedBills = BillPreferencesAPI.mergeBillsWithPreferences(detectedBills, userPreferences);
          console.log(`[Bills] Successfully merged with ${userPreferences.length} user preferences`);
          finalBills = mergedBills;
          setBills(mergedBills);
        } catch (error) {
          console.log(`[Bills] Bill preferences API not available yet, using detected bills only:`, error instanceof Error ? error.message : String(error));
          setBills(detectedBills);
        }
        
        if (showRefresh) {
          showSuccess(`Found ${finalBills.length} recurring bills`);
        }
      } else {
        console.log(`[Bills] No transactions found - cannot analyze bills`);
        setBills([]);
        if (showRefresh) {
          showError("No transaction data available for bill analysis");
        }
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
  };

  const onRefresh = () => {
    fetchBills(true);
  };

  useEffect(() => {
    if (!authLoggedIn) {
      router.replace("/auth/Login");
    }
  }, [authLoggedIn, hasBank, checkingBank]);

  useEffect(() => {
    // Always try to fetch bills if user is logged in
    // Even if bank connection is expired, we should show cached data from DynamoDB
    if (isLoggedIn) {
      fetchBills();
    }
  }, [isLoggedIn]);

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

  const billsByCategory = useMemo(() => {
    return BillTrackingAlgorithm.getBillsByCategory(filteredBills);
  }, [filteredBills]);

  const showBillDetails = (bill: DetectedBill) => {
    Alert.alert(
      bill.name,
      `Amount: £${Math.abs(bill.amount).toFixed(2)}\nFrequency: ${bill.frequency}\nNext Due: ${dayjs(bill.nextDueDate).format('MMM DD, YYYY')}\nBank: ${bill.bankName}\nConfidence: ${(bill.confidence * 100).toFixed(0)}%\nStatus: ${bill.status}`,
      [
        { text: "View Transactions", onPress: () => router.push(`/transactions?merchant=${encodeURIComponent(bill.merchant)}`) },
        { text: "OK", style: "default" }
      ]
    );
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
          text: "Remove Bill", 
          onPress: () => confirmRemoveBill(bill),
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
      const preference = BillPreferencesAPI.createPreferenceFromBill(bill, { 
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

  if (!authLoggedIn || checkingBank) {
    return null;
  }

  // Only show "Connect Bank" if we have no bills AND no bank connection
  // This allows showing cached data even when bank connection is expired
  if (!hasBank && bills.length === 0 && !loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary[100] }]}>
            <Ionicons name="link-outline" size={48} color={colors.primary[500]} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            Connect Your Bank
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
            Connect your bank account to automatically detect and track your recurring bills and subscriptions
          </Text>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => router.push("/banks")}
          >
            <LinearGradient
              colors={[colors.primary[500], colors.secondary?.[500] || colors.primary[600]]}
              style={styles.connectButtonGradient}
            >
              <Text style={styles.connectButtonText}>Connect Bank</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
                Bills & Subscriptions
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
                AI-powered bill tracking
              </Text>
            </View>
            <View style={styles.headerActions}>
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
              <View style={styles.emptyBillsState}>
                <View style={[styles.emptyBillsIcon, { backgroundColor: colors.primary[100] }]}>
                  <Ionicons name="receipt-outline" size={32} color={colors.primary[500]} />
                </View>
                <Text style={[styles.emptyBillsTitle, { color: colors.text.primary }]}>
                  No Bills Found
                </Text>
                <Text style={[styles.emptyBillsSubtitle, { color: colors.text.secondary }]}>
                  {selectedCategory === "All" 
                    ? "We couldn't detect any recurring bills. Make sure you have enough transaction history."
                    : `No bills found in the ${selectedCategory} category.`
                  }
                </Text>
              </View>
            ) : (
              <View style={styles.billsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  {selectedCategory === "All" ? "All Bills" : selectedCategory}
                  <Text style={[styles.billCount, { color: colors.text.secondary }]}>
                    {" "}({filteredBills.length})
                  </Text>
                </Text>

                {Object.entries(billsByCategory).map(([category, categoryBills]) => (
                  <View key={category} style={styles.categoryGroup}>
                    {selectedCategory === "All" && (
                      <Text style={[styles.categoryGroupTitle, { color: colors.text.secondary }]}>
                        {category}
                      </Text>
                    )}
                    {categoryBills.map((bill) => (
                      <TouchableOpacity
                        key={bill.id}
                        style={[styles.billCard, { backgroundColor: colors.background.primary, ...shadows.sm }]}
                        onPress={() => showBillDetails(bill)}
                        onLongPress={() => showBillManagement(bill)}
                        delayLongPress={500}
                      >
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
                              <Text style={[styles.billBank, { color: colors.text.secondary }]}>
                                {bill.bankName} • Next: {dayjs(bill.nextDueDate).format('MMM DD')}
                              </Text>
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
                    ))}
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
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
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
    gap: spacing.sm,
  },
  transactionsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    gap: spacing.xs,
  },
  transactionsButtonText: {
    fontSize: typography.fontSizes.sm,
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
  connectButtonGradient: {
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