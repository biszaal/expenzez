import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { CategoryIcon } from '../utils/CategoryIcon';
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
  [key: string]: any;
}

interface SpendingCategoryListProps {
  sortedCategoryData: CategoryData[];
  filteredTransactions: Transaction[];
  formatAmount: (amount: number, currency?: string) => string;
  currency: string;
  onCategoryPress?: (category: CategoryData) => void;
}

export const SpendingCategoryList: React.FC<SpendingCategoryListProps> = ({
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
        const budget = category.defaultBudget || 0;
        const spent = category.monthlySpent || 0;
        const left = Math.max(0, budget - spent);
        
        // Fix percentage calculation to handle edge cases and cap at reasonable maximum
        let percent = 0;
        if (budget > 0) {
          const rawPercent = (spent / budget) * 100;
          // Cap display percentage at 999% to prevent UI overflow, but still calculate properly
          percent = Math.min(999, Math.round(rawPercent));
        }
        
        const overBudget = spent > budget;
        
        // Count transactions for this category in selected month
        const categoryTransactions = filteredTransactions.filter(
          (tx) => tx.category === category.name
        );
        
        const txnCount = categoryTransactions.length;
        
        // Get top merchants for this category (first 3)
        const merchants = categoryTransactions
          .filter(tx => tx.merchant) // Only transactions with merchant info
          .map(tx => tx.merchant)
          .filter((merchant, index, arr) => arr.indexOf(merchant) === index) // Remove duplicates
          .slice(0, 3); // Take first 3

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
            accessibilityLabel={`Edit budget for ${category.name}`}
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
                overBudget && {
                  borderColor: colors.error[400],
                  backgroundColor: "#FEF2F2",
                },
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
                    {renderCategoryIcon(
                      category.icon,
                      category.color
                    )}
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
                          {
                            color: overBudget
                              ? colors.error[500]
                              : colors.text.primary,
                          },
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
                        of {formatAmount(budget, currency)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.categoryCardHeaderRight}>
                  <Text
                    style={[
                      styles.categoryCardPercentage,
                      {
                        color: overBudget
                          ? colors.error[500]
                          : percent > 80
                          ? colors.warning[500]
                          : colors.success[500],
                      },
                    ]}
                  >
                    {percent}%
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.categoryCardProgress}>
                <View
                  style={[
                    styles.categoryCardProgressTrack,
                    { backgroundColor: colors.background.secondary },
                  ]}
                >
                  <View
                    style={[
                      styles.categoryCardProgressBar,
                      {
                        width: `${Math.min(percent, 100)}%`,
                        backgroundColor: overBudget
                          ? colors.error[500]
                          : percent > 80
                          ? colors.warning[500]
                          : colors.primary[500],
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Bottom Stats */}
              <View style={styles.categoryCardStats}>
                <View style={styles.categoryCardStat}>
                  <Text
                    style={[
                      styles.categoryCardStatLabel,
                      { color: colors.text.tertiary },
                    ]}
                  >
                    Remaining
                  </Text>
                  <Text
                    style={[
                      styles.categoryCardStatValue,
                      {
                        color: overBudget
                          ? colors.error[500]
                          : colors.success[500],
                      },
                    ]}
                  >
                    {overBudget
                      ? `Over ${formatAmount(Math.abs(left), currency)}`
                      : formatAmount(left, currency)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        );
      })}
    </View>
  );
};