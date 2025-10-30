import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import { spacing, borderRadius, shadows } from "../../constants/theme";

function CreditScorePage() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showSuccess, showError } = useAlert();

  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreditScore();
  }, []);

  const fetchCreditScore = async () => {
    try {
      setLoading(true);
      // TODO: Fetch real credit score from API
      // For now, we'll use a placeholder
      setCreditScore(null);
    } catch (error) {
      console.error("Error fetching credit score:", error);
      showError("Failed to load credit score");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchCreditScore();
      showSuccess("Credit score refreshed");
    } catch (error) {
      showError("Failed to refresh credit score");
    }
  };

  const getScoreDescription = (score: number | null) => {
    if (score === null) return "No data available";
    if (score >= 800) return "Excellent credit score";
    if (score >= 700) return "Good credit score";
    if (score >= 600) return "Fair credit score";
    return "Poor credit score";
  };

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
          onPress={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
          style={[
            styles.backButton,
            { backgroundColor: colors.background.primary },
            shadows.sm,
          ]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary.main} />
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
          <Text style={[styles.scoreValue, { color: colors.primary.main }]}>
            {creditScore !== null ? creditScore : "N/A"}
          </Text>
          <Text
            style={[styles.scoreDescription, { color: colors.text.secondary }]}
          >
            {getScoreDescription(creditScore)}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.refreshButton,
            { backgroundColor: colors.primary.main },
            shadows.sm,
          ]}
          onPress={handleRefresh}
          disabled={loading}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.refreshButtonText}>
            {loading ? "Refreshing..." : "Refresh Score"}
          </Text>
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

// All users have free access to credit score monitoring
export default CreditScorePage;
