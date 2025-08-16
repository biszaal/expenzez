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

  return (
    <View style={[styles.container, { borderBottomColor: colors.border.light }]}>
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
          {timeString && (
            <Text style={[styles.metaText, { color: colors.text.secondary }]}>
              {timeString}
            </Text>
          )}
          
          {showAccount && (
            <Text style={[styles.metaText, { color: colors.text.secondary }]}>
              {accountDisplay}
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
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 18,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 80,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
});