import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { expenseAPI, budgetAPI } from '../services/api';
import { spacing, borderRadius, typography } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface ChartData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  count: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface ReportData {
  totalExpenses: number;
  totalIncome: number;
  netSavings: number;
  avgDailySpending: number;
  categoryBreakdown: ChartData[];
  monthlyTrend: MonthlyData[];
  topMerchants: {
    name: string;
    amount: number;
    count: number;
  }[];
}

interface ReportsSystemProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onDateRangeChange?: (range: { startDate: string; endDate: string }) => void;
}

export const ReportsSystem: React.FC<ReportsSystemProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  const { colors } = useTheme();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'categories' | 'trends'>('overview');

  const loadReportData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      // Get expenses within date range
      const expensesResponse = await expenseAPI.getExpenses({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 1000,
      });

      const expenses = expensesResponse.expenses || [];
      const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

      // Calculate category breakdown
      const categoryMap = new Map<string, { amount: number; count: number }>();
      expenses.forEach((expense: any) => {
        const category = expense.category || 'Other';
        const existing = categoryMap.get(category) || { amount: 0, count: 0 };
        categoryMap.set(category, {
          amount: existing.amount + expense.amount,
          count: existing.count + 1,
        });
      });

      const categoryBreakdown: ChartData[] = Array.from(categoryMap.entries())
        .map(([category, data], index) => ({
          category,
          amount: data.amount,
          percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
          color: getCategoryColor(category, index),
          count: data.count,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Calculate monthly trends (simplified - would need more complex logic for real data)
      const monthlyTrend: MonthlyData[] = generateMonthlyTrend(expenses);

      // Calculate top merchants (simplified)
      const merchantMap = new Map<string, { amount: number; count: number }>();
      expenses.forEach((expense: any) => {
        const merchant = expense.description?.split(' ')[0] || 'Unknown';
        const existing = merchantMap.get(merchant) || { amount: 0, count: 0 };
        merchantMap.set(merchant, {
          amount: existing.amount + expense.amount,
          count: existing.count + 1,
        });
      });

      const topMerchants = Array.from(merchantMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      // Calculate other metrics
      const daysDiff = Math.max(1, (new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const avgDailySpending = totalExpenses / daysDiff;

      setReportData({
        totalExpenses,
        totalIncome: 0, // Would calculate from income transactions
        netSavings: 0 - totalExpenses, // Simplified calculation
        avgDailySpending,
        categoryBreakdown,
        monthlyTrend,
        topMerchants,
      });
    } catch (error: any) {
      console.error('Error loading report data:', error);
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const generateMonthlyTrend = (expenses: any[]): MonthlyData[] => {
    const monthlyMap = new Map<string, { expenses: number; count: number }>();
    
    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyMap.get(monthKey) || { expenses: 0, count: 0 };
      monthlyMap.set(monthKey, {
        expenses: existing.expenses + expense.amount,
        count: existing.count + 1,
      });
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month: new Date(month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: 0, // Would calculate from income data
        expenses: data.expenses,
        savings: -data.expenses, // Simplified
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  };

  const getCategoryColor = (category: string, index: number) => {
    const colorMap: { [key: string]: string } = {
      groceries: '#10B981',
      transport: '#3B82F6',
      dining: '#F59E0B',
      shopping: '#8B5CF6',
      bills: '#EF4444',
      health: '#06B6D4',
      entertainment: '#EC4899',
      other: '#6B7280',
    };
    
    const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#6B7280'];
    return colorMap[category.toLowerCase()] || defaultColors[index % defaultColors.length];
  };

  const exportReport = async (format: 'csv' | 'pdf') => {
    if (!reportData) return;

    try {
      let content = '';
      let fileName = '';
      let mimeType = '';

      if (format === 'csv') {
        // Generate CSV content
        content = generateCSVReport(reportData);
        fileName = `expense_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
        mimeType = 'text/csv';
      } else {
        // Generate simple text report (PDF generation would require additional libraries)
        content = generateTextReport(reportData);
        fileName = `expense_report_${dateRange.startDate}_to_${dateRange.endDate}.txt`;
        mimeType = 'text/plain';
      }

      // For now, show the content in an alert with copy option
      // In a production app, you'd integrate with proper file system APIs
      Alert.alert(
        'Export Ready',
        `Your ${format.toUpperCase()} report is ready. The data contains ${content.split('\n').length} lines.`,
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
                [{ text: 'OK' }]
              );
            },
          },
          { text: 'Done' },
        ]
      );
    } catch (error: any) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const generateCSVReport = (data: ReportData): string => {
    let csv = 'Expense Report\n\n';
    csv += `Report Period,${dateRange.startDate} to ${dateRange.endDate}\n`;
    csv += `Total Expenses,£${data.totalExpenses.toFixed(2)}\n`;
    csv += `Average Daily Spending,£${data.avgDailySpending.toFixed(2)}\n\n`;
    
    csv += 'Category Breakdown\n';
    csv += 'Category,Amount,Percentage,Transaction Count\n';
    data.categoryBreakdown.forEach((cat) => {
      csv += `${cat.category},£${cat.amount.toFixed(2)},${cat.percentage.toFixed(1)}%,${cat.count}\n`;
    });
    
    csv += '\nTop Merchants\n';
    csv += 'Merchant,Amount,Transaction Count\n';
    data.topMerchants.forEach((merchant) => {
      csv += `${merchant.name},£${merchant.amount.toFixed(2)},${merchant.count}\n`;
    });
    
    return csv;
  };

  const generateTextReport = (data: ReportData): string => {
    let report = 'EXPENSE REPORT\n';
    report += '='.repeat(50) + '\n\n';
    report += `Report Period: ${dateRange.startDate} to ${dateRange.endDate}\n\n`;
    
    report += 'SUMMARY\n';
    report += '-'.repeat(20) + '\n';
    report += `Total Expenses: £${data.totalExpenses.toFixed(2)}\n`;
    report += `Average Daily Spending: £${data.avgDailySpending.toFixed(2)}\n\n`;
    
    report += 'CATEGORY BREAKDOWN\n';
    report += '-'.repeat(20) + '\n';
    data.categoryBreakdown.forEach((cat) => {
      report += `${cat.category}: £${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%) - ${cat.count} transactions\n`;
    });
    
    report += '\nTOP MERCHANTS\n';
    report += '-'.repeat(20) + '\n';
    data.topMerchants.slice(0, 5).forEach((merchant) => {
      report += `${merchant.name}: £${merchant.amount.toFixed(2)} (${merchant.count} transactions)\n`;
    });
    
    return report;
  };

  const formatAmount = (amount: number) => `£${Math.abs(amount).toFixed(2)}`;

  const PieChart = ({ data }: { data: ChartData[] }) => {
    const radius = 80;
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    let currentAngle = 0;

    return (
      <View style={styles.pieChartContainer}>
        <View style={[styles.pieChart, { width: radius * 2, height: radius * 2 }]}>
          {data.map((item, index) => {
            const percentage = (item.amount / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            
            return (
              <View
                key={index}
                style={[
                  styles.pieSlice,
                  {
                    backgroundColor: item.color,
                    width: radius,
                    height: radius,
                    transform: [
                      { rotate: `${startAngle}deg` },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.pieChartLegend}>
          {data.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: colors.text.secondary }]}>
                {item.category} ({item.percentage.toFixed(1)}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Generating reports...
        </Text>
      </View>
    );
  }

  if (!reportData) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bar-chart-outline" size={64} color={colors.gray[400]} />
        <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
          No data available
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
          No transactions found for the selected period
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadReportData(true)}
          colors={[colors.primary[500]]}
        />
      }
    >
      {/* Header with Export Options */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Financial Reports
        </Text>
        <View style={styles.exportButtons}>
          <TouchableOpacity
            onPress={() => exportReport('csv')}
            style={[styles.exportButton, { backgroundColor: colors.green[500] }]}
          >
            <Ionicons name="document-text" size={16} color="#fff" />
            <Text style={styles.exportButtonText}>CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => exportReport('pdf')}
            style={[styles.exportButton, { backgroundColor: colors.blue[500] }]}
          >
            <Ionicons name="document" size={16} color="#fff" />
            <Text style={styles.exportButtonText}>Report</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View Selector */}
      <View style={styles.viewSelector}>
        {['overview', 'categories', 'trends'].map((view) => (
          <TouchableOpacity
            key={view}
            onPress={() => setSelectedView(view as any)}
            style={[
              styles.viewTab,
              {
                backgroundColor: selectedView === view ? colors.primary[500] : colors.background.primary,
                borderColor: colors.border.light,
              },
            ]}
          >
            <Text style={{
              color: selectedView === view ? '#fff' : colors.text.primary,
              fontWeight: selectedView === view ? '600' : '400',
            }}>
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Based on Selected View */}
      {selectedView === 'overview' && (
        <View>
          {/* Summary Cards */}
          <View style={styles.summaryCards}>
            <View style={[styles.summaryCard, { backgroundColor: colors.background.primary }]}>
              <Text style={[styles.summaryCardValue, { color: colors.red[600] }]}>
                {formatAmount(reportData.totalExpenses)}
              </Text>
              <Text style={[styles.summaryCardLabel, { color: colors.text.secondary }]}>
                Total Expenses
              </Text>
            </View>
            
            <View style={[styles.summaryCard, { backgroundColor: colors.background.primary }]}>
              <Text style={[styles.summaryCardValue, { color: colors.blue[600] }]}>
                {formatAmount(reportData.avgDailySpending)}
              </Text>
              <Text style={[styles.summaryCardLabel, { color: colors.text.secondary }]}>
                Daily Average
              </Text>
            </View>
          </View>

          {/* Top Categories */}
          <View style={[styles.section, { backgroundColor: colors.background.primary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Top Spending Categories
            </Text>
            {reportData.categoryBreakdown.slice(0, 5).map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.text.primary }]}>
                    {category.category}
                  </Text>
                  <Text style={[styles.categoryAmount, { color: colors.text.secondary }]}>
                    {formatAmount(category.amount)} ({category.percentage.toFixed(1)}%)
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {selectedView === 'categories' && reportData.categoryBreakdown.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.background.primary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Spending by Category
          </Text>
          <PieChart data={reportData.categoryBreakdown} />
          
          <View style={styles.categoryList}>
            {reportData.categoryBreakdown.map((category, index) => (
              <View key={index} style={styles.detailedCategoryItem}>
                <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.text.primary }]}>
                    {category.category}
                  </Text>
                  <Text style={[styles.categoryStats, { color: colors.text.secondary }]}>
                    {formatAmount(category.amount)} • {category.count} transactions • {category.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {selectedView === 'trends' && (
        <View>
          <View style={[styles.section, { backgroundColor: colors.background.primary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Monthly Spending Trend
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.trendChart}>
                {reportData.monthlyTrend.map((month, index) => (
                  <View key={index} style={styles.trendBar}>
                    <View
                      style={[
                        styles.trendBarFill,
                        {
                          height: Math.max(20, (month.expenses / 1000) * 100),
                          backgroundColor: colors.primary[500],
                        },
                      ]}
                    />
                    <Text style={[styles.trendLabel, { color: colors.text.secondary }]}>
                      {month.month}
                    </Text>
                    <Text style={[styles.trendValue, { color: colors.text.primary }]}>
                      {formatAmount(month.expenses)}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={[styles.section, { backgroundColor: colors.background.primary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Top Merchants
            </Text>
            {reportData.topMerchants.slice(0, 10).map((merchant, index) => (
              <View key={index} style={styles.merchantItem}>
                <Text style={[styles.merchantName, { color: colors.text.primary }]}>
                  {merchant.name}
                </Text>
                <View style={styles.merchantStats}>
                  <Text style={[styles.merchantAmount, { color: colors.text.primary }]}>
                    {formatAmount(merchant.amount)}
                  </Text>
                  <Text style={[styles.merchantCount, { color: colors.text.secondary }]}>
                    {merchant.count} transactions
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  exportButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  viewSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  viewTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  summaryCardLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailedCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryAmount: {
    fontSize: 14,
  },
  categoryStats: {
    fontSize: 14,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  pieChart: {
    borderRadius: 80,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  pieSlice: {
    position: 'absolute',
    borderRadius: 80,
  },
  pieChartLegend: {
    alignSelf: 'stretch',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendText: {
    fontSize: 14,
  },
  categoryList: {
    marginTop: spacing.md,
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    height: 200,
    gap: spacing.md,
  },
  trendBar: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 60,
  },
  trendBarFill: {
    width: 40,
    marginBottom: spacing.sm,
    borderRadius: 4,
  },
  trendLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  merchantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  merchantStats: {
    alignItems: 'flex-end',
  },
  merchantAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  merchantCount: {
    fontSize: 12,
  },
});

export default ReportsSystem;