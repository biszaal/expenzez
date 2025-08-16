import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../hooks/useAlert';
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from '../constants/theme';

export interface SavingsGoal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'emergency' | 'vacation' | 'car' | 'home' | 'education' | 'other';
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  onGoalCreate: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onGoalUpdate: (goalId: string, updates: Partial<SavingsGoal>) => Promise<void>;
  onGoalDelete: (goalId: string) => Promise<void>;
  loading?: boolean;
}

const goalCategories = [
  { id: 'emergency', title: 'Emergency Fund', icon: 'shield-outline', color: '#EF4444' },
  { id: 'vacation', title: 'Vacation', icon: 'airplane-outline', color: '#3B82F6' },
  { id: 'car', title: 'Car', icon: 'car-outline', color: '#F59E0B' },
  { id: 'home', title: 'Home', icon: 'home-outline', color: '#10B981' },
  { id: 'education', title: 'Education', icon: 'school-outline', color: '#8B5CF6' },
  { id: 'other', title: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#6B7280' },
];

export default function SavingsGoals({
  goals,
  onGoalCreate,
  onGoalUpdate,
  onGoalDelete,
  loading = false,
}: SavingsGoalsProps) {
  const { colors } = useTheme();
  const { showSuccess, showError } = useAlert();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [showAddAmountModal, setShowAddAmountModal] = useState<SavingsGoal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
    category: 'other' as SavingsGoal['category'],
  });

  const [addAmount, setAddAmount] = useState('');

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: '',
      category: 'other',
    });
  };

  const handleCreateGoal = async () => {
    if (!formData.title.trim() || !formData.targetAmount.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      showError('Please enter a valid target amount');
      return;
    }

    setSubmitting(true);
    try {
      await onGoalCreate({
        title: formData.title.trim(),
        description: formData.description.trim(),
        targetAmount,
        currentAmount: parseFloat(formData.currentAmount) || 0,
        targetDate: formData.targetDate,
        category: formData.category,
        isCompleted: false,
      });
      
      showSuccess('Savings goal created successfully!');
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      showError('Failed to create savings goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal || !formData.title.trim() || !formData.targetAmount.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      showError('Please enter a valid target amount');
      return;
    }

    setSubmitting(true);
    try {
      await onGoalUpdate(editingGoal.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        targetAmount,
        currentAmount: parseFloat(formData.currentAmount) || 0,
        targetDate: formData.targetDate,
        category: formData.category,
      });
      
      showSuccess('Savings goal updated successfully!');
      setEditingGoal(null);
      resetForm();
    } catch (error) {
      showError('Failed to update savings goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAmount = async () => {
    if (!showAddAmountModal || !addAmount.trim()) {
      showError('Please enter an amount');
      return;
    }

    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const newAmount = showAddAmountModal.currentAmount + amount;
      await onGoalUpdate(showAddAmountModal.id, {
        currentAmount: newAmount,
        isCompleted: newAmount >= showAddAmountModal.targetAmount,
      });
      
      showSuccess(`Added £${amount.toFixed(2)} to your goal!`);
      setShowAddAmountModal(null);
      setAddAmount('');
    } catch (error) {
      showError('Failed to add amount to goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = (goal: SavingsGoal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onGoalDelete(goal.id);
              showSuccess('Savings goal deleted');
            } catch (error) {
              showError('Failed to delete savings goal');
            }
          },
        },
      ]
    );
  };

  const getProgressPercentage = (goal: SavingsGoal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getCategoryInfo = (category: string) => {
    return goalCategories.find(cat => cat.id === category) || goalCategories[5];
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const editGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate,
      category: goal.category,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading savings goals...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Savings Goals
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
            {goals.length} goal{goals.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary[500] }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Goals List */}
      <ScrollView
        style={styles.goalsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.goalsContent}
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No Savings Goals Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
              Create your first savings goal to start tracking your progress
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary[500] }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.emptyButtonText}>Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((goal) => {
            const categoryInfo = getCategoryInfo(goal.category);
            const progress = getProgressPercentage(goal);
            const isCompleted = goal.isCompleted || progress >= 100;
            
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, { backgroundColor: colors.background.primary, ...shadows.md }]}
                onPress={() => setShowAddAmountModal(goal)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isCompleted ? ['#10B981', '#059669'] : [colors.primary[100], colors.primary[50]]}
                  style={styles.goalGradient}
                >
                  {/* Goal Header */}
                  <View style={styles.goalHeader}>
                    <View style={styles.goalHeaderLeft}>
                      <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color }]}>
                        <Ionicons name={categoryInfo.icon as any} size={20} color="white" />
                      </View>
                      <View style={styles.goalHeaderInfo}>
                        <Text style={[styles.goalTitle, { color: colors.text.primary }]}>
                          {goal.title}
                        </Text>
                        <Text style={[styles.goalCategory, { color: colors.text.secondary }]}>
                          {categoryInfo.title}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.goalActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
                        onPress={() => editGoal(goal)}
                      >
                        <Ionicons name="pencil" size={16} color={colors.text.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
                        onPress={() => handleDeleteGoal(goal)}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error[500]} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Goal Description */}
                  {goal.description && (
                    <Text style={[styles.goalDescription, { color: colors.text.secondary }]}>
                      {goal.description}
                    </Text>
                  )}

                  {/* Progress */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={[styles.progressText, { color: colors.text.primary }]}>
                        {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                      </Text>
                      <Text style={[styles.progressPercentage, { color: isCompleted ? '#10B981' : colors.primary[500] }]}>
                        {Math.round(progress)}%
                      </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: colors.background.secondary }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progress}%`,
                            backgroundColor: isCompleted ? '#10B981' : colors.primary[500],
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Goal Footer */}
                  <View style={styles.goalFooter}>
                    <View style={styles.goalDate}>
                      <Ionicons name="calendar-outline" size={16} color={colors.text.tertiary} />
                      <Text style={[styles.goalDateText, { color: colors.text.tertiary }]}>
                        {formatDate(goal.targetDate)}
                      </Text>
                    </View>
                    {isCompleted && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={[styles.completedText, { color: '#10B981' }]}>
                          Completed!
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Create/Edit Goal Modal */}
      <Modal
        visible={showCreateModal || !!editingGoal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => {
          setShowCreateModal(false);
          setEditingGoal(null);
          resetForm();
        }}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowCreateModal(false);
                setEditingGoal(null);
                resetForm();
              }}
            >
              <Text style={[styles.modalCancel, { color: colors.text.secondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {editingGoal ? 'Edit Goal' : 'New Savings Goal'}
            </Text>
            <TouchableOpacity
              onPress={editingGoal ? handleUpdateGoal : handleCreateGoal}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.primary[500]} />
              ) : (
                <Text style={[styles.modalSave, { color: colors.primary[500] }]}>
                  {editingGoal ? 'Update' : 'Create'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Goal Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Goal Title *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background.primary, color: colors.text.primary, borderColor: colors.border.light }]}
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                placeholder="e.g., Emergency Fund"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            {/* Goal Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { backgroundColor: colors.background.primary, color: colors.text.primary, borderColor: colors.border.light }]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Optional description..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {goalCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      { backgroundColor: colors.background.primary, borderColor: colors.border.light },
                      formData.category === category.id && { backgroundColor: category.color, borderColor: category.color },
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, category: category.id as any }))}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={24}
                      color={formData.category === category.id ? 'white' : category.color}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        { color: formData.category === category.id ? 'white' : colors.text.primary },
                      ]}
                    >
                      {category.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Target Amount */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Target Amount *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background.primary, color: colors.text.primary, borderColor: colors.border.light }]}
                value={formData.targetAmount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, targetAmount: text }))}
                placeholder="0.00"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
              />
            </View>

            {/* Current Amount */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Current Amount</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background.primary, color: colors.text.primary, borderColor: colors.border.light }]}
                value={formData.currentAmount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, currentAmount: text }))}
                placeholder="0.00"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
              />
            </View>

            {/* Target Date */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Target Date</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background.primary, color: colors.text.primary, borderColor: colors.border.light }]}
                value={formData.targetDate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, targetDate: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Amount Modal */}
      <Modal
        visible={!!showAddAmountModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => {
          setShowAddAmountModal(null);
          setAddAmount('');
        }}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowAddAmountModal(null);
                setAddAmount('');
              }}
            >
              <Text style={[styles.modalCancel, { color: colors.text.secondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Add to Goal
            </Text>
            <TouchableOpacity onPress={handleAddAmount} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color={colors.primary[500]} />
              ) : (
                <Text style={[styles.modalSave, { color: colors.primary[500] }]}>Add</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {showAddAmountModal && (
              <>
                <View style={styles.goalSummary}>
                  <Text style={[styles.goalSummaryTitle, { color: colors.text.primary }]}>
                    {showAddAmountModal.title}
                  </Text>
                  <Text style={[styles.goalSummaryProgress, { color: colors.text.secondary }]}>
                    {formatCurrency(showAddAmountModal.currentAmount)} of {formatCurrency(showAddAmountModal.targetAmount)}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Amount to Add</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.background.primary, color: colors.text.primary, borderColor: colors.border.light }]}
                    value={addAmount}
                    onChangeText={setAddAmount}
                    placeholder="0.00"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="numeric"
                    autoFocus
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.xs,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalsList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  goalsContent: {
    paddingBottom: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.base,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius['2xl'],
  },
  emptyButtonText: {
    color: 'white',
    fontSize: typography.fontSizes.base,
    fontWeight: '600',
  },
  goalCard: {
    borderRadius: borderRadius['3xl'],
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  goalGradient: {
    padding: spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  goalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  goalHeaderInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '600',
  },
  goalCategory: {
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.xs,
  },
  goalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalDescription: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressText: {
    fontSize: typography.fontSizes.base,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: typography.fontSizes.base,
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
  goalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalDateText: {
    fontSize: typography.fontSizes.sm,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  completedText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalCancel: {
    fontSize: typography.fontSizes.base,
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: typography.fontSizes.base,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSizes.base,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginHorizontal: -spacing.sm,
  },
  categoryOption: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    minWidth: 80,
  },
  categoryText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '500',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  goalSummary: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  goalSummaryTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  goalSummaryProgress: {
    fontSize: typography.fontSizes.base,
  },
});