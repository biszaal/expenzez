import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, shadows } from "../../constants/theme";

export default function CreditScorePage() {
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
          <Ionicons name="chevron-back" size={26} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text.primary }]}>
          Credit Score
        </Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.content}>
        <View
          style={[
            styles.scoreCard,
            { backgroundColor: colors.background.primary },
            shadows.md,
          ]}
        >
          <Text style={[styles.scoreTitle, { color: colors.text.primary }]}>
            Your Credit Score
          </Text>
          <Text style={[styles.scoreValue, { color: colors.primary[500] }]}>
            720
          </Text>
          <Text
            style={[styles.scoreDescription, { color: colors.text.secondary }]}
          >
            Good credit score
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.refreshButton,
            { backgroundColor: colors.primary[500] },
            shadows.sm,
          ]}
          onPress={() => {
            // TODO: Implement refresh functionality
          }}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.refreshButtonText}>Refresh Score</Text>
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
  scoreCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 8,
  },
  scoreDescription: {
    fontSize: 16,
    fontWeight: "500",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
