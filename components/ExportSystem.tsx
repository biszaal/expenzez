import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { expenseAPI, budgetAPI, profileAPI } from '../services/api';
import { transactionAPI } from '../services/api/transactionAPI';
import { spacing, borderRadius, typography } from '../constants/theme';

interface ExportOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  format: 'csv' | 'json' | 'pdf' | 'txt';
  color: string;
  dataType: 'transactions' | 'budgets' | 'expenses' | 'profile' | 'full_backup';
}

interface ExportSystemProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ExportSystem: React.FC<ExportSystemProps> = ({ isVisible, onClose }) => {
  const { colors } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    endDate: new Date(), // Current date
  });
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['transactions']);

  const exportOptions: ExportOption[] = [
    {
      id: 'transactions_csv',
      title: 'Transactions (CSV)',
      subtitle: 'Spreadsheet-friendly format',
      icon: 'document-text',
      format: 'csv',
      dataType: 'transactions',
      color: colors.success[500],
    },
  ];

  const dataTypes = [
    { id: 'transactions', name: 'Bank Transactions', icon: 'card' },
    { id: 'expenses', name: 'Manual Expenses', icon: 'receipt' },
    { id: 'budgets', name: 'Budgets', icon: 'pie-chart' },
    { id: 'profile', name: 'Profile Data', icon: 'person' },
    { id: 'savings_goals', name: 'Savings Goals', icon: 'trophy' },
  ];

  const handleExport = async (option: ExportOption) => {
    try {
      setExporting(true);
      setExportProgress('Preparing data...');

      let data: any = {};
      let content = '';
      let fileName = '';
      let mimeType = '';

      const startDate = dateRange.startDate.toISOString();
      const endDate = dateRange.endDate.toISOString();

      // Fetch data based on export type
      switch (option.dataType) {
        case 'transactions':
          setExportProgress('Fetching transactions...');
          try {
            const transactionsResponse = await transactionAPI.getTransactions({ limit: 5000 });
            data.transactions = transactionsResponse.transactions || [];
          } catch (error) {
            console.log('Failed to fetch bank transactions, using empty array');
            data.transactions = [];
          }
          break;

        case 'expenses':
          setExportProgress('Fetching expenses...');
          try {
            const expensesResponse = await expenseAPI.getExpenses({
              startDate,
              endDate,
              limit: 5000,
            });
            data.expenses = expensesResponse.expenses || [];
            console.log(`✅ Successfully fetched ${data.expenses.length} expenses`);
            
            // If no expenses found, keep empty array
            if (data.expenses.length === 0) {
              console.log('📝 No expenses found');
              data.expenses = [];
            }
          } catch (error) {
            console.log('❌ Failed to fetch expenses:', error);
            data.expenses = [];
          }
          break;

        case 'budgets':
          setExportProgress('Fetching budgets...');
          try {
            const budgetsResponse = await budgetAPI.getBudgets();
            data.budgets = budgetsResponse.budgets || [];
            data.budgetSummary = budgetsResponse.summary || {};
          } catch (error) {
            console.log('Failed to fetch budgets, using empty array');
            data.budgets = [];
            data.budgetSummary = {};
          }
          break;

        case 'profile':
          setExportProgress('Fetching profile...');
          try {
            const profileResponse = await profileAPI.getProfile();
            data.profile = profileResponse.profile || {};
            
            const goalsResponse = await profileAPI.getGoals();
            data.savingsGoals = goalsResponse.savingsGoals || [];
          } catch (error) {
            console.log('Failed to fetch profile, using empty data');
            data.profile = {};
            data.savingsGoals = [];
          }
          break;

        case 'full_backup':
          setExportProgress('Creating full backup...');
          try {
            // Fetch all data types
            const [transactionsResponse, expensesResponse, budgetsResponse, profileResponse, goalsResponse] = await Promise.allSettled([
              transactionAPI.getTransactions({ limit: 5000 }),
              expenseAPI.getExpenses({ startDate, endDate, limit: 5000 }),
              budgetAPI.getBudgets(),
              profileAPI.getProfile(),
              profileAPI.getGoals(),
            ]);

            data = {
              transactions: transactionsResponse.status === 'fulfilled' ? transactionsResponse.value.transactions || [] : [],
              expenses: expensesResponse.status === 'fulfilled' ? expensesResponse.value.expenses || [] : [],
              budgets: budgetsResponse.status === 'fulfilled' ? budgetsResponse.value.budgets || [] : [],
              budgetSummary: budgetsResponse.status === 'fulfilled' ? budgetsResponse.value.summary || {} : {},
              profile: profileResponse.status === 'fulfilled' ? profileResponse.value.profile || {} : {},
              savingsGoals: goalsResponse.status === 'fulfilled' ? goalsResponse.value.savingsGoals || [] : [],
              exportedAt: new Date().toISOString(),
              dateRange: { startDate, endDate },
            };

            // Keep empty arrays if no data is available
            if (data.expenses.length === 0) {
              console.log('📝 No expenses available for export');
              data.expenses = [];
            }
          } catch (error) {
            console.log('Failed to create full backup');
            data = {
              transactions: [],
              expenses: [],
              budgets: [],
              budgetSummary: {},
              profile: {},
              savingsGoals: [],
              exportedAt: new Date().toISOString(),
              dateRange: { startDate, endDate },
              error: 'Some data could not be fetched',
            };
          }
          break;
      }

      setExportProgress('Generating file...');

      // Generate content based on format
      switch (option.format) {
        case 'csv':
          content = generateCSV(data, option.dataType);
          fileName = `expenzez_${option.dataType}_${formatDateForFilename(startDate)}_to_${formatDateForFilename(endDate)}.csv`;
          mimeType = 'text/csv';
          break;

        case 'json':
          content = JSON.stringify(data, null, 2);
          fileName = `expenzez_${option.dataType}_${formatDateForFilename(new Date().toISOString())}.json`;
          mimeType = 'application/json';
          break;

        case 'txt':
          content = generateFormattedReport(data, option.dataType);
          fileName = `expenzez_report_${formatDateForFilename(new Date().toISOString())}.txt`;
          mimeType = 'text/plain';
          break;

        default:
          throw new Error('Unsupported format');
      }

      setExportProgress('Preparing export...');

      // Check if we have any meaningful data to export
      const hasData = checkForMeaningfulData(data, option.dataType);
      
      if (!hasData) {
        Alert.alert(
          'No Data Available',
          `No ${option.dataType} data found for the selected time period. Try:\n\n• Selecting a different date range\n• Adding some ${option.dataType} first\n• Connecting a bank account for transactions`,
          [
            { text: 'OK', onPress: onClose }
          ]
        );
        return;
      }

      // For now, show the content in an alert with copy option
      // In a production app, you'd integrate with proper file system APIs
      Alert.alert(
        'Export Ready',
        `Your ${option.title} export is ready. The data contains ${content.split('\n').length} lines.`,
        [
          {
            text: 'Copy Data',
            onPress: () => {
              // In a real app, you'd copy to clipboard
              Alert.alert(
                'Export Data',
                content.length > 2000 
                  ? content.substring(0, 2000) + '...\n\n[Data truncated for display]'
                  : content,
                [{ text: 'OK', onPress: onClose }]
              );
            },
          },
          {
            text: 'Email Data',
            onPress: async () => {
              try {
                const emailUrl = `mailto:?subject=${encodeURIComponent(`Export: ${option.title}`)}&body=${encodeURIComponent(content.substring(0, 1000) + '...')}`;
                await Linking.openURL(emailUrl);
              } catch (error) {
                Alert.alert('Error', 'Unable to open email app');
              }
            },
          },
          { text: 'Done', onPress: onClose },
        ]
      );
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', error.message || 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
      setExportProgress('');
    }
  };

  const generateCSV = (data: any, dataType: string): string => {
    let csv = '';

    switch (dataType) {
      case 'transactions':
        csv = 'Transaction ID,Date,Amount,Currency,Description,Category,Account ID,Type,Merchant\n';
        (data.transactions || []).forEach((tx: any) => {
          csv += `"${tx.transactionId || tx.id || ''}","${tx.date || ''}","${tx.amount || 0}","${tx.currency || 'GBP'}","${(tx.description || '').replace(/"/g, '""')}","${tx.category || ''}","${tx.accountId || ''}","${tx.type || ''}","${(tx.merchant || '').replace(/"/g, '""')}"\n`;
        });
        break;

      case 'expenses':
        csv = 'Expense ID,Date,Amount,Category,Description,Tags,Receipt URL,Is Recurring,Created At\n';
        (data.expenses || []).forEach((expense: any) => {
          csv += `"${expense.id || ''}","${expense.date || ''}","${expense.amount || 0}","${expense.category || ''}","${(expense.description || '').replace(/"/g, '""')}","${(expense.tags || []).join(';')}","${expense.receipt?.url || ''}","${expense.isRecurring || false}","${expense.createdAt || ''}"\n`;
        });
        break;

      case 'budgets':
        csv = 'Budget ID,Name,Category,Amount,Period,Current Spent,Progress %,Is Over Budget,Alert Threshold,Is Active,Created At\n';
        (data.budgets || []).forEach((budget: any) => {
          csv += `"${budget.id || ''}","${(budget.name || '').replace(/"/g, '""')}","${budget.category || ''}","${budget.amount || 0}","${budget.period || ''}","${budget.currentSpent || 0}","${budget.progress || 0}","${budget.isOverBudget || false}","${budget.alertThreshold || 80}","${budget.isActive || false}","${budget.createdAt || ''}"\n`;
        });
        break;

      default:
        csv = 'Data export not available in CSV format for this data type.\n';
    }

    return csv;
  };

  const generateFormattedReport = (data: any, dataType: string): string => {
    let report = 'EXPENZEZ FINANCIAL REPORT\n';
    report += '='.repeat(50) + '\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Export Type: ${dataType}\n`;
    
    if (data.dateRange) {
      report += `Date Range: ${new Date(data.dateRange.startDate).toLocaleDateString()} - ${new Date(data.dateRange.endDate).toLocaleDateString()}\n`;
    }
    
    report += '\n';

    if (data.transactions && data.transactions.length > 0) {
      report += 'TRANSACTIONS SUMMARY\n';
      report += '-'.repeat(30) + '\n';
      
      const totalTransactions = data.transactions.length;
      const totalIncome = data.transactions.filter((t: any) => parseFloat(t.amount || 0) > 0).reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
      const totalExpenses = Math.abs(data.transactions.filter((t: any) => parseFloat(t.amount || 0) < 0).reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0));
      
      report += `Total Transactions: ${totalTransactions}\n`;
      report += `Total Income: £${totalIncome.toFixed(2)}\n`;
      report += `Total Expenses: £${totalExpenses.toFixed(2)}\n`;
      report += `Net Amount: £${(totalIncome - totalExpenses).toFixed(2)}\n\n`;
      
      // Category breakdown
      const categoryMap = new Map();
      data.transactions.forEach((tx: any) => {
        if (parseFloat(tx.amount || 0) < 0) {
          const category = tx.category || 'Uncategorized';
          const amount = Math.abs(parseFloat(tx.amount || 0));
          categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
        }
      });
      
      if (categoryMap.size > 0) {
        report += 'SPENDING BY CATEGORY\n';
        report += '-'.repeat(30) + '\n';
        const sortedCategories = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]);
        sortedCategories.forEach(([category, amount]) => {
          report += `${category}: £${(amount as number).toFixed(2)}\n`;
        });
        report += '\n';
      }
    }

    if (data.expenses && data.expenses.length > 0) {
      report += 'MANUAL EXPENSES SUMMARY\n';
      report += '-'.repeat(30) + '\n';
      
      const totalExpenses = data.expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0);
      report += `Total Manual Expenses: £${totalExpenses.toFixed(2)}\n`;
      report += `Number of Expenses: ${data.expenses.length}\n\n`;
      
      // Category breakdown
      const categoryMap = new Map();
      data.expenses.forEach((exp: any) => {
        const category = exp.category || 'Uncategorized';
        const amount = parseFloat(exp.amount || 0);
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      });
      
      if (categoryMap.size > 0) {
        report += 'EXPENSES BY CATEGORY\n';
        report += '-'.repeat(30) + '\n';
        const sortedCategories = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]);
        sortedCategories.forEach(([category, amount]) => {
          report += `${category}: £${(amount as number).toFixed(2)}\n`;
        });
        report += '\n';
      }
    }

    if (data.budgets && data.budgets.length > 0) {
      report += 'BUDGET SUMMARY\n';
      report += '-'.repeat(30) + '\n';
      
      const totalBudget = data.budgets.reduce((sum: number, budget: any) => sum + parseFloat(budget.amount || 0), 0);
      const totalSpent = data.budgets.reduce((sum: number, budget: any) => sum + parseFloat(budget.currentSpent || 0), 0);
      const overBudgetCount = data.budgets.filter((budget: any) => budget.isOverBudget).length;
      
      report += `Total Budget Amount: £${totalBudget.toFixed(2)}\n`;
      report += `Total Spent: £${totalSpent.toFixed(2)}\n`;
      report += `Remaining: £${(totalBudget - totalSpent).toFixed(2)}\n`;
      report += `Budgets Over Limit: ${overBudgetCount}/${data.budgets.length}\n\n`;
      
      report += 'INDIVIDUAL BUDGETS\n';
      report += '-'.repeat(30) + '\n';
      data.budgets.forEach((budget: any) => {
        report += `${budget.name}: £${parseFloat(budget.currentSpent || 0).toFixed(2)} / £${parseFloat(budget.amount || 0).toFixed(2)} (${budget.progress || 0}%)\n`;
      });
      report += '\n';
    }

    if (data.savingsGoals && data.savingsGoals.length > 0) {
      report += 'SAVINGS GOALS\n';
      report += '-'.repeat(30) + '\n';
      
      const completedGoals = data.savingsGoals.filter((goal: any) => goal.isCompleted).length;
      const totalTargetAmount = data.savingsGoals.reduce((sum: number, goal: any) => sum + parseFloat(goal.targetAmount || 0), 0);
      const totalCurrentAmount = data.savingsGoals.reduce((sum: number, goal: any) => sum + parseFloat(goal.currentAmount || 0), 0);
      
      report += `Total Goals: ${data.savingsGoals.length}\n`;
      report += `Completed Goals: ${completedGoals}\n`;
      report += `Total Target: £${totalTargetAmount.toFixed(2)}\n`;
      report += `Total Saved: £${totalCurrentAmount.toFixed(2)}\n\n`;
      
      report += 'INDIVIDUAL GOALS\n';
      report += '-'.repeat(30) + '\n';
      data.savingsGoals.forEach((goal: any) => {
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        report += `${goal.title}: £${parseFloat(goal.currentAmount || 0).toFixed(2)} / £${parseFloat(goal.targetAmount || 0).toFixed(2)} (${Math.round(progress)}%)\n`;
      });
      report += '\n';
    }

    if (data.profile) {
      report += 'PROFILE INFORMATION\n';
      report += '-'.repeat(30) + '\n';
      report += `Name: ${data.profile.firstName || ''} ${data.profile.lastName || ''}\n`;
      report += `Email: ${data.profile.email || ''}\n`;
      if (data.profile.phone) report += `Phone: ${data.profile.phone}\n`;
      if (data.profile.dateOfBirth) report += `Date of Birth: ${data.profile.dateOfBirth}\n`;
      report += '\n';
    }

    report += 'END OF REPORT\n';
    report += '='.repeat(50) + '\n';

    return report;
  };

  const formatDateForFilename = (dateString: string): string => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const checkForMeaningfulData = (data: any, dataType: string): boolean => {
    switch (dataType) {
      case 'transactions':
        return data.transactions && data.transactions.length > 0;
      case 'expenses':
        return data.expenses && data.expenses.length > 0;
      case 'budgets':
        return data.budgets && data.budgets.length > 0;
      case 'profile':
        return data.profile && Object.keys(data.profile).length > 0;
      case 'full_backup':
        return (
          (data.transactions && data.transactions.length > 0) ||
          (data.expenses && data.expenses.length > 0) ||
          (data.budgets && data.budgets.length > 0) ||
          (data.savingsGoals && data.savingsGoals.length > 0) ||
          (data.profile && Object.keys(data.profile).length > 0)
        );
      default:
        return false;
    }
  };


  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Export Data
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
              Download your financial data
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Date Range Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Date Range
            </Text>
            <View style={styles.dateRangeContainer}>
              <View style={[styles.dateButton, { backgroundColor: colors.background.primary }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary[500]} />
                <View style={styles.dateInfo}>
                  <Text style={[styles.dateLabel, { color: colors.text.secondary }]}>From</Text>
                  <Text style={[styles.dateValue, { color: colors.text.primary }]}>
                    {dateRange.startDate.toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={[styles.dateButton, { backgroundColor: colors.background.primary }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary[500]} />
                <View style={styles.dateInfo}>
                  <Text style={[styles.dateLabel, { color: colors.text.secondary }]}>To</Text>
                  <Text style={[styles.dateValue, { color: colors.text.primary }]}>
                    {dateRange.endDate.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.dateNote, { color: colors.text.secondary }]}>
              Default range: Start of current year to today
            </Text>
          </View>

          {/* Export Options */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Export Options
            </Text>
            <View style={styles.exportGrid}>
              {exportOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.exportCard, { backgroundColor: colors.background.primary }]}
                  onPress={() => handleExport(option)}
                  disabled={exporting}
                >
                  <LinearGradient
                    colors={[`${option.color}20`, `${option.color}10`]}
                    style={styles.exportCardGradient}
                  >
                    <View style={[styles.exportIcon, { backgroundColor: option.color }]}>
                      <Ionicons name={option.icon as any} size={24} color="#fff" />
                    </View>
                    <Text style={[styles.exportTitle, { color: colors.text.primary }]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.exportSubtitle, { color: colors.text.secondary }]}>
                      {option.subtitle}
                    </Text>
                    <View style={[styles.formatBadge, { backgroundColor: colors.gray[200] }]}>
                      <Text style={[styles.formatText, { color: colors.text.primary }]}>
                        {option.format.toUpperCase()}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Export Tips */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Export Tips
            </Text>
            <View style={[styles.tipsContainer, { backgroundColor: colors.background.primary }]}>
              <View style={styles.tipItem}>
                <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
                <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                  CSV files can be opened in Excel, Google Sheets, or any spreadsheet application
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="shield-checkmark" size={20} color={colors.success[500]} />
                <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                  All exports are generated locally on your device for privacy
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="time" size={20} color={colors.warning[500]} />
                <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                  Large exports may take a few moments to process
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Loading Modal */}
        <Modal visible={exporting} transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <View style={[styles.loadingModal, { backgroundColor: colors.background.primary }]}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={[styles.loadingTitle, { color: colors.text.primary }]}>
                Exporting Data
              </Text>
              <Text style={[styles.loadingSubtitle, { color: colors.text.secondary }]}>
                {exportProgress}
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  exportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  exportCard: {
    width: '47%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportCardGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'space-between',
  },
  exportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  exportSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  formatBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  formatText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tipsContainer: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: spacing.sm,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModal: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  loadingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ExportSystem;