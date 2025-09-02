import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { categoryMerchantSwitchStyles } from './CategoryMerchantSwitch.styles';

interface CategoryMerchantSwitchProps {
  spendingTab: string;
  setSpendingTab: (tab: string) => void;
}

export const CategoryMerchantSwitch: React.FC<CategoryMerchantSwitchProps> = ({
  spendingTab,
  setSpendingTab
}) => {
  const { colors } = useTheme();
  const styles = categoryMerchantSwitchStyles;

  return (
    <View style={styles.premiumCategoryTabContainer}>
      <View
        style={[
          styles.premiumCategoryTabSwitch,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.premiumCategoryTabButton,
            {
              backgroundColor:
                spendingTab === "categories"
                  ? colors.primary[500]
                  : "transparent",
            },
          ]}
          onPress={() => setSpendingTab("categories")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="grid"
            size={18}
            color={
              spendingTab === "categories"
                ? colors.text.inverse
                : colors.primary[500]
            }
          />
          <Text
            style={[
              styles.premiumCategoryTabText,
              {
                color:
                  spendingTab === "categories"
                    ? colors.text.inverse
                    : colors.primary[500],
              },
            ]}
          >
            Categories
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.premiumCategoryTabButton,
            {
              backgroundColor:
                spendingTab === "merchants"
                  ? colors.primary[500]
                  : "transparent",
            },
          ]}
          onPress={() => setSpendingTab("merchants")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="storefront"
            size={18}
            color={
              spendingTab === "merchants"
                ? colors.text.inverse
                : colors.primary[500]
            }
          />
          <Text
            style={[
              styles.premiumCategoryTabText,
              {
                color:
                  spendingTab === "merchants"
                    ? colors.text.inverse
                    : colors.primary[500],
              },
            ]}
          >
            Merchants
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};