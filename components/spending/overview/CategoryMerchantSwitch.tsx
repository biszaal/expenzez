import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../contexts/ThemeContext";
import { fontFamily } from "../../../constants/theme";

interface CategoryMerchantSwitchProps {
  spendingTab: string;
  setSpendingTab: (tab: string) => void;
}

// v1.5 redesign — same segmented-pill pattern as SpendingTabSwitch but
// with icon + label, slightly tighter padding for in-content placement.
export const CategoryMerchantSwitch: React.FC<CategoryMerchantSwitchProps> = ({
  spendingTab,
  setSpendingTab,
}) => {
  const { colors } = useTheme();

  const tabs: {
    key: "categories" | "merchants";
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { key: "categories", label: "Categories", icon: "grid-outline" },
    { key: "merchants", label: "Merchants", icon: "storefront-outline" },
  ];

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.card.background,
            borderColor: colors.border.medium,
          },
        ]}
      >
        {tabs.map((tab) => {
          const active = spendingTab === tab.key;
          const tint = active ? "#FFFFFF" : colors.text.secondary;
          const Body = (
            <View style={styles.pillContent}>
              <Ionicons name={tab.icon} size={16} color={tint} />
              <Text
                style={[
                  styles.pillText,
                  { color: tint, fontFamily: fontFamily.semibold },
                ]}
              >
                {tab.label}
              </Text>
            </View>
          );
          return (
            <Pressable
              key={tab.key}
              onPress={() => setSpendingTab(tab.key)}
              style={styles.pillPressable}
            >
              {active ? (
                <LinearGradient
                  colors={[colors.primary[500], colors.primary[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.pillActive,
                    { shadowColor: colors.primary[500] },
                  ]}
                >
                  {Body}
                </LinearGradient>
              ) : (
                <View style={styles.pillInactive}>{Body}</View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  track: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    flexDirection: "row",
    gap: 4,
  },
  pillPressable: { flex: 1 },
  pillActive: {
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  pillInactive: {
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: "center",
  },
  pillContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
