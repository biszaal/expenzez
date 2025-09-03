import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SHADOWS } from '../../constants/Colors';
import { styles } from './MonthlyOverview.styles';

interface MonthlyOverviewProps {
  thisMonthSpent: number;
  userBudget: number | null;
}

export const MonthlyOverview: React.FC<MonthlyOverviewProps> = ({
  thisMonthSpent,
  userBudget,
}) => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.professionalMonthlyWrapper}>
      <View style={[styles.professionalMonthlyCard, { backgroundColor: colors.background.primary }, SHADOWS.lg]}>
        <View style={styles.professionalMonthlyHeader}>
          <View style={styles.professionalMonthlyHeaderLeft}>
            <View style={[styles.professionalMonthlyIcon, { backgroundColor: colors.primary[500] }]}>
              <Ionicons name="calendar-outline" size={22} color="white" />
            </View>
            <View style={styles.professionalMonthlyHeaderText}>
              <Text style={[styles.professionalMonthlyTitle, { color: colors.text.primary }]}>
                This Month
              </Text>
              <Text style={[styles.professionalMonthlySubtitle, { color: colors.text.secondary }]}>
                Spending overview
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.professionalViewAllButton, { backgroundColor: colors.primary[100] }]}
            onPress={() => router.push("/spending")}
            activeOpacity={0.7}
          >
            <Text style={[styles.professionalViewAllText, { color: colors.primary[500] }]}>
              View All
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.professionalMonthlyStats}>
          <View style={styles.professionalMonthlyStat}>
            <View style={styles.professionalMonthlyStatHeader}>
              <Text style={[styles.professionalMonthlyStatLabel, { color: colors.text.secondary }]}>
                Spent
              </Text>
              {thisMonthSpent > 0 && (
                <View style={styles.professionalStatBadgeNegative}>
                  <Ionicons name="trending-down" size={12} color="#EF4444" />
                  <Text style={styles.professionalStatBadgeNegativeText}>--</Text>
                </View>
              )}
            </View>
            <Text style={[styles.professionalMonthlyStatValue, { color: colors.text.primary }]}>
              £{thisMonthSpent.toFixed(2)}
            </Text>
            <View style={[styles.professionalMonthlyStatProgress, { backgroundColor: colors.background.secondary }]}>
              <View style={[styles.professionalMonthlyStatProgressFill, { 
                backgroundColor: '#EF4444',
                width: userBudget ? `${Math.min(100, (thisMonthSpent / userBudget) * 100)}%` : '25%'
              }]} />
            </View>
          </View>
          
          <View style={styles.professionalMonthlyStatDivider} />
          
          <View style={styles.professionalMonthlyStat}>
            <View style={styles.professionalMonthlyStatHeader}>
              <Text style={[styles.professionalMonthlyStatLabel, { color: colors.text.secondary }]}>
                Budget
              </Text>
              {userBudget && thisMonthSpent > 0 && (
                <View style={styles.professionalStatBadgePositive}>
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                  <Text style={styles.professionalStatBadgePositiveText}>
                    {thisMonthSpent <= userBudget ? 'On track' : 'Over budget'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.professionalMonthlyStatValue, { color: colors.text.primary }]}>
              £{(userBudget || 0).toFixed(2)}
            </Text>
            <View style={[styles.professionalMonthlyStatProgress, { backgroundColor: colors.background.secondary }]}>
              <View style={[styles.professionalMonthlyStatProgressFill, { 
                backgroundColor: '#10B981',
                width: userBudget && thisMonthSpent > 0 ? `${Math.min(100, ((userBudget - thisMonthSpent) / userBudget) * 100)}%` : '0%'
              }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};