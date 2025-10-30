import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, shadows } from "../../constants/theme";

export default function TargetPage() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: colors.background.primary },
            shadows.sm,
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary.main} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text.primary }]}>
          Financial Goals
        </Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.content}>
        <View
          style={[
            styles.goalCard,
            { backgroundColor: colors.background.primary },
            shadows.md,
          ]}
        >
          <View style={styles.goalHeader}>
            <Ionicons
              name="flag-outline"
              size={24}
              color={colors.primary.main}
            />
            <Text style={[styles.goalTitle, { color: colors.text.primary }]}>
              Emergency Fund
            </Text>
          </View>
          <View style={styles.goalProgress}>
            <Text style={[styles.goalAmount, { color: colors.text.primary }]}>
              £2,400 / £5,000
            </Text>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: colors.gray[200] },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary.main,
                    width: "48%", // 2400/5000 = 48%
                  },
                ]}
              />
            </View>
            <Text
              style={[styles.goalDescription, { color: colors.text.secondary }]}
            >
              48% complete • £2,600 remaining
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: colors.primary.main },
            shadows.sm,
          ]}
          onPress={() => {
            // TODO: Implement add goal functionality
          }}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add New Goal</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 14,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  goalCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  goalProgress: {
    gap: 12,
  },
  goalAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  goalDescription: {
    fontSize: 14,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
