import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { useTheme } from '../contexts/ThemeContext';
import { autoBillDetection } from '../services/automaticBillDetection';
import { DetectedBill } from '../services/billTrackingAlgorithm';
import { BillPreferencesAPI } from '../services/api/billPreferencesAPI';
import { TabLoadingScreen } from '../components/ui';
import { useAlert } from '../hooks/useAlert';

const { width } = Dimensions.get('window');

interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  nextPaymentDate: string;
  daysUntilDue: number;
  merchant: string;
  category: string;
  status: 'active' | 'cancelled';
}

export default function UpcomingBillsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showSuccess, showError } = useAlert();

  const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [excludeModalVisible, setExcludeModalVisible] = useState(false);
  const [billToExclude, setBillToExclude] = useState<UpcomingBill | null>(null);

  const loadUpcomingBills = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Get all detected bills using smart caching
      const detectedBills = isRefresh ?
        await autoBillDetection.triggerBillDetection(true) : // Force refresh on manual refresh
        await autoBillDetection.getBillsWithSmartCaching(); // Use smart caching for normal loads
      console.log('[UpcomingBills] Detected bills:', detectedBills.length, detectedBills.map(b => ({
        name: b.name,
        merchant: b.merchant,
        status: b.status,
        frequency: b.frequency,
        nextDueDate: b.nextDueDate,
        lastPaymentDate: b.lastPaymentDate,
        confidence: b.confidence
      })));

      // Filter and process bills for next 30 days
      const now = dayjs();
      const thirtyDaysFromNow = now.add(30, 'days');

      const upcoming: UpcomingBill[] = detectedBills
        .filter(bill => bill.status === 'active') // Only active bills
        .map(bill => {
          // Calculate next payment date based on bill's prediction
          let lastDate = dayjs(bill.lastPaymentDate);
          let nextPaymentDate = dayjs(bill.nextDueDate || bill.lastPaymentDate);

          // If we don't have a future due date, calculate based on last payment + frequency
          if (nextPaymentDate.isBefore(now) || nextPaymentDate.isSame(lastDate)) {
            // Start from last payment and add the frequency interval
            nextPaymentDate = lastDate;

            // Add intervals based on bill frequency until we get a future date
            while (nextPaymentDate.isBefore(now)) {
              switch (bill.frequency) {
                case 'weekly':
                  nextPaymentDate = nextPaymentDate.add(1, 'week');
                  break;
                case 'monthly':
                  nextPaymentDate = nextPaymentDate.add(1, 'month');
                  break;
                case 'quarterly':
                  nextPaymentDate = nextPaymentDate.add(3, 'months');
                  break;
                case 'yearly':
                  nextPaymentDate = nextPaymentDate.add(1, 'year');
                  break;
                default:
                  nextPaymentDate = nextPaymentDate.add(1, 'month'); // Default to monthly
              }
            }
          }

          const daysUntilDue = nextPaymentDate.diff(now, 'days');

          const result = {
            id: bill.id || `bill-${bill.merchant}`,
            name: bill.name || bill.merchant,
            amount: Math.abs(bill.amount),
            nextPaymentDate: nextPaymentDate.format('YYYY-MM-DD'),
            daysUntilDue,
            merchant: bill.merchant,
            category: bill.category || 'Other',
            status: bill.status as 'active' | 'cancelled'
          };

          // Debug individual bill mapping if needed
          if (result.daysUntilDue <= 30) {
            console.log('[UpcomingBills] Found upcoming bill:', {
              name: result.name,
              nextPaymentDate: result.nextPaymentDate,
              daysUntilDue: result.daysUntilDue
            });
          }

          return result;
        })
        .filter(bill => {
          const paymentDate = dayjs(bill.nextPaymentDate);
          const isAfterNow = paymentDate.isAfter(now);
          const isBefore30Days = paymentDate.isBefore(thirtyDaysFromNow);
          const isInNext30Days = isAfterNow && isBefore30Days;

          // Log only if bill passes the filter
          if (isInNext30Days) {
            console.log('[UpcomingBills] Bill passes filter:', bill.name, 'due in', bill.daysUntilDue, 'days');
          }

          // Show bills due in next 30 days
          return isInNext30Days;
        })
        .sort((a, b) => a.daysUntilDue - b.daysUntilDue); // Sort by closest due date first

      console.log('[UpcomingBills] Active bills after filtering:', detectedBills.filter(bill => bill.status === 'active').length);
      console.log('[UpcomingBills] Upcoming bills in next 30 days:', upcoming.length, upcoming.map(b => ({
        name: b.name,
        nextPaymentDate: b.nextPaymentDate,
        daysUntilDue: b.daysUntilDue
      })));

      setUpcomingBills(upcoming);

    } catch (error) {
      console.error('Error loading upcoming bills:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUpcomingBills();
  }, []);

  const onRefresh = () => {
    loadUpcomingBills(true);
  };

  const handleExcludeBill = useCallback(async (reason: 'not_recurring' | 'no_longer_active' | 'incorrect_detection') => {
    if (!billToExclude) return;

    try {
      await BillPreferencesAPI.excludeBill({
        merchant: billToExclude.merchant,
        amount: billToExclude.amount,
        category: billToExclude.category,
        reason
      });

      setUpcomingBills(prevBills => prevBills.filter(bill => bill.id !== billToExclude.id));
      setExcludeModalVisible(false);
      setBillToExclude(null);
      showSuccess('Bill excluded from tracking');
    } catch (error) {
      console.error('Error excluding bill:', error);
      showError('Failed to exclude bill');
    }
  }, [billToExclude, showSuccess, showError]);

  const openExcludeModal = useCallback((bill: UpcomingBill) => {
    console.log('openExcludeModal called with bill:', bill.name);
    setBillToExclude(bill);
    setExcludeModalVisible(true);
    console.log('Modal should be visible now');
  }, []);

  const getBillIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'utilities':
      case 'housing':
        return 'flash';
      case 'subscriptions':
        return 'play-circle';
      case 'insurance':
        return 'shield-checkmark';
      case 'transport':
        return 'car';
      default:
        return 'receipt';
    }
  };

  const getBillColor = (daysUntilDue: number) => {
    if (daysUntilDue <= 3) return '#EF4444'; // Red - urgent
    if (daysUntilDue <= 7) return '#F59E0B'; // Orange - soon
    return colors.primary.main; // Blue - normal
  };

  const getDaysText = (days: number) => {
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTotalUpcoming = () => {
    return upcomingBills.reduce((total, bill) => total + bill.amount, 0);
  };

  if (loading) {
    return <TabLoadingScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Upcoming Bills
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      >
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.summaryContent}>
            <View>
              <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                Next 30 Days
              </Text>
              <Text style={[styles.summaryAmount, { color: colors.text.primary }]}>
                {formatAmount(getTotalUpcoming())}
              </Text>
            </View>
            <View style={styles.summaryIconContainer}>
              <View style={[styles.summaryIcon, { backgroundColor: colors.primary.main }]}>
                <Ionicons name="calendar" size={24} color="white" />
              </View>
            </View>
          </View>
          <Text style={[styles.summarySubtext, { color: colors.text.tertiary }]}>
            {upcomingBills.length} bills due
          </Text>
        </View>

        {/* Bills List */}
        {upcomingBills.length > 0 ? (
          <View style={styles.billsList}>
            {upcomingBills.map((bill) => (
              <TouchableOpacity
                key={bill.id}
                style={[
                  styles.billCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderLeftColor: getBillColor(bill.daysUntilDue),
                  }
                ]}
                onPress={() => {
                  console.log('Bill tapped:', bill.name);
                  openExcludeModal(bill);
                }}
                onLongPress={() => {
                  console.log('Bill long pressed:', bill.name);
                  openExcludeModal(bill);
                }}
                delayLongPress={800}
                activeOpacity={0.7}
              >
                <View style={styles.billRow}>
                  <View style={styles.billLeft}>
                    <View
                      style={[
                        styles.billIconContainer,
                        { backgroundColor: getBillColor(bill.daysUntilDue) + '20' }
                      ]}
                    >
                      <Ionicons
                        name={getBillIcon(bill.category)}
                        size={20}
                        color={getBillColor(bill.daysUntilDue)}
                      />
                    </View>
                    <View style={styles.billInfo}>
                      <Text style={[styles.billName, { color: colors.text.primary }]}>
                        {bill.name}
                      </Text>
                      <Text style={[styles.billDate, { color: colors.text.secondary }]}>
                        {dayjs(bill.nextPaymentDate).format('MMM DD, YYYY')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.billRight}>
                    <Text style={[styles.billAmount, { color: colors.text.primary }]}>
                      {formatAmount(bill.amount)}
                    </Text>
                    <Text
                      style={[
                        styles.billDays,
                        { color: getBillColor(bill.daysUntilDue) }
                      ]}
                    >
                      {getDaysText(bill.daysUntilDue)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="calendar-outline" size={48} color={colors.text.tertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No upcoming bills
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
              You don&apos;t have any bills due in the next 30 days.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Exclude Bill Modal */}
      <Modal
        visible={excludeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setExcludeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Remove Bill
              </Text>
              <TouchableOpacity
                onPress={() => setExcludeModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {billToExclude && (
              <View style={styles.modalBillInfo}>
                <Text style={[styles.modalBillName, { color: colors.text.primary }]}>
                  {billToExclude.name}
                </Text>
                <Text style={[styles.modalBillAmount, { color: colors.text.secondary }]}>
                  {formatAmount(billToExclude.amount)}
                </Text>
              </View>
            )}

            <Text style={[styles.modalDescription, { color: colors.text.secondary }]}>
              Why would you like to remove this bill from tracking?
            </Text>

            <View style={styles.exclusionOptions}>
              <TouchableOpacity
                style={[styles.exclusionOption, { backgroundColor: colors.background.secondary }]}
                onPress={() => handleExcludeBill('not_recurring')}
              >
                <View style={styles.exclusionOptionIcon}>
                  <Ionicons name="repeat-outline" size={24} color={colors.primary.main} />
                </View>
                <View style={styles.exclusionOptionText}>
                  <Text style={[styles.exclusionOptionTitle, { color: colors.text.primary }]}>
                    Not a recurring bill
                  </Text>
                  <Text style={[styles.exclusionOptionDesc, { color: colors.text.tertiary }]}>
                    This was a one-time payment
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exclusionOption, { backgroundColor: colors.background.secondary }]}
                onPress={() => handleExcludeBill('no_longer_active')}
              >
                <View style={styles.exclusionOptionIcon}>
                  <Ionicons name="stop-circle-outline" size={24} color={colors.primary.main} />
                </View>
                <View style={styles.exclusionOptionText}>
                  <Text style={[styles.exclusionOptionTitle, { color: colors.text.primary }]}>
                    No longer active
                  </Text>
                  <Text style={[styles.exclusionOptionDesc, { color: colors.text.tertiary }]}>
                    I don&apos;t pay this bill anymore
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exclusionOption, { backgroundColor: colors.background.secondary }]}
                onPress={() => handleExcludeBill('incorrect_detection')}
              >
                <View style={styles.exclusionOptionIcon}>
                  <Ionicons name="alert-circle-outline" size={24} color={colors.primary.main} />
                </View>
                <View style={styles.exclusionOptionText}>
                  <Text style={[styles.exclusionOptionTitle, { color: colors.text.primary }]}>
                    Incorrect detection
                  </Text>
                  <Text style={[styles.exclusionOptionDesc, { color: colors.text.tertiary }]}>
                    This shouldn&apos;t be tracked as a bill
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700',
  },
  summaryIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summarySubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  billsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  billCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  billLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  billIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  billDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  billRight: {
    alignItems: 'flex-end',
  },
  billAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  billDays: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBillInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalBillName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalBillAmount: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalDescription: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  exclusionOptions: {
    gap: 12,
  },
  exclusionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  exclusionOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  exclusionOptionText: {
    flex: 1,
  },
  exclusionOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  exclusionOptionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});