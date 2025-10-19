import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBalance, setEditBalance] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [inlineEditValue, setInlineEditValue] = useState("");

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

  // Open edit modal
  const openEditModal = () => {
    setEditBalance(totalBalance.toString());
    setShowEditModal(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditBalance("");
  };

  // Handle balance edit
  const handleEditBalance = async () => {
    if (!editBalance.trim()) {
      Alert.alert("Error", "Please enter a valid balance amount");
      return;
    }

    const balance = parseFloat(editBalance);
    if (isNaN(balance)) {
      Alert.alert("Error", "Please enter a valid number");
      return;
    }

    if (balance < -999999999 || balance > 999999999) {
      Alert.alert(
        "Error",
        "Balance must be between -999,999,999 and 999,999,999"
      );
      return;
    }

    setIsEditing(true);
    try {
      const success = await onEditBalance?.(balance);
      if (success) {
        Alert.alert("Success", "Balance updated successfully");
        closeEditModal();
      } else {
        Alert.alert(
          "Error",
          "Failed to update balance. Please check your internet connection and try again."
        );
      }
    } catch (error) {
      console.error("Error updating balance:", error);
      Alert.alert(
        "Error",
        "Network error occurred. Please check your connection and try again."
      );
    } finally {
      setIsEditing(false);
    }
  };

  // Handle clear manual balance
  const handleClearManualBalance = async () => {
    Alert.alert(
      "Clear Manual Balance",
      "Are you sure you want to clear the manual balance and use calculated balance?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await onClearManualBalance?.();
              if (success) {
                Alert.alert("Success", "Manual balance cleared successfully");
              } else {
                Alert.alert(
                  "Error",
                  "Failed to clear manual balance. Please try again."
                );
              }
            } catch (error) {
              console.error("Error clearing manual balance:", error);
              Alert.alert(
                "Error",
                "Failed to clear manual balance. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // Handle inline editing
  const startInlineEdit = () => {
    setIsInlineEditing(true);
    setInlineEditValue(totalBalance.toFixed(2));
  };

  const cancelInlineEdit = () => {
    setIsInlineEditing(false);
    setInlineEditValue("");
  };

  const saveInlineEdit = async () => {
    const balance = parseFloat(inlineEditValue);
    if (isNaN(balance)) {
      Alert.alert("Error", "Please enter a valid number");
      return;
    }

    if (balance < -999999999 || balance > 999999999) {
      Alert.alert(
        "Error",
        "Balance must be between -999,999,999 and 999,999,999"
      );
      return;
    }

    setIsEditing(true);
    try {
      const success = await onEditBalance?.(balance);
      if (success) {
        setIsInlineEditing(false);
        setInlineEditValue("");
        Alert.alert("Success", "Balance updated successfully");
      } else {
        Alert.alert(
          "Error",
          "Failed to update balance. Please check your internet connection and try again."
        );
      }
    } catch (error) {
      console.error("Error updating balance:", error);
      Alert.alert(
        "Error",
        "Network error occurred. Please check your connection and try again."
      );
    } finally {
      setIsEditing(false);
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
          {isInlineEditing ? (
            <View style={styles.inlineEditContainer}>
              <TextInput
                style={styles.inlineEditInput}
                value={inlineEditValue}
                onChangeText={setInlineEditValue}
                keyboardType="numeric"
                autoFocus={true}
                selectTextOnFocus={true}
                placeholder="0.00"
              />
              <View style={styles.inlineEditButtons}>
                <TouchableOpacity
                  onPress={cancelInlineEdit}
                  style={styles.inlineEditButton}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveInlineEdit}
                  style={[styles.inlineEditButton, styles.inlineEditSaveButton]}
                  disabled={isEditing}
                >
                  <Ionicons
                    name={isEditing ? "hourglass" : "checkmark"}
                    size={20}
                    color={isEditing ? "#9CA3AF" : "#10B981"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={startInlineEdit}
              style={styles.balanceTouchable}
              activeOpacity={0.7}
            >
              <Text style={styles.professionalBalanceAmount}>
                {displayBalance}
              </Text>
            </TouchableOpacity>
          )}

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

      {/* Edit Balance Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Balance</Text>
              <TouchableOpacity
                onPress={closeEditModal}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Enter your current balance:</Text>
              <TextInput
                style={styles.modalInput}
                value={editBalance}
                onChangeText={setEditBalance}
                placeholder="0.00"
                keyboardType="numeric"
                autoFocus={true}
                selectTextOnFocus={true}
              />

              <Text style={styles.modalHint}>
                This will set a manual balance that overrides the calculated
                balance from your transactions.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={closeEditModal}
                style={[styles.modalButton, styles.modalCancelButton]}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleEditBalance}
                style={[styles.modalButton, styles.modalSaveButton]}
                disabled={isEditing}
              >
                <Text style={styles.modalSaveButtonText}>
                  {isEditing ? "Saving..." : "Save Balance"}
                </Text>
              </TouchableOpacity>
            </View>

            {isManualBalance && (
              <TouchableOpacity
                onPress={handleClearManualBalance}
                style={styles.modalClearButton}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.modalClearButtonText}>
                  Clear Manual Balance
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};
