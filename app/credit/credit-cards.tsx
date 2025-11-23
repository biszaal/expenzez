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
import { creditAPI, CreditCard } from '../../services/api/creditAPI';

export default function CreditCardsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // Form state
  const [cardName, setCardName] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');

  useEffect(() => {
    loadCreditCards();
  }, []);

  const loadCreditCards = async () => {
    try {
      setLoading(true);
      const data = await creditAPI.getCreditCards();
      setCards(data.cards || []);
    } catch (error) {
      console.error('[CreditCards] Error loading cards:', error);
      Alert.alert('Error', 'Failed to load credit cards');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (card?: CreditCard) => {
    if (card) {
      setEditingCard(card);
      setCardName(card.cardName);
      setLastFourDigits(card.lastFourDigits || '');
      setCurrentBalance(card.currentBalance.toString());
      setCreditLimit(card.creditLimit.toString());
      setInterestRate(card.interestRate?.toString() || '');
      setDueDate(card.dueDate?.toString() || '');
      setMinimumPayment(card.minimumPayment?.toString() || '');
    } else {
      setEditingCard(null);
      resetForm();
    }
    setModalVisible(true);
  };

  const resetForm = () => {
    setCardName('');
    setLastFourDigits('');
    setCurrentBalance('');
    setCreditLimit('');
    setInterestRate('');
    setDueDate('');
    setMinimumPayment('');
  };

  const handleSaveCard = async () => {
    // Validation
    if (!cardName.trim()) {
      Alert.alert('Validation Error', 'Please enter a card name');
      return;
    }

    const balanceNum = parseFloat(currentBalance);
    const limitNum = parseFloat(creditLimit);

    if (isNaN(balanceNum) || balanceNum < 0) {
      Alert.alert('Validation Error', 'Please enter a valid current balance');
      return;
    }

    if (isNaN(limitNum) || limitNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid credit limit');
      return;
    }

    try {
      const cardData: any = {
        cardName: cardName.trim(),
        currentBalance: balanceNum,
        creditLimit: limitNum,
      };

      if (editingCard) {
        cardData.cardId = editingCard.cardId;
      }

      if (lastFourDigits.trim()) {
        cardData.lastFourDigits = lastFourDigits.trim();
      }

      if (interestRate) {
        const rateNum = parseFloat(interestRate);
        if (!isNaN(rateNum) && rateNum >= 0) {
          cardData.interestRate = rateNum;
        }
      }

      if (dueDate) {
        const dateNum = parseInt(dueDate);
        if (!isNaN(dateNum) && dateNum >= 1 && dateNum <= 31) {
          cardData.dueDate = dateNum;
        }
      }

      if (minimumPayment) {
        const paymentNum = parseFloat(minimumPayment);
        if (!isNaN(paymentNum) && paymentNum >= 0) {
          cardData.minimumPayment = paymentNum;
        }
      }

      await creditAPI.saveCreditCard(cardData);
      await loadCreditCards();
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', `Credit card ${editingCard ? 'updated' : 'added'} successfully`);
    } catch (error: any) {
      console.error('[CreditCards] Error saving card:', error);
      Alert.alert('Error', error.message || 'Failed to save credit card');
    }
  };

  const calculateUtilization = () => {
    const totalBalance = cards.reduce((sum, card) => sum + card.currentBalance, 0);
    const totalLimit = cards.reduce((sum, card) => sum + card.creditLimit, 0);
    return totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
  };

  const getUtilizationColor = (utilization: number): string => {
    if (utilization < 30) return '#10B981';
    if (utilization < 50) return '#F59E0B';
    if (utilization < 75) return '#EF4444';
    return '#DC2626';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Credit Cards</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  const totalUtilization = calculateUtilization();
  const totalBalance = cards.reduce((sum, card) => sum + card.currentBalance, 0);
  const totalLimit = cards.reduce((sum, card) => sum + card.creditLimit, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Credit Cards</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleOpenModal()}
          style={[styles.addButton, { backgroundColor: `${colors.primary.main}15` }]}
        >
          <Ionicons name="add" size={24} color={colors.primary.main} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Utilization Summary */}
        {cards.length > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.summaryHeader}>
              <View style={[styles.summaryIcon, { backgroundColor: `${colors.primary.main}15` }]}>
                <Ionicons name="analytics-outline" size={24} color={colors.primary.main} />
              </View>
              <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
                Overall Utilization
              </Text>
            </View>

            <View style={styles.utilizationRow}>
              <Text
                style={[
                  styles.utilizationPercent,
                  { color: getUtilizationColor(totalUtilization) },
                ]}
              >
                {totalUtilization.toFixed(1)}%
              </Text>
              <View style={styles.utilizationDetails}>
                <Text style={[styles.utilizationAmount, { color: colors.text.secondary }]}>
                  £{totalBalance.toFixed(2)} / £{totalLimit.toFixed(2)}
                </Text>
                <Text style={[styles.utilizationCards, { color: colors.text.tertiary }]}>
                  {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                </Text>
              </View>
            </View>

            {/* Utilization Status */}
            <View
              style={[
                styles.utilizationStatus,
                {
                  backgroundColor:
                    totalUtilization < 30
                      ? '#D1FAE5'
                      : totalUtilization < 50
                      ? '#FEF3C7'
                      : '#FEE2E2',
                },
              ]}
            >
              <Ionicons
                name={
                  totalUtilization < 30
                    ? 'checkmark-circle'
                    : totalUtilization < 50
                    ? 'alert-circle'
                    : 'warning'
                }
                size={16}
                color={
                  totalUtilization < 30
                    ? '#065F46'
                    : totalUtilization < 50
                    ? '#92400E'
                    : '#991B1B'
                }
              />
              <Text
                style={[
                  styles.utilizationStatusText,
                  {
                    color:
                      totalUtilization < 30
                        ? '#065F46'
                        : totalUtilization < 50
                        ? '#92400E'
                        : '#991B1B',
                  },
                ]}
              >
                {totalUtilization < 30
                  ? 'Excellent - Keep it below 30%'
                  : totalUtilization < 50
                  ? 'Good - Consider reducing to under 30%'
                  : 'High - Pay down balances to improve score'}
              </Text>
            </View>
          </View>
        )}

        {/* Credit Cards List */}
        <View style={styles.cardsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your Cards</Text>

          {cards.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="card-outline" size={48} color={colors.text.tertiary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
                No Credit Cards
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
                Add your credit cards to track utilization and improve your credit score
              </Text>
              <TouchableOpacity
                style={[styles.emptyStateButton, { backgroundColor: colors.primary.main }]}
                onPress={() => handleOpenModal()}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.emptyStateButtonText}>Add Credit Card</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cards.map((card) => {
              const utilization = card.utilizationPercentage;
              const utilizationColor = getUtilizationColor(utilization);

              return (
                <TouchableOpacity
                  key={card.cardId}
                  style={[styles.cardItem, { backgroundColor: colors.background.secondary }]}
                  onPress={() => handleOpenModal(card)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardItemHeader}>
                    <View style={styles.cardItemLeft}>
                      <View
                        style={[styles.cardIcon, { backgroundColor: `${utilizationColor}15` }]}
                      >
                        <Ionicons name="card" size={24} color={utilizationColor} />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={[styles.cardName, { color: colors.text.primary }]}>
                          {card.cardName}
                        </Text>
                        {card.lastFourDigits && (
                          <Text style={[styles.cardLast4, { color: colors.text.tertiary }]}>
                            •••• {card.lastFourDigits}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                  </View>

                  <View style={styles.cardItemBody}>
                    <View style={styles.cardMetric}>
                      <Text style={[styles.cardMetricLabel, { color: colors.text.secondary }]}>
                        Balance
                      </Text>
                      <Text style={[styles.cardMetricValue, { color: colors.text.primary }]}>
                        £{card.currentBalance.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.cardMetric}>
                      <Text style={[styles.cardMetricLabel, { color: colors.text.secondary }]}>
                        Limit
                      </Text>
                      <Text style={[styles.cardMetricValue, { color: colors.text.primary }]}>
                        £{card.creditLimit.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.cardMetric}>
                      <Text style={[styles.cardMetricLabel, { color: colors.text.secondary }]}>
                        Utilization
                      </Text>
                      <Text style={[styles.cardMetricValue, { color: utilizationColor }]}>
                        {utilization.toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  {(card.interestRate || card.dueDate || card.minimumPayment) && (
                    <View style={styles.cardItemFooter}>
                      {card.interestRate && (
                        <View style={styles.cardDetail}>
                          <Ionicons
                            name="trending-up-outline"
                            size={14}
                            color={colors.text.tertiary}
                          />
                          <Text style={[styles.cardDetailText, { color: colors.text.secondary }]}>
                            {card.interestRate}% APR
                          </Text>
                        </View>
                      )}
                      {card.dueDate && (
                        <View style={styles.cardDetail}>
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color={colors.text.tertiary}
                          />
                          <Text style={[styles.cardDetailText, { color: colors.text.secondary }]}>
                            Due: {card.dueDate}
                            {card.dueDate === 1
                              ? 'st'
                              : card.dueDate === 2
                              ? 'nd'
                              : card.dueDate === 3
                              ? 'rd'
                              : 'th'}
                          </Text>
                        </View>
                      )}
                      {card.minimumPayment && (
                        <View style={styles.cardDetail}>
                          <Ionicons name="cash-outline" size={14} color={colors.text.tertiary} />
                          <Text style={[styles.cardDetailText, { color: colors.text.secondary }]}>
                            Min: £{card.minimumPayment.toFixed(2)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Card Modal */}
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
                  {editingCard ? 'Edit Credit Card' : 'Add Credit Card'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.text.secondary }]}>
                  Track your credit card balances and utilization
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close-circle" size={28} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Card Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                  Card Name <Text style={{ color: colors.error.main }}>*</Text>
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
                  value={cardName}
                  onChangeText={setCardName}
                  placeholder="e.g., Chase Sapphire"
                  placeholderTextColor={colors.text.tertiary}
                />
              </View>

              {/* Last 4 Digits */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                  Last 4 Digits (Optional)
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
                  value={lastFourDigits}
                  onChangeText={setLastFourDigits}
                  placeholder="1234"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              {/* Balance and Limit Row */}
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                    Current Balance <Text style={{ color: colors.error.main }}>*</Text>
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
                    value={currentBalance}
                    onChangeText={setCurrentBalance}
                    placeholder="0.00"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                    Credit Limit <Text style={{ color: colors.error.main }}>*</Text>
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
                    value={creditLimit}
                    onChangeText={setCreditLimit}
                    placeholder="0.00"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Interest Rate and Due Date Row */}
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                    Interest Rate (%)
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
                    Due Date (Day)
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
              </View>

              {/* Minimum Payment */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                  Minimum Payment
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
                  value={minimumPayment}
                  onChangeText={setMinimumPayment}
                  placeholder="0.00"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="decimal-pad"
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
                onPress={handleSaveCard}
              >
                <Text style={styles.saveButtonText}>
                  {editingCard ? 'Update Card' : 'Add Card'}
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
    marginBottom: spacing.lg,
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
  utilizationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  utilizationPercent: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  utilizationDetails: {
    flex: 1,
  },
  utilizationAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  utilizationCards: {
    fontSize: 13,
    fontWeight: '500',
  },
  utilizationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  utilizationStatusText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Cards Section
  cardsSection: {
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

  // Card Item
  cardItem: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  cardLast4: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardItemBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  cardMetric: {
    flex: 1,
    alignItems: 'center',
  },
  cardMetricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardMetricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardItemFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  cardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDetailText: {
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
