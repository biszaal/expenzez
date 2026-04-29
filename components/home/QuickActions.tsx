import React from "react";
import { View, TouchableOpacity, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SHADOWS } from "../../constants/Colors";
import { styles } from "./QuickActions.styles";

export const QuickActions: React.FC = () => {
  const router = useRouter();

  const handleImportPress = () => {
    Alert.alert(
      "Import transactions",
      "Choose what to upload",
      [
        {
          text: "PDF statement",
          onPress: () => router.push("/import-statement" as any),
        },
        {
          text: "CSV file",
          onPress: () => router.push("/import-csv"),
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.professionalQuickActionsWrapper}>
      <View style={styles.professionalQuickActionsGrid}>
        <TouchableOpacity
          style={styles.professionalQuickActionCard}
          onPress={() => router.push("/ai-assistant")}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.professionalQuickActionGradient,
              SHADOWS.lg,
              { backgroundColor: "#7B2D8E" },
            ]}
          >
            <View style={styles.professionalQuickActionIconContainer}>
              <View style={styles.professionalQuickActionIcon}>
                <Ionicons name="sparkles" size={24} color="white" />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>
                AI Insights
              </Text>
              <Text style={styles.professionalQuickActionSubtitle}>
                Smart analysis
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.professionalQuickActionCard}
          onPress={() => router.push("/add-transaction")}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.professionalQuickActionGradient,
              SHADOWS.lg,
              { backgroundColor: "#22C55E" },
            ]}
          >
            <View style={styles.professionalQuickActionIconContainer}>
              <View style={styles.professionalQuickActionIcon}>
                <Ionicons name="wallet-outline" size={24} color="white" />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>Add Entry</Text>
              <Text style={styles.professionalQuickActionSubtitle}>
                Quick input
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.professionalQuickActionCard}
          onPress={() => router.push("/spending")}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.professionalQuickActionGradient,
              SHADOWS.lg,
              { backgroundColor: "#6366F1" },
            ]}
          >
            <View style={styles.professionalQuickActionIconContainer}>
              <View style={styles.professionalQuickActionIcon}>
                <Ionicons name="analytics-outline" size={24} color="white" />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>Analytics</Text>
              <Text style={styles.professionalQuickActionSubtitle}>
                Track spending
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.professionalQuickActionCard}
          onPress={handleImportPress}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.professionalQuickActionGradient,
              SHADOWS.lg,
              { backgroundColor: "#EC4899" },
            ]}
          >
            <View style={styles.professionalQuickActionIconContainer}>
              <View style={styles.professionalQuickActionIcon}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={24}
                  color="white"
                />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>Import</Text>
              <Text style={styles.professionalQuickActionSubtitle}>
                CSV or PDF
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
