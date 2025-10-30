import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../app/auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

interface EnhancedBalanceCardProps {
  totalBalance: number;
  getTimeOfDay: () => string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const EnhancedBalanceCard: React.FC<EnhancedBalanceCardProps> = ({
  totalBalance,
  getTimeOfDay,
  onRefresh,
  isRefreshing = false,
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Load balance visibility preference
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const preference = await AsyncStorage.getItem("balanceHidden");
        if (preference !== null) {
          setIsBalanceHidden(preference === "true");
        }
      } catch (error) {
        console.error("Error loading balance visibility preference:", error);
      }
    };
    loadPreference();
  }, []);

  // Toggle balance visibility
  const toggleBalanceVisibility = async () => {
    try {
      const newValue = !isBalanceHidden;
      setIsBalanceHidden(newValue);
      await AsyncStorage.setItem("balanceHidden", newValue.toString());
    } catch (error) {
      console.error("Error saving balance visibility preference:", error);
    }
  };

  // Format balance display
  const displayBalance = isBalanceHidden
    ? "£••••••.••"
    : `£${totalBalance.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Pulse animation for refresh button
  useEffect(() => {
    if (isRefreshing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    return undefined;
  }, [isRefreshing, pulseAnim]);

  return (
    <View style={styles.balanceWrapper}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#A855F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        {/* Header Section */}
        <View style={styles.balanceHeader}>
          <View style={styles.balanceHeaderLeft}>
            <View style={styles.balanceIconContainer}>
              <Ionicons name="wallet" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.balanceTitle}>Total Balance</Text>
              <Text style={styles.balanceSubtitle}>All accounts</Text>
            </View>
          </View>
          <View style={styles.balanceActions}>
            {onRefresh && (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  onPress={onRefresh}
                  style={styles.balanceActionButton}
                  disabled={isRefreshing}
                >
                  <Ionicons
                    name="refresh"
                    size={20}
                    color="white"
                    style={isRefreshing ? { opacity: 0.5 } : undefined}
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
            <TouchableOpacity 
              style={styles.balanceActionButton}
              onPress={toggleBalanceVisibility}
            >
              <Ionicons
                name={isBalanceHidden ? "eye-off" : "eye"}
                size={20}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Balance Amount */}
        <View style={styles.balanceAmountContainer}>
          <Text style={styles.balanceAmount}>{displayBalance}</Text>
          <View style={styles.balanceChangeContainer}>
            <View style={styles.balanceChangeIndicator}>
              <Ionicons name="trending-up" size={16} color="#10B981" />
              <Text style={styles.balanceChangeText}>+2.5%</Text>
            </View>
            <Text style={styles.balanceChangeLabel}>vs last month</Text>
          </View>
        </View>
        
        {/* Decorative Elements */}
        <View style={styles.balanceDecoration1} />
        <View style={styles.balanceDecoration2} />
        <View style={styles.balanceDecoration3} />
      </LinearGradient>
    </View>
  );
};

const styles = {
  balanceWrapper: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  balanceHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 20,
  },
  balanceHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  balanceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
    marginBottom: 2,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  balanceActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  balanceAmountContainer: {
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: 'white',
    marginBottom: 8,
  },
  balanceChangeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  balanceChangeIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  balanceChangeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#10B981',
    marginLeft: 4,
  },
  balanceChangeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  balanceDecoration1: {
    position: 'absolute' as const,
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceDecoration2: {
    position: 'absolute' as const,
    bottom: -30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  balanceDecoration3: {
    position: 'absolute' as const,
    top: 20,
    left: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
};
