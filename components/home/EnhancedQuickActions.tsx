import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";

const { width } = Dimensions.get("window");

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  colors: string[];
  route: string;
}

const quickActions: QuickAction[] = [
  {
    id: "ai-insights",
    title: "AI Insights",
    subtitle: "Smart analysis",
    icon: "sparkles",
    colors: ["#8B5CF6", "#A855F7"] as const,
    route: "/ai-assistant",
  },
  {
    id: "add-entry",
    title: "Add Entry",
    subtitle: "Quick input",
    icon: "add-circle",
    colors: ["#3B82F6", "#2563EB"] as const,
    route: "/add-transaction",
  },
  {
    id: "analytics",
    title: "Analytics",
    subtitle: "Track spending",
    icon: "analytics",
    colors: ["#0EA5E9", "#0284C7"] as const,
    route: "/spending",
  },
  {
    id: "import-csv",
    title: "Import CSV",
    subtitle: "Upload data",
    icon: "document-text",
    colors: ["#F59E0B", "#D97706"] as const,
    route: "/import-csv",
  },
];

export const EnhancedQuickActions: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Quick Actions
      </Text>
      <View style={styles.grid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={() => handlePress(action.route)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={action.colors as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name={action.icon as any} size={28} color="white" />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = {
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  actionCard: {
    width: (width - 64) / 2,
    height: 120,
    borderRadius: 16,
    overflow: "hidden" as const,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionGradient: {
    flex: 1,
    padding: 16,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "white",
    marginBottom: 2,
    textAlign: "center" as const,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center" as const,
  },
};
