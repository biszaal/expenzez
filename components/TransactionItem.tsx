import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/formatters';
import { getMerchantInfo } from '../services/merchantService';
import dayjs from 'dayjs';

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  category?: string;
  accountId?: string;
  accountName?: string;
  institution?: string | { name: string; logo?: string };
  type?: 'debit' | 'credit';
  balance?: number;
  merchant?: string;
  [key: string]: any;
}

interface TransactionItemProps {
  transaction: Transaction;
  showDate?: boolean;
  showAccount?: boolean;
}

export default function TransactionItem({ 
  transaction, 
  showDate = false, 
  showAccount = true 
}: TransactionItemProps) {
  const { colors } = useTheme();
  
  // Get merchant information
  const merchantInfo = getMerchantInfo(transaction.description);
  
  // Determine if it's income or expense
  const isIncome = transaction.amount > 0;
  const displayAmount = Math.abs(transaction.amount);
  
  // Format the time if showing date
  const timeString = showDate && transaction.date 
    ? dayjs(transaction.date).format('HH:mm')
    : null;
  
  // Get account name or type for display
  const accountDisplay = transaction.accountName || 
    (transaction.accountId ? `${transaction.accountId.slice(-4)}` : 'Account');

  // Get category color for indicator
  const getCategoryColor = (category?: string) => {
    const categoryColors: Record<string, string> = {
      'food': '#F59E0B',
      'transport': '#3B82F6',
      'entertainment': '#8B5CF6',
      'shopping': '#EC4899',
      'bills': '#EF4444',
      'health': '#10B981',
      'other': '#6B7280',
    };
    const normalizedCategory = category?.toLowerCase() || 'other';
    return categoryColors[normalizedCategory] || categoryColors['other'];
  };

  const categoryColor = getCategoryColor(transaction.category);

  return (
    <View style={[styles.container, { borderBottomColor: colors.border.light }]}>
      {/* Category color indicator */}
      <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />

      {/* Left: Logo */}
      <View style={[styles.logoContainer, { backgroundColor: colors.background.tertiary }]}>
        <Text style={styles.logoText}>{merchantInfo.logo}</Text>
      </View>

      {/* Center: Transaction Details */}
      <View style={styles.detailsContainer}>
        <Text
          style={[styles.merchantName, { color: colors.text.primary }]}
          numberOfLines={1}
        >
          {merchantInfo.name}
        </Text>

        <View style={styles.metaRow}>
          {transaction.category && (
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {transaction.category}
              </Text>
            </View>
          )}

          {timeString && (
            <Text style={[styles.metaText, { color: colors.text.secondary }]}>
              • {timeString}
            </Text>
          )}

          {showAccount && (
            <Text style={[styles.metaText, { color: colors.text.secondary }]}>
              • {accountDisplay}
            </Text>
          )}
        </View>
      </View>

      {/* Right: Amount */}
      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amount,
            {
              color: isIncome
                ? colors.success[500]
                : colors.text.primary
            }
          ]}
        >
          {isIncome ? '+' : ''}{formatCurrency(displayAmount)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingLeft: 8,
    borderBottomWidth: 0.5,
  },
  categoryIndicator: {
    width: 4,
    height: 44,
    borderRadius: 2,
    marginRight: 12,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 20,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  merchantName: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 90,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
});