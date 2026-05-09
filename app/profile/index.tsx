import React from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Text,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAlert } from "../../hooks/useAlert";
import { useTheme } from "../../contexts/ThemeContext";
import { fontFamily } from "../../constants/theme";

// v1.5 redesign — hairline back chip + 'Profile.' wordmark, sectioned
// list of menu items with category-tinted icons, hairline cards, and
// rose-token destructive items.

interface RowProps {
  icon: keyof typeof import("@expo/vector-icons/build/Ionicons").default.glyphMap;
  iconColor: string;
  iconTint: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  isLast?: boolean;
  colors: any;
}

const Row: React.FC<RowProps> = ({
  icon,
  iconColor,
  iconTint,
  title,
  subtitle,
  onPress,
  rightElement,
  destructive,
  isLast,
  colors,
}) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [
      styles.row,
      {
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: colors.border.medium,
        opacity: pressed && onPress ? 0.7 : 1,
      },
    ]}
  >
    <View style={[styles.rowIcon, { backgroundColor: iconTint }]}>
      <Ionicons name={icon as any} size={16} color={iconColor} />
    </View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text
        numberOfLines={1}
        style={[
          styles.rowTitle,
          {
            color: destructive ? colors.rose[500] : colors.text.primary,
            fontFamily: fontFamily.medium,
          },
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          numberOfLines={1}
          style={[
            styles.rowSubtitle,
            { color: colors.text.tertiary, fontFamily: fontFamily.medium },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
    {rightElement || (
      onPress && (
        <Ionicons
          name="chevron-forward"
          size={15}
          color={colors.text.tertiary}
        />
      )
    )}
  </Pressable>
);

const SectionLabel: React.FC<{ label: string; colors: any }> = ({
  label,
  colors,
}) => (
  <Text
    style={{
      paddingHorizontal: 28,
      paddingTop: 22,
      paddingBottom: 10,
      fontSize: 11,
      letterSpacing: 1.2,
      color: colors.text.tertiary,
      fontFamily: fontFamily.semibold,
    }}
  >
    {label}
  </Text>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuthGuard();
  const { showConfirmation } = useAlert();
  const { colors, isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    showConfirmation("Logout", "Are you sure you want to logout?", () => {
      router.replace("/auth/login");
    });
  };

  const handleDeleteAccount = () => {
    showConfirmation(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      () => {
        router.replace("/auth/login");
      },
      undefined,
      "Delete",
      "Cancel"
    );
  };

  if (!isLoggedIn) return null;

  const cardWrap = (children: React.ReactNode) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card.background,
          borderColor: colors.border.medium,
          marginHorizontal: 22,
        },
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backChip,
            {
              backgroundColor: colors.card.background,
              borderColor: colors.border.medium,
            },
          ]}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={colors.text.secondary}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.text.primary,
              fontFamily: fontFamily.semibold,
            },
          ]}
        >
          Profile
          <Text style={{ color: colors.primary[500] }}>.</Text>
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label="ACCOUNT" colors={colors} />
        {cardWrap(
          <>
            <Row
              icon="person-outline"
              iconColor={colors.primary[500]}
              iconTint={
                isDark ? "rgba(157,91,255,0.16)" : "rgba(123,63,228,0.12)"
              }
              title="Personal information"
              subtitle="Update your profile details"
              onPress={() => router.push("/profile/personal")}
              colors={colors}
            />
            <Row
              icon="notifications-outline"
              iconColor={colors.amber[500]}
              iconTint="rgba(245,179,66,0.14)"
              title="Notifications"
              subtitle="Push, email, transaction alerts"
              onPress={() => router.push("/notifications" as any)}
              colors={colors}
            />
            <Row
              icon="card-outline"
              iconColor={colors.lime[500]}
              iconTint={colors.posBg}
              title="Payment methods"
              subtitle="Manage your payment options"
              onPress={() => router.push("/payment" as any)}
              isLast
              colors={colors}
            />
          </>
        )}

        <SectionLabel label="APPEARANCE" colors={colors} />
        {cardWrap(
          <Row
            icon="color-palette-outline"
            iconColor={colors.cyan[500]}
            iconTint="rgba(91,200,255,0.14)"
            title="Dark mode"
            subtitle="Choose your preferred theme"
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{
                  false: colors.border.dark,
                  true: colors.primary[500],
                }}
                thumbColor="#fff"
                ios_backgroundColor={colors.border.dark}
              />
            }
            isLast
            colors={colors}
          />
        )}

        <SectionLabel label="SECURITY" colors={colors} />
        {cardWrap(
          <>
            <Row
              icon="shield-checkmark-outline"
              iconColor={colors.primary[500]}
              iconTint={
                isDark ? "rgba(157,91,255,0.16)" : "rgba(123,63,228,0.12)"
              }
              title="Security settings"
              subtitle="Manage your account security"
              onPress={() => router.push("/security" as any)}
              colors={colors}
            />
            <Row
              icon="key-outline"
              iconColor={colors.amber[500]}
              iconTint="rgba(245,179,66,0.14)"
              title="Change password"
              subtitle="Update your account password"
              onPress={() => {
                // TODO: implement password change
              }}
              colors={colors}
            />
            <Row
              icon="finger-print-outline"
              iconColor={colors.lime[500]}
              iconTint={colors.posBg}
              title="Biometric login"
              subtitle="Use fingerprint or face ID"
              rightElement={
                <View
                  style={{
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: 7,
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(40,20,80,0.05)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color: colors.text.tertiary,
                      fontFamily: fontFamily.semibold,
                      letterSpacing: 0.4,
                    }}
                  >
                    SOON
                  </Text>
                </View>
              }
              isLast
              colors={colors}
            />
          </>
        )}

        <SectionLabel label="SUPPORT" colors={colors} />
        {cardWrap(
          <>
            <Row
              icon="help-circle-outline"
              iconColor={colors.cyan[500]}
              iconTint="rgba(91,200,255,0.14)"
              title="Help & support"
              subtitle="Get help and contact support"
              onPress={() => router.push("/help" as any)}
              colors={colors}
            />
            <Row
              icon="document-text-outline"
              iconColor={colors.primary[500]}
              iconTint={
                isDark ? "rgba(157,91,255,0.16)" : "rgba(123,63,228,0.12)"
              }
              title="Terms & privacy"
              subtitle="Read our terms and privacy policy"
              onPress={() => router.push("/terms" as any)}
              colors={colors}
            />
            <Row
              icon="information-circle-outline"
              iconColor={colors.amber[500]}
              iconTint="rgba(245,179,66,0.14)"
              title="About Expenzez"
              subtitle="App version and information"
              onPress={() => {
                // TODO: show about modal
              }}
              isLast
              colors={colors}
            />
          </>
        )}

        <SectionLabel label="ACCOUNT ACTIONS" colors={colors} />
        {cardWrap(
          <>
            <Row
              icon="log-out-outline"
              iconColor={colors.rose[500]}
              iconTint={colors.negBg}
              title="Logout"
              subtitle="Sign out of your account"
              onPress={handleLogout}
              destructive
              colors={colors}
            />
            <Row
              icon="trash-outline"
              iconColor={colors.rose[500]}
              iconTint={colors.negBg}
              title="Delete account"
              subtitle="Permanently delete your account"
              onPress={handleDeleteAccount}
              destructive
              isLast
              colors={colors}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 4,
  },
  backChip: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  scrollView: { flex: 1 },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
  rowSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
});
