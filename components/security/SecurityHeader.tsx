import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { shadows } from "../../constants/theme";

interface SecurityHeaderProps {
  title: string;
  onBack: () => void;
}

export const SecurityHeader: React.FC<SecurityHeaderProps> = ({
  title,
  onBack,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.header, { backgroundColor: colors.background.primary }]}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: colors.background.secondary },
            shadows.sm,
          ]}
          onPress={onBack}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.primary.main}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {title}
        </Text>
        <View style={styles.headerRight} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },
});
