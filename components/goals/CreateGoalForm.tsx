import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { FinancialGoal, CreateGoalRequest, goalsAPI } from '../../services/api/goalsAPI';
import { SHADOWS, SPACING, BORDER_RADIUS } from '../../constants/Colors';

interface CreateGoalFormProps {
  onSubmit: (goalData: CreateGoalRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const GOAL_TYPES: Array<{ type: FinancialGoal['type']; title: string; description: string }> = [
  {
    type: 'emergency_fund',
    title: 'Emergency Fund',
    description: '3-6 months of expenses for financial security'
  },
  {
    type: 'vacation',
    title: 'Vacation',
    description: 'Save for your dream trip or getaway'
  },
  {
    type: 'debt_payoff',
    title: 'Debt Payoff',
    description: 'Pay off credit cards or loans faster'
  },
  {
    type: 'major_purchase',
    title: 'Major Purchase',
    description: 'Save for a house, car, or other big expense'
  },
  {
    type: 'retirement',
    title: 'Retirement',
    description: 'Build your retirement savings'
  },
  {
    type: 'custom',
    title: 'Custom Goal',
    description: 'Create a personalized savings goal'
  }
];

const PRIORITIES: Array<{ priority: FinancialGoal['priority']; title: string }> = [
  { priority: 'high', title: 'High Priority' },
  { priority: 'medium', title: 'Medium Priority' },
  { priority: 'low', title: 'Low Priority' }
];

export const CreateGoalForm: React.FC<CreateGoalFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { colors } = useTheme();

  // Form state
  const [selectedType, setSelectedType] = useState<FinancialGoal['type']>('emergency_fund');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState<FinancialGoal['priority']>('medium');
  const [category, setCategory] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [autoSaveAmount, setAutoSaveAmount] = useState('');
  const [autoSaveFrequency, setAutoSaveFrequency] = useState<'weekly' | 'monthly'>('monthly');

  // Auto-populate title and description based on type
  React.useEffect(() => {
    const goalType = GOAL_TYPES.find(t => t.type === selectedType);
    if (goalType && !title) {
      setTitle(goalType.title);
      setDescription(goalType.description);
    }
  }, [selectedType]);

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    if (!targetAmount || isNaN(parseFloat(targetAmount)) || parseFloat(targetAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    if (!targetDate) {
      Alert.alert('Error', 'Please select a target date');
      return;
    }

    // Check if target date is in the future
    const targetDateTime = new Date(targetDate).getTime();
    const now = Date.now();
    if (targetDateTime <= now) {
      Alert.alert('Error', 'Target date must be in the future');
      return;
    }

    const goalData: CreateGoalRequest = {
      title: title.trim(),
      description: description.trim(),
      type: selectedType,
      targetAmount: parseFloat(targetAmount),
      targetDate: new Date(targetDate).toISOString(),
      priority,
      category: category.trim() || selectedType.replace('_', ' '),
      autoSaveSettings: autoSaveEnabled ? {
        enabled: true,
        amount: parseFloat(autoSaveAmount) || 0,
        frequency: autoSaveFrequency,
        roundUpEnabled: false
      } : undefined
    };

    await onSubmit(goalData);
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create New Goal</Text>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Goal Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goal Type</Text>
        <View style={styles.typeGrid}>
          {GOAL_TYPES.map((type) => {
            const isSelected = selectedType === type.type;
            const typeColor = goalsAPI.getGoalTypeColor(type.type);
            const typeIcon = goalsAPI.getGoalTypeIcon(type.type);

            return (
              <TouchableOpacity
                key={type.type}
                style={[
                  styles.typeOption,
                  isSelected && { borderColor: typeColor, backgroundColor: typeColor + '10' }
                ]}
                onPress={() => setSelectedType(type.type)}
              >
                <Ionicons name={typeIcon as any} size={24} color={typeColor} />
                <Text style={[styles.typeTitle, isSelected && { color: typeColor }]}>
                  {type.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goal Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter goal title"
            
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your goal"
            
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Target Amount (£)</Text>
          <TextInput
            style={styles.textInput}
            value={targetAmount}
            onChangeText={setTargetAmount}
            placeholder="0.00"
            
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Target Date</Text>
          <TextInput
            style={styles.textInput}
            value={targetDate}
            onChangeText={setTargetDate}
            placeholder="YYYY-MM-DD"
            
          />
          <Text style={styles.inputHint}>Format: 2024-12-31</Text>
        </View>
      </View>

      {/* Priority Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Priority</Text>
        <View style={styles.priorityContainer}>
          {PRIORITIES.map((p) => {
            const isSelected = priority === p.priority;
            const priorityColor = goalsAPI.getPriorityColor(p.priority);

            return (
              <TouchableOpacity
                key={p.priority}
                style={[
                  styles.priorityOption,
                  isSelected && { borderColor: priorityColor, backgroundColor: priorityColor + '10' }
                ]}
                onPress={() => setPriority(p.priority)}
              >
                <Text style={[styles.priorityText, isSelected && { color: priorityColor }]}>
                  {p.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Auto-Save Settings */}
      <View style={styles.section}>
        <View style={styles.autoSaveHeader}>
          <Text style={styles.sectionTitle}>Auto-Save (Optional)</Text>
          <TouchableOpacity
            style={[styles.toggle, autoSaveEnabled && styles.toggleActive]}
            onPress={() => setAutoSaveEnabled(!autoSaveEnabled)}
          >
            <View style={[styles.toggleThumb, autoSaveEnabled && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        {autoSaveEnabled && (
          <View style={styles.autoSaveSettings}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (£)</Text>
              <TextInput
                style={styles.textInput}
                value={autoSaveAmount}
                onChangeText={setAutoSaveAmount}
                placeholder="0.00"
                
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <View style={styles.frequencyContainer}>
                {['weekly', 'monthly'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyOption,
                      autoSaveFrequency === freq && styles.frequencyOptionActive
                    ]}
                    onPress={() => setAutoSaveFrequency(freq as 'weekly' | 'monthly')}
                  >
                    <Text style={[
                      styles.frequencyText,
                      autoSaveFrequency === freq && styles.frequencyTextActive
                    ]}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButtonStyle]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Creating...' : 'Create Goal'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary
  },
  cancelButton: {
    padding: SPACING.sm
  },
  section: {
    backgroundColor: colors.background.primary,
    marginTop: SPACING.md,
    padding: SPACING.lg
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: SPACING.md
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm
  },
  typeOption: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: colors.border.light,
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  typeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: SPACING.xs,
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: SPACING.md
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: SPACING.sm
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  inputHint: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: SPACING.xs
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: SPACING.sm
  },
  priorityOption: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: colors.border.light,
    alignItems: 'center'
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary
  },
  autoSaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border.light,
    justifyContent: 'center',
    padding: 2
  },
  toggleActive: {
    backgroundColor: colors.primary.main
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    alignSelf: 'flex-start'
  },
  toggleThumbActive: {
    alignSelf: 'flex-end'
  },
  autoSaveSettings: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: SPACING.md
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: SPACING.sm
  },
  frequencyOption: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    backgroundColor: colors.background.secondary
  },
  frequencyOptionActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10'
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary
  },
  frequencyTextActive: {
    color: colors.primary.main,
    fontWeight: '600'
  },
  actions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    backgroundColor: colors.background.primary
  },
  button: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center'
  },
  cancelButtonStyle: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary
  },
  submitButton: {
    backgroundColor: colors.primary.main
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary
  }
});