import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../contexts/ThemeContext";
import { fontFamily } from "../../../constants/theme";

interface SpendingTabSwitchProps {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

// v1.5 redesign — soft 1-px-bordered container with two equal-width pills.
// Active pill = primary→primaryDim gradient + soft glow shadow.
export const SpendingTabSwitch: React.FC<SpendingTabSwitchProps> = ({
  selectedTab,
  setSelectedTab,
}) => {
  const { colors } = useTheme();

  const tabs: { key: "summary" | "categories"; label: string }[] = [
    { key: "summary", label: "Budget" },
    { key: "categories", label: "Spending" },
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
          const active = selectedTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setSelectedTab(tab.key)}
              style={styles.pillPressable}
            >
              {active ? (
                <LinearGradient
                  colors={[colors.primary[500], colors.primary[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.pillActive,
                    {
                      shadowColor: colors.primary[500],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: "#FFFFFF", fontFamily: fontFamily.semibold },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.pillInactive}>
                  <Text
                    style={[
                      styles.pillText,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamily.semibold,
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </View>
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
    paddingTop: 18,
  },
  track: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    flexDirection: "row",
    gap: 4,
  },
  pillPressable: { flex: 1 },
  pillActive: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  pillInactive: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  pillText: {
    fontSize: 13.5,
    letterSpacing: 0.2,
  },
});
