import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../app/auth/AuthContext";
import { styles } from "./BalanceCard.styles";
import { SHADOWS } from "../../constants/Colors";

interface BalanceCardProps {
  totalBalance: number;
  isManualBalance?: boolean;
  onEditBalance?: (balance: number) => Promise<boolean>;
  onClearManualBalance?: () => Promise<boolean>;
  getTimeOfDay: () => string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalBalance,
  isManualBalance = false,
  onEditBalance,
  onClearManualBalance,
  getTimeOfDay,
  onRefresh,
  isRefreshing = false,
}) => {
  const { user } = useAuth();
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

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

  // Check if name looks like an Apple ID (starts with "apple" followed by alphanumeric string)
  const isAppleId = user?.name?.match(/^apple[a-f0-9]{20,}$/i);
  const displayName = user?.name && !isAppleId ? user.name.split(" ")[0] : null;

  return (
    <View style={styles.professionalBalanceWrapper}>
      <View
        style={[
          styles.professionalBalanceCard,
          SHADOWS.xl,
          { backgroundColor: "#6366F1" },
        ]}
      >
        <View style={styles.professionalBalanceHeader}>
          <View>
            <Text style={styles.professionalGreeting}>
              {displayName
                ? `Hello, ${displayName}`
                : `Good ${getTimeOfDay().toLowerCase()}`}
            </Text>
            <Text style={styles.professionalBalanceLabel}>Monthly Balance</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={toggleBalanceVisibility}
              style={styles.professionalBalanceIcon}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isBalanceHidden ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.professionalBalanceMain}>
          <View style={styles.balanceTouchable}>
            <Text style={styles.professionalBalanceAmount}>
              {displayBalance}
            </Text>
          </View>

          <View style={styles.professionalBalanceMetrics}>
            {totalBalance > 0 && (
              <View style={styles.professionalBalanceChange}>
                <View style={styles.professionalChangeIndicator}>
                  <Ionicons name="trending-up" size={14} color="#10B981" />
                  <Text style={styles.professionalChangeText}>--</Text>
                </View>
                <Text style={styles.professionalChangeLabel}>
                  vs last month
                </Text>
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
