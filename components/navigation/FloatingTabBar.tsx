import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "../../contexts/ThemeContext";
import { fontFamily } from "../../constants/theme";

// New v1.5 floating tab bar with a center FAB for "Add transaction".
// 4 visible tabs (Home / Spending / Progress / Account) + the FAB. Other
// stack screens registered in the (tabs) layout are kept routable but
// hidden from the bar (e.g. Health).
const VISIBLE_TABS = ["index", "spending", "progress", "account"] as const;
type VisibleTab = (typeof VISIBLE_TABS)[number];

const TAB_META: Record<
  VisibleTab,
  { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }
> = {
  index: { label: "Home", icon: "home-outline", iconActive: "home" },
  spending: { label: "Spending", icon: "stats-chart-outline", iconActive: "stats-chart" },
  progress: { label: "Goals", icon: "trophy-outline", iconActive: "trophy" },
  account: { label: "Account", icon: "person-outline", iconActive: "person" },
};

export const FloatingTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Determine which of the visible tabs is currently focused (if any).
  const focusedRouteName = state.routes[state.index]?.name;

  const handleTabPress = (tabKey: VisibleTab) => {
    const target = state.routes.find((r) => r.name === tabKey);
    if (!target) return;
    Haptics.selectionAsync().catch(() => undefined);
    const event = navigation.emit({
      type: "tabPress",
      target: target.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(target.name as never);
    }
  };

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined
    );
    router.push("/add-transaction");
  };

  // Render order: Home, Spending, [FAB], Progress, Account
  const leftTabs: VisibleTab[] = ["index", "spending"];
  const rightTabs: VisibleTab[] = ["progress", "account"];

  const blurTint = isDark ? "dark" : "light";
  const barBackground =
    Platform.OS === "ios"
      ? "transparent"
      : isDark
        ? "rgba(22,17,34,0.92)"
        : "rgba(255,255,255,0.94)";

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View
        pointerEvents="box-none"
        style={[
          styles.barOuter,
          {
            backgroundColor: barBackground,
            borderColor: colors.border.medium,
            shadowColor: isDark ? "#000" : "rgba(40,20,80,0.18)",
          },
        ]}
      >
        {Platform.OS === "ios" && (
          <BlurView
            tint={blurTint}
            intensity={50}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}

        <View style={styles.barInner}>
          {leftTabs.map((tab) => (
            <TabButton
              key={tab}
              tab={tab}
              focused={focusedRouteName === tab}
              onPress={() => handleTabPress(tab)}
            />
          ))}

          <Pressable
            onPress={handleFabPress}
            hitSlop={8}
            style={({ pressed }) => [
              styles.fab,
              {
                backgroundColor: colors.primary[500],
                shadowColor: colors.primary[500],
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </Pressable>

          {rightTabs.map((tab) => (
            <TabButton
              key={tab}
              tab={tab}
              focused={focusedRouteName === tab}
              onPress={() => handleTabPress(tab)}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const TabButton: React.FC<{
  tab: VisibleTab;
  focused: boolean;
  onPress: () => void;
}> = ({ tab, focused, onPress }) => {
  const { colors } = useTheme();
  const meta = TAB_META[tab];
  const tint = focused ? colors.text.primary : colors.text.tertiary;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.tabButton,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons
        name={focused ? meta.iconActive : meta.icon}
        size={22}
        color={tint}
      />
      <Text
        style={[
          styles.tabLabel,
          {
            color: tint,
            fontFamily: focused ? fontFamily.semibold : fontFamily.medium,
          },
        ]}
      >
        {meta.label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === "ios" ? 22 : 16,
    paddingTop: 8,
  },
  barOuter: {
    height: 64,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
  barInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
});

export default FloatingTabBar;
