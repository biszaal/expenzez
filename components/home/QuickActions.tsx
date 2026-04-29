import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SHADOWS } from "../../constants/Colors";
import { styles } from "./QuickActions.styles";

export const QuickActions: React.FC = () => {
  const router = useRouter();

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
          onPress={() => router.push("/import-csv")}
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
                  name="document-text-outline"
                  size={24}
                  color="white"
                />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>
                Import CSV
              </Text>
              <Text style={styles.professionalQuickActionSubtitle}>
                Upload data
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.professionalQuickActionCard}
          onPress={() => router.push("/import-statement" as any)}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.professionalQuickActionGradient,
              SHADOWS.lg,
              { backgroundColor: "#10B981" },
            ]}
          >
            <View style={styles.professionalQuickActionIconContainer}>
              <View style={styles.professionalQuickActionIcon}>
                <Ionicons
                  name="document-attach-outline"
                  size={24}
                  color="white"
                />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>
                Import Statement
              </Text>
              <Text style={styles.professionalQuickActionSubtitle}>
                Upload PDF
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
