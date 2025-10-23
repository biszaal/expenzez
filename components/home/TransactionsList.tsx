import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { APP_STRINGS } from '../../constants/strings';
import { styles } from './TransactionsList.styles';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  category?: string;
}

interface TransactionsListProps {
  transactions: Transaction[];
  refreshingTransactions: boolean;
  onRefreshTransactions: () => void;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  refreshingTransactions,
  onRefreshTransactions,
}) => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.secondary }]}
    >
        <View style={styles.premiumTransactionsHeader}>
          <View style={styles.premiumTransactionsHeaderLeft}>
            <View style={[styles.premiumTransactionsIcon, { backgroundColor: colors.primary[500] }]}>
              <Ionicons name="receipt" size={20} color="white" />
            </View>
            <View style={styles.premiumTransactionsHeaderText}>
              <Text style={[styles.premiumTransactionsTitle, { color: colors.text.primary }]}>
                {APP_STRINGS.TRANSACTIONS.RECENT_TRANSACTIONS}
              </Text>
              <Text style={[styles.premiumTransactionsSubtitle, { color: colors.text.secondary }]}>
                Latest activity
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.premiumTransactionsRefresh, { backgroundColor: colors.primary[500] }]}
            onPress={onRefreshTransactions}
            disabled={refreshingTransactions}
          >
            {refreshingTransactions ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="refresh" size={16} color="white" />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.premiumTransactionsList}>
          {transactions.slice(0, 4).map((tx, idx) => (
            <View key={tx.id} style={[
              styles.premiumTransactionItem,
              idx < 3 && { borderBottomWidth: 1, borderBottomColor: colors.background.secondary }
            ]}>
              <View style={[styles.premiumTransactionIcon, { 
                backgroundColor: tx.amount >= 0 ? colors.success[100] : colors.error[100] 
              }]}>
                <Ionicons
                  name={tx.amount >= 0 ? "arrow-up-circle" : "arrow-down-circle"}
                  size={24}
                  color={tx.amount >= 0 ? colors.success[600] : colors.error[600]}
                />
              </View>
              <View style={styles.premiumTransactionContent}>
                <Text style={[styles.premiumTransactionTitle, { color: colors.text.primary }]} numberOfLines={1}>
                  {tx.description}
                </Text>
                <Text style={[styles.premiumTransactionDate, { color: colors.text.secondary }]}>
                  {new Date(tx.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.premiumTransactionAmountContainer}>
                <Text style={[styles.premiumTransactionAmount, {
                  color: tx.amount >= 0 ? colors.success[600] : colors.error[600]
                }]}>
                  £{Math.abs(tx.amount).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>
        
        {transactions.length === 0 && (
          <View style={styles.premiumEmptyState}>
            <View style={[styles.premiumEmptyIcon, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="receipt-outline" size={32} color={colors.text.tertiary} />
            </View>
            <Text style={[styles.premiumEmptyTitle, { color: colors.text.primary }]}>
              No transactions yet
            </Text>
            <Text style={[styles.premiumEmptySubtitle, { color: colors.text.secondary }]}>
              Connect a bank to see your transactions
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.premiumViewAllTransactions, { backgroundColor: colors.primary[500] }]}
          onPress={() => router.push("/transactions")}
        >
          <Text style={styles.premiumViewAllTransactionsText}>View All Transactions</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
    </View>
  );
};