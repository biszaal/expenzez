import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { spendingTabSwitchStyles } from './SpendingTabSwitch.styles';

interface SpendingTabSwitchProps {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

export const SpendingTabSwitch: React.FC<SpendingTabSwitchProps> = ({ 
  selectedTab, 
  setSelectedTab 
}) => {
  const { colors } = useTheme();
  const styles = spendingTabSwitchStyles;

  return (
    <View style={styles.premiumTabContainer}>
      <View
        style={[
          styles.premiumTabSwitch,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.premiumTabButton,
            {
              backgroundColor:
                selectedTab === "summary"
                  ? colors.primary[500]
                  : "transparent",
            },
          ]}
          onPress={() => setSelectedTab("summary")}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.premiumTabIcon,
              {
                backgroundColor:
                  selectedTab === "summary"
                    ? `${colors.text.inverse}25`
                    : `${colors.primary[500]}15`,
              },
            ]}
          >
            <Ionicons
              name="wallet"
              size={20}
              color={
                selectedTab === "summary"
                  ? colors.text.inverse
                  : colors.primary[500]
              }
            />
          </View>
          <Text
            style={[
              styles.premiumTabText,
              {
                color:
                  selectedTab === "summary"
                    ? colors.text.inverse
                    : colors.primary[500],
              },
            ]}
          >
            Budget
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.premiumTabButton,
            {
              backgroundColor:
                selectedTab === "categories"
                  ? colors.primary[500]
                  : "transparent",
            },
          ]}
          onPress={() => setSelectedTab("categories")}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.premiumTabIcon,
              {
                backgroundColor:
                  selectedTab === "categories"
                    ? `${colors.text.inverse}25`
                    : `${colors.primary[500]}15`,
              },
            ]}
          >
            <Ionicons
              name="analytics"
              size={20}
              color={
                selectedTab === "categories"
                  ? colors.text.inverse
                  : colors.primary[500]
              }
            />
          </View>
          <Text
            style={[
              styles.premiumTabText,
              {
                color:
                  selectedTab === "categories"
                    ? colors.text.inverse
                    : colors.primary[500],
              },
            ]}
          >
            Spending
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};