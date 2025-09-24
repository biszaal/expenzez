import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { getMerchantInfo } from '../../../services/merchantService';
import { spendingCategoryListStyles } from './SpendingCategoryList.styles';

interface MerchantData {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlySpent?: number;
  category?: string;
}

interface Transaction {
  description?: string;
  merchant?: string;
  amount: number;
  [key: string]: any;
}

interface SpendingMerchantListProps {
  sortedMerchantData: MerchantData[];
  filteredTransactions: Transaction[];
  formatAmount: (amount: number, currency?: string) => string;
  currency: string;
  onMerchantPress?: (merchant: MerchantData) => void;
}

export const SpendingMerchantList: React.FC<SpendingMerchantListProps> = ({
  sortedMerchantData,
  filteredTransactions,
  formatAmount,
  currency,
  onMerchantPress
}) => {
  const { colors } = useTheme();
  const styles = spendingCategoryListStyles;

  const renderMerchantIcon = (icon: string) => {
    return (
      <Text style={{ fontSize: 24 }}>{icon}</Text>
    );
  };

  if (sortedMerchantData.length === 0) {
    return (
      <View style={styles.categoriesTabWrapper}>
        <View style={styles.emptyStateContainer}>
          <FontAwesome5
            name="store"
            size={48}
            color={colors.gray[400]}
          />
          <Text
            style={[
              styles.emptyStateTitle,
              { color: colors.text.secondary },
            ]}
          >
            No merchants found.
          </Text>
          <Text
            style={[
              styles.emptyStateSubtitle,
              { color: colors.text.tertiary },
            ]}
          >
            Add expenses to see where you&apos;re spending your money.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.categoriesTabWrapper}>
      {sortedMerchantData.map((merchant) => {
        const spent = merchant.monthlySpent || 0;

        // Count transactions for this merchant using merchant service
        const merchantTransactions = filteredTransactions.filter((tx) => {
          const description = tx.description || tx.merchant || '';
          if (description) {
            const merchantInfo = getMerchantInfo(description);
            return merchantInfo.name === merchant.name;
          }
          return false;
        });

        const txnCount = merchantTransactions.length;

        // Calculate average transaction amount
        const avgAmount = txnCount > 0 ? spent / txnCount : 0;

        return (
          <Pressable
            key={merchant.id}
            style={({ pressed }) => [
              styles.categoryCardPressable,
              {
                transform: [{ scale: pressed ? 0.98 : 1 }],
                shadowColor: colors.primary[500],
                shadowOpacity: pressed ? 0.15 : 0.08,
                shadowRadius: 12,
                elevation: pressed ? 4 : 2,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`View transactions for ${merchant.name}`}
            onPress={() => onMerchantPress?.(merchant)}
          >
            <LinearGradient
              colors={[
                colors.background.primary,
                colors.background.primary,
              ]}
              style={[
                styles.categoryCard,
                { borderColor: colors.border.light },
              ]}
            >
              <View style={styles.categoryCardHeader}>
                <View style={styles.categoryCardHeaderLeft}>
                  <View
                    style={[
                      styles.categoryIconBg,
                      { backgroundColor: merchant.color + "22" },
                    ]}
                  >
                    {renderMerchantIcon(merchant.icon)}
                  </View>
                  <View style={styles.categoryCardHeaderContent}>
                    <View style={styles.categoryCardHeaderTop}>
                      <Text
                        style={[
                          styles.categoryCardTitle,
                          { color: colors.text.primary },
                        ]}
                      >
                        {merchant.name}
                      </Text>
                      <Text
                        style={[
                          styles.categoryCardAmount,
                          { color: colors.text.primary },
                        ]}
                      >
                        {formatAmount(spent, currency)}
                      </Text>
                    </View>
                    <View style={styles.categoryCardHeaderBottom}>
                      <Text
                        style={[
                          styles.categoryCardTransactions,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {txnCount} transaction{txnCount !== 1 ? 's' : ''}
                      </Text>
                      <Text
                        style={[
                          styles.categoryCardBudget,
                          { color: colors.text.secondary },
                        ]}
                      >
                        avg {formatAmount(avgAmount, currency)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.categoryCardHeaderRight}>
                  <View
                    style={[
                      styles.categoryIconBg,
                      {
                        backgroundColor: merchant.color + "15",
                        width: 32,
                        height: 32,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 16 }}>{merchant.icon}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        );
      })}
    </View>
  );
};