import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../app/auth/AuthContext';
import { styles } from './BalanceCard.styles';
import { SHADOWS } from '../../constants/Colors';

interface BalanceCardProps {
  totalBalance: number;
  getTimeOfDay: () => string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalBalance,
  getTimeOfDay,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  return (
    <View style={styles.professionalBalanceWrapper}>
      <View
        style={[styles.professionalBalanceCard, SHADOWS.xl, { backgroundColor: '#6366F1' }]}
      >
        <View style={styles.professionalBalanceHeader}>
          <View>
            <Text style={styles.professionalGreeting}>
              {user?.name ? `Hello, ${user.name.split(" ")[0]}` : `Good ${getTimeOfDay().toLowerCase()}`}
            </Text>
            <Text style={styles.professionalBalanceLabel}>
              Monthly Balance
            </Text>
          </View>
          <View style={styles.professionalBalanceIcon}>
            <Ionicons name="wallet-outline" size={26} color="white" />
          </View>
        </View>
        
        <View style={styles.professionalBalanceMain}>
          <Text style={styles.professionalBalanceAmount}>
            £{totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.professionalBalanceMetrics}>
            {totalBalance > 0 && (
              <View style={styles.professionalBalanceChange}>
                <View style={styles.professionalChangeIndicator}>
                  <Ionicons name="trending-up" size={14} color="#10B981" />
                  <Text style={styles.professionalChangeText}>--</Text>
                </View>
                <Text style={styles.professionalChangeLabel}>vs last month</Text>
              </View>
            )}
          </View>
        </View>
        
        
        {/* Professional Decorative Elements */}
        <View style={styles.professionalDecoration1} />
        <View style={styles.professionalDecoration2} />
        <View style={styles.professionalDecoration3} />
      </View>
    </View>
  );
};