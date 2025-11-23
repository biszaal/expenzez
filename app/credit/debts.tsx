import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius } from '../../constants/theme';
import { creditAPI, Debt } from '../../services/api/creditAPI';

const DEBT_TYPES = ['Personal Loan', 'Student Loan', 'Mortgage', 'Car Loan', 'Other'] as const;

export default function DebtsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Form state
  const [debtName, setDebtName] = useState('');
  const [debtType, setDebtType] = useState<typeof DEBT_TYPES[number]>('Personal Loan');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const data = await creditAPI.getDebts();
      setDebts(data.debts || []);
    } catch (error) {
      console.error('[Debts] Error loading debts:', error);
      Alert.alert('Error', 'Failed to load debts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (debt?: Debt) => {
    if (debt) {
      setEditingDebt(debt);
      setDebtName(debt.debtName);
      setDebtType(debt.debtType);
      setTotalAmount(debt.totalAmount.toString());
      setRemainingAmount(debt.remainingAmount.toString());
      setInterestRate(debt.interestRate.toString());
      setMonthlyPayment(debt.monthlyPayment.toString());
      setDueDate(debt.dueDate?.toString() || '');
      setLenderName(debt.lenderName || '');
      setStartDate(debt.startDate || '');
      setEndDate(debt.endDate || '');
    } else {
      setEditingDebt(null);
      resetForm();
    }
    setModalVisible(true);
  };

  const resetForm = () => {
    setDebtName('');
    setDebtType('Personal Loan');
    setTotalAmount('');
    setRemainingAmount('');
    setInterestRate('');
    setMonthlyPayment('');
    setDueDate('');
    setLenderName('');
    setStartDate('');
    setEndDate('');
  };

  const handleSaveDebt = async () => {
    // Validation
    if (!debtName.trim()) {
      Alert.alert('Validation Error', 'Please enter a debt name');
      return;
    }

    const totalNum = parseFloat(totalAmount);
    const remainingNum = parseFloat(remainingAmount);
    const rateNum = parseFloat(interestRate);
    const paymentNum = parseFloat(monthlyPayment);

    if (isNaN(totalNum) || totalNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid total amount');
      return;
    }

    if (isNaN(remainingNum) || remainingNum < 0 || remainingNum > totalNum) {
      Alert.alert('Validation Error', 'Remaining amount must be between 0 and total amount');
      return;
    }

    if (isNaN(rateNum) || rateNum < 0) {
      Alert.alert('Validation Error', 'Please enter a valid interest rate');
      return;
    }

    if (isNaN(paymentNum) || paymentNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid monthly payment');
      return;
    }

    try {
      const debtData: any = {
        debtName: debtName.trim(),
        debtType,
        totalAmount: totalNum,
        remainingAmount: remainingNum,
        interestRate: rateNum,
        monthlyPayment: paymentNum,
      };

      if (editingDebt) {
        debtData.debtId = editingDebt.debtId;
      }

      if (dueDate) {
        const dateNum = parseInt(dueDate);
        if (!isNaN(dateNum) && dateNum >= 1 && dateNum <= 31) {
          debtData.dueDate = dateNum;
        }
      }

      if (lenderName.trim()) {
        debtData.lenderName = lenderName.trim();
      }

      if (startDate) {
        debtData.startDate = startDate;
      }

      if (endDate) {
        debtData.endDate = endDate;
      }

      await creditAPI.saveDebt(debtData);
      await loadDebts();
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', `Debt ${editingDebt ? 'updated' : 'added'} successfully`);
    } catch (error: any) {
      console.error('[Debts] Error saving debt:', error);
      Alert.alert('Error', error.message || 'Failed to save debt');
    }
  };

  const getDebtColor = (type: string): string => {
    switch (type) {
      case 'Personal Loan':
        return '#3B82F6';
      case 'Student Loan':
        return '#8B5CF6';
      case 'Mortgage':
        return '#EC4899';
      case 'Car Loan':
        return '#10B981';
      case 'Other':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Debts</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  const totalDebt = debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const totalMonthlyPayments = debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Debts</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleOpenModal()}
          style={[styles.addButton, { backgroundColor: `${colors.primary.main}15` }]}
        >
          <Ionicons name="add" size={24} color={colors.primary.main} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Debt Summary */}
        {debts.length > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.summaryHeader}>
              <View style={[styles.summaryIcon, { backgroundColor: `${colors.primary.main}15` }]}>
                <Ionicons name="receipt-outline" size={24} color={colors.primary.main} />
              </View>
              <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
                Total Debt Overview
              </Text>
            </View>

            <View style={styles.summaryMetrics}>
              <View style={styles.summaryMetric}>
                <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
                  Total Debt
                </Text>
                <Text style={[styles.metricValue, { color: colors.error.main }]}>
                  £{totalDebt.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryMetric}>
                <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
                  Monthly Payments
                </Text>
                <Text style={[styles.metricValue, { color: colors.text.primary }]}>
                  £{totalMonthlyPayments.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryMetric}>
                <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
                  Number of Debts
                </Text>
                <Text style={[styles.metricValue, { color: colors.text.primary }]}>
                  {debts.length}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Debts List */}
        <View style={styles.debtsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your Debts</Text>

          {debts.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="wallet-outline" size={48} color={colors.text.tertiary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
                No Debts Tracked
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
                Add your debts to track payment progress and improve financial health
              </Text>
              <TouchableOpacity
                style={[styles.emptyStateButton, { backgroundColor: colors.primary.main }]}
                onPress={() => handleOpenModal()}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.emptyStateButtonText}>Add Debt</Text>
              </TouchableOpacity>
            </View>
          ) : (
            debts.map((debt) => {
              const debtColor = getDebtColor(debt.debtType);
              const monthsToPayoff =
                debt.monthlyPayment > 0
                  ? Math.ceil(debt.remainingAmount / debt.monthlyPayment)
                  : 0;
              const yearsToPayoff = monthsToPayoff > 0 ? monthsToPayoff / 12 : 0;

              return (
                <TouchableOpacity
                  key={debt.debtId}
                  style={[styles.debtItem, { backgroundColor: colors.background.secondary }]}
                  onPress={() => handleOpenModal(debt)}
                  activeOpacity={0.7}
                >
                  <View style={styles.debtItemHeader}>
                    <View style={styles.debtItemLeft}>
                      <View style={[styles.debtIcon, { backgroundColor: `${debtColor}15` }]}>
                        <Ionicons name="wallet" size={24} color={debtColor} />
                      </View>
                      <View style={styles.debtInfo}>
                        <Text style={[styles.debtName, { color: colors.text.primary }]}>
                          {debt.debtName}
                        </Text>
                        <Text style={[styles.debtType, { color: debtColor }]}>
                          {debt.debtType}
                        </Text>
                        {debt.lenderName && (
                          <Text style={[styles.debtLender, { color: colors.text.tertiary }]}>
                            {debt.lenderName}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={[styles.progressLabel, { color: colors.text.secondary }]}>
                        Progress
                      </Text>
                      <Text style={[styles.progressPercent, { color: colors.text.primary }]}>
                        {debt.paymentProgress.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: `${debtColor}20` }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${debt.paymentProgress}%`,
                            backgroundColor: debtColor,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Metrics */}
                  <View style={styles.debtMetrics}>
                    <View style={styles.debtMetric}>
                      <Text style={[styles.debtMetricLabel, { color: colors.text.secondary }]}>
                        Remaining
                      </Text>
                      <Text style={[styles.debtMetricValue, { color: colors.error.main }]}>
                        £{debt.remainingAmount.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.debtMetric}>
                      <Text style={[styles.debtMetricLabel, { color: colors.text.secondary }]}>
                        Monthly
                      </Text>
                      <Text style={[styles.debtMetricValue, { color: colors.text.primary }]}>
                        £{debt.monthlyPayment.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.debtMetric}>
                      <Text style={[styles.debtMetricLabel, { color: colors.text.secondary }]}>
                        Interest
                      </Text>
                      <Text style={[styles.debtMetricValue, { color: colors.text.primary }]}>
                        {debt.interestRate}%
                      </Text>
                    </View>
                  </View>

                  {/* Payoff Timeline */}
                  {monthsToPayoff > 0 && (
                    <View style={[styles.payoffTimeline, { backgroundColor: `${debtColor}10` }]}>
                      <Ionicons name="calendar-outline" size={16} color={debtColor} />
                      <Text style={[styles.payoffText, { color: colors.text.secondary }]}>
                        {yearsToPayoff >= 1
                          ? `${yearsToPayoff.toFixed(1)} years to pay off`
                          : `${monthsToPayoff} months to pay off`}
                      </Text>
                    </View>
                  )}

                  {/* Additional Details */}
                  {debt.dueDate && (
                    <View style={styles.debtFooter}>
                      <View style={styles.debtDetail}>
                        <Ionicons
                          name="alert-circle-outline"
                          size={14}
                          color={colors.text.tertiary}
                        />
                        <Text style={[styles.debtDetailText, { color: colors.text.secondary }]}>
                          Due: {debt.dueDate}
                          {debt.dueDate === 1
                            ? 'st'
                            : debt.dueDate === 2
                            ? 'nd'
                            : debt.dueDate === 3
                            ? 'rd'
                            : 'th'}{' '}
                          of each month
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Debt Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="overFullScreen"
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={[styles.modalContent, { backgroundColor: colors.background.primary }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Handle */}
            <View style={styles.modalHandle}>
              <View style={[styles.modalHandleLine, { backgroundColor: colors.text.tertiary }]} />
            </View>

            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                  {editingDebt ? 'Edit Debt' : 'Add Debt'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.text.secondary }]}>
                  Track your debt repayment progress
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close-circle" size={28} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Debt Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                  Debt Name <Text style={{ color: colors.error.main }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background.secondary,
                      color: colors.text.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                  value={debtName}
                  onChangeText={setDebtName}
                  placeholder="e.g., Student Loan"
                  placeholderTextColor={colors.text.tertiary}
                />
              </View>

              {/* Debt Type */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                  Debt Type <Text style={{ color: colors.error.main }}>*</Text>
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.typeSelector}
                >
                  {DEBT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor:
                            debtType === type
                              ? colors.primary.main
                              : colors.background.secondary,
                        },
                      ]}
                      onPress={() => setDebtType(type)}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          {
                            color: debtType === type ? '#FFFFFF' : colors.text.primary,
                          },
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Total and Remaining Amount Row */}
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                    Total Amount <Text style={{ color: colors.error.main }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary,
                        borderColor: colors.border.light,
                      },
                    ]}
                    value={totalAmount}
                    onChangeText={setTotalAmount}
                    placeholder="0.00"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                    Remaining <Text style={{ color: colors.error.main }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary,
                        borderColor: colors.border.light,
                      },
                    ]}
                    value={remainingAmount}
                    onChangeText={setRemainingAmount}
                    placeholder="0.00"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Interest Rate and Monthly Payment Row */}
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                    Interest Rate (%) <Text style={{ color: colors.error.main }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary,
                        borderColor: colors.border.light,
                      },
                    ]}
                    value={interestRate}
                    onChangeText={setInterestRate}
                    placeholder="0.0"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                    Monthly Payment <Text style={{ color: colors.error.main }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary,
                        borderColor: colors.border.light,
                      },
                    ]}
                    value={monthlyPayment}
                    onChangeText={setMonthlyPayment}
                    placeholder="0.00"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Optional Fields */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                  Lender Name (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background.secondary,
                      color: colors.text.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                  value={lenderName}
                  onChangeText={setLenderName}
                  placeholder="e.g., Bank of America"
                  placeholderTextColor={colors.text.tertiary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                  Payment Due Date (Day of Month)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background.secondary,
                      color: colors.text.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="1-31"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { borderColor: colors.border.medium },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text.primary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  { backgroundColor: colors.primary.main },
                ]}
                onPress={handleSaveDebt}
              >
                <Text style={styles.saveButtonText}>
                  {editingDebt ? 'Update Debt' : 'Add Debt'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },

  // Summary Card
  summaryCard: {
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryMetric: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
  },

  // Debts Section
  debtsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.lg,
    letterSpacing: 0.3,
  },

  // Empty State
  emptyState: {
    borderRadius: 16,
    padding: spacing.xl * 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 21,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Debt Item
  debtItem: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  debtItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  debtItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  debtIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtInfo: {
    flex: 1,
  },
  debtName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  debtType: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  debtLender: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  debtMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginBottom: spacing.md,
  },
  debtMetric: {
    flex: 1,
    alignItems: 'center',
  },
  debtMetricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  debtMetricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  payoffTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  payoffText: {
    fontSize: 13,
    fontWeight: '600',
  },
  debtFooter: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  debtDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  debtDetailText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl + 20,
    paddingTop: spacing.sm,
    maxHeight: '90%',
  },
  modalHandle: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  modalHandleLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  modalClose: {
    marginLeft: spacing.sm,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  modalBody: {
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 2,
    borderRadius: 14,
    padding: spacing.lg,
    fontSize: 16,
    fontWeight: '600',
  },
  typeSelector: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  typeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
