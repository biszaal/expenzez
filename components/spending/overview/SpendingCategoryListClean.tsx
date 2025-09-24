import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { CategoryIcon } from '../utils/CategoryIcon';
import { getMerchantInfo } from '../../../services/merchantService';
import { spendingCategoryListStyles } from './SpendingCategoryList.styles';

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultBudget?: number;
  monthlySpent?: number;
}

interface Transaction {
  category: string;
  amount: number;
  merchant?: string;
  description?: string;
  [key: string]: any;
}

interface SpendingCategoryListCleanProps {
  sortedCategoryData: CategoryData[];
  filteredTransactions: Transaction[];
  formatAmount: (amount: number, currency?: string) => string;
  currency: string;
  onCategoryPress?: (category: CategoryData) => void;
}

export const SpendingCategoryListClean: React.FC<SpendingCategoryListCleanProps> = ({
  sortedCategoryData,
  filteredTransactions,
  formatAmount,
  currency,
  onCategoryPress
}) => {
  const { colors } = useTheme();
  const styles = spendingCategoryListStyles;

  const renderCategoryIcon = (icon: string, color: string) => {
    return <CategoryIcon iconName={icon} color={color} size={24} />;
  };

  if (sortedCategoryData.length === 0) {
    return (
      <View style={styles.categoriesTabWrapper}>
        <View style={styles.emptyStateContainer}>
          <FontAwesome5
            name="inbox"
            size={48}
            color={colors.gray[400]}
          />
          <Text
            style={[
              styles.emptyStateTitle,
              { color: colors.text.secondary },
            ]}
          >
            No spending categories found.
          </Text>
          <Text
            style={[
              styles.emptyStateSubtitle,
              { color: colors.text.tertiary },
            ]}
          >
            Add a new expense to start tracking your spending.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.categoriesTabWrapper}>
      {sortedCategoryData.map((category) => {
        const spent = category.monthlySpent || 0;

        // Count transactions for this category
        const categoryTransactions = filteredTransactions.filter(
          (tx) => tx.category === category.name
        );

        const txnCount = categoryTransactions.length;

        // Calculate average transaction amount
        const avgAmount = txnCount > 0 ? spent / txnCount : 0;

        // Get top merchants for this category using merchant service
        const merchantCounts: Record<string, number> = {};
        categoryTransactions.forEach(tx => {
          const description = tx.description || tx.merchant || '';
          if (description) {
            const merchantInfo = getMerchantInfo(description);
            const merchantName = merchantInfo.name;
            merchantCounts[merchantName] = (merchantCounts[merchantName] || 0) + 1;
          }
        });

        // Sort merchants by frequency and take top 3
        const merchants = Object.entries(merchantCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([name]) => name);

        return (
          <Pressable
            key={category.id}
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
            accessibilityLabel={`View transactions for ${category.name}`}
            onPress={() => onCategoryPress?.(category)}
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
                      { backgroundColor: category.color + "22" },
                    ]}
                  >
                    {renderCategoryIcon(category.icon, category.color)}
                  </View>
                  <View style={styles.categoryCardHeaderContent}>
                    <View style={styles.categoryCardHeaderTop}>
                      <Text
                        style={[
                          styles.categoryCardTitle,
                          { color: colors.text.primary },
                        ]}
                      >
                        {category.name}
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
                        {merchants.length > 0
                          ? merchants.join(', ')
                          : `${txnCount} transaction${txnCount !== 1 ? 's' : ''}`
                        }
                      </Text>
                      <Text
                        style={[
                          styles.categoryCardBudget,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {txnCount > 0 ? `avg ${formatAmount(avgAmount, currency)}` : 'No transactions'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.categoryCardHeaderRight}>
                  <View
                    style={[
                      styles.categoryIconBg,
                      {
                        backgroundColor: category.color + "15",
                        width: 32,
                        height: 32,
                      },
                    ]}
                  >
                    {renderCategoryIcon(category.icon, category.color)}
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