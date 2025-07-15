import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, shadows } from "../../constants/theme";

export default function SettingsPage() {
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
          Settings
        </Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.content}>
        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.border.light,
            },
            shadows.sm,
          ]}
        >
          <Ionicons
            name="mail-outline"
            size={22}
            color={colors.primary[500]}
            style={{ marginRight: 14 }}
          />
          <Text style={[styles.settingText, { color: colors.text.primary }]}>
            Change Email
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.border.light,
            },
            shadows.sm,
          ]}
        >
          <Ionicons
            name="key-outline"
            size={22}
            color={colors.primary[500]}
            style={{ marginRight: 14 }}
          />
          <Text style={[styles.settingText, { color: colors.text.primary }]}>
            Change Password
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.border.light,
            },
            shadows.sm,
          ]}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={colors.primary[500]}
            style={{ marginRight: 14 }}
          />
          <Text style={[styles.settingText, { color: colors.text.primary }]}>
            Notifications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.border.light,
            },
            shadows.sm,
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={22}
            color={colors.primary[500]}
            style={{ marginRight: 14 }}
          />
          <Text style={[styles.settingText, { color: colors.text.primary }]}>
            Security
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
    marginTop: 28,
    paddingHorizontal: 24,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  settingText: {
    fontWeight: "500",
    fontSize: 16,
  },
});
