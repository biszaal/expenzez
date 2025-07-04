import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pie, PolarChart } from "victory-native";

const { width } = Dimensions.get("window");

const PURPLE = "#7C3AED";
const PURPLE_LIGHT = "#E9D5FF";
const GREY = "#A1A1AA";
const GREY_DARK = "#52525B";
const GREY_LIGHT = "#F4F4F5";

const months = ["May", "Jun", "Jul"];
const totalBudget = 600;
const totalSpent = 366.28;
const leftToSpend = totalBudget - totalSpent;
const upcomingBills = 45.07;

const chartData = [
  { label: "Spent", value: totalSpent, color: PURPLE },
  { label: "Left", value: leftToSpend, color: PURPLE_LIGHT },
];

const categoryData = [
  {
    id: 1,
    icon: <MaterialCommunityIcons name="bus-clock" size={22} color={PURPLE} />,
    name: "Transport",
    spent: 346.2,
    budget: 350,
    upcoming: 0,
    color: PURPLE,
  },
  {
    id: 2,
    icon: (
      <MaterialCommunityIcons
        name="home-thermometer-outline"
        size={22}
        color={GREY_DARK}
      />
    ),
    name: "Home & Comfort",
    spent: 0,
    budget: 50,
    upcoming: 42.08,
    color: GREY_DARK,
  },
  {
    id: 3,
    icon: (
      <MaterialCommunityIcons
        name="food-apple-outline"
        size={22}
        color={PURPLE}
      />
    ),
    name: "Groceries",
    spent: 120,
    budget: 200,
    upcoming: 0,
    color: PURPLE,
  },
  {
    id: 4,
    icon: <MaterialCommunityIcons name="run" size={22} color={GREY} />,
    name: "Fitness",
    spent: 40,
    budget: 100,
    upcoming: 0,
    color: GREY,
  },
];

export default function SpendingPage() {
  const [selectedTab, setSelectedTab] = useState<"summary" | "categories">(
    "summary"
  );
  const [selectedMonth, setSelectedMonth] = useState("Jul");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GREY_LIGHT }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            <Text style={{ color: PURPLE }}>expenzez</Text> Dashboard
          </Text>
          <TouchableOpacity style={styles.infoBtn}>
            <Feather name="info" size={24} color={PURPLE} />
          </TouchableOpacity>
        </View>

        {/* Tab Switch */}
        <View style={styles.tabSwitchWrap}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              selectedTab === "summary" && styles.tabBtnActive,
            ]}
            onPress={() => setSelectedTab("summary")}
          >
            <Ionicons
              name="pie-chart-sharp"
              size={17}
              color={selectedTab === "summary" ? "#FFF" : PURPLE}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabBtnText,
                selectedTab === "summary" && styles.tabBtnTextActive,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              selectedTab === "categories" && styles.tabBtnActive,
            ]}
            onPress={() => setSelectedTab("categories")}
          >
            <Ionicons
              name="list"
              size={17}
              color={selectedTab === "categories" ? "#FFF" : PURPLE}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabBtnText,
                selectedTab === "categories" && styles.tabBtnTextActive,
              ]}
            >
              Categories
            </Text>
          </TouchableOpacity>
        </View>

        {/* Month Picker */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.monthsRow}
        >
          {months.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.monthBtn,
                selectedMonth === m && styles.monthBtnActive,
              ]}
              onPress={() => setSelectedMonth(m)}
            >
              <Text
                style={[
                  styles.monthBtnText,
                  selectedMonth === m && styles.monthBtnTextActive,
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main Card */}
        {selectedTab === "summary" && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionLabel}>This Month</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="wallet-outline"
                  color={PURPLE}
                  size={18}
                />
                <Text style={styles.spendAmount}>
                  {" "}
                  £{totalSpent.toFixed(2)}
                </Text>
                <Text style={[styles.sectionLabel, { marginLeft: 8 }]}>
                  spent
                </Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="settings-outline" color={GREY_DARK} size={18} />
              </TouchableOpacity>
            </View>
            <View style={styles.pieRow}>
              {/* Pie Chart */}
              <View
                style={{
                  position: "relative",
                  width: 190,
                  height: 190,
                  backgroundColor: "#fff",
                  borderRadius: 100,
                  shadowColor: PURPLE,
                  shadowOpacity: 0.07,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 5 },
                }}
              >
                <PolarChart
                  data={chartData}
                  labelKey="label"
                  valueKey="value"
                  colorKey="color"
                >
                  <Pie.Chart innerRadius={80} />
                </PolarChart>
                {/* Center Label */}
                <View style={styles.pieCenterLabel}>
                  <Text style={styles.leftToSpend}>
                    £{leftToSpend.toFixed(2)}
                  </Text>
                  <Text style={styles.leftToSpendText}>left to spend</Text>
                </View>
              </View>
              {/* Legends */}
              <View style={styles.legendCol}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 5,
                  }}
                >
                  <View
                    style={[
                      styles.legend,
                      { backgroundColor: PURPLE, marginRight: 8 },
                    ]}
                  />
                  <Text style={styles.legendLabel}>Spent</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={[
                      styles.legend,
                      { backgroundColor: PURPLE_LIGHT, marginRight: 8 },
                    ]}
                  />
                  <Text style={styles.legendLabel}>Left</Text>
                </View>
                <View
                  style={{
                    marginTop: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    color={PURPLE}
                    size={16}
                  />
                  <Text style={styles.upcomingLabel}>
                    Upcoming bills: £{upcomingBills.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.outlinedBtn2}>
                <Feather
                  name="edit-2"
                  size={15}
                  color={PURPLE}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.outlinedBtnText2}>Edit budgets</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlinedBtn2}>
                <Text style={styles.outlinedBtnText2}>Details</Text>
                <Ionicons name="chevron-forward" size={14} color={PURPLE} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Category Budgets */}
        {selectedTab === "categories" && (
          <View style={{ marginTop: 15 }}>
            {categoryData.map((cat) => {
              const left = Math.max(0, cat.budget - cat.spent);
              const percent = Math.min(1, cat.spent / cat.budget);
              return (
                <View
                  key={cat.id}
                  style={[
                    styles.catCard,
                    { borderLeftWidth: 6, borderLeftColor: cat.color },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    {cat.icon}
                    <Text style={styles.catTitle}>{cat.name}</Text>
                    <Text style={styles.catLeft}>£{left.toFixed(2)} left</Text>
                    <Text style={styles.catBudget}>/ £{cat.budget}</Text>
                  </View>
                  {/* Progress Bar */}
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${percent * 100}%`,
                          backgroundColor: cat.color,
                          borderTopRightRadius: percent === 1 ? 7 : 0,
                          borderBottomRightRadius: percent === 1 ? 7 : 0,
                        },
                      ]}
                    />
                  </View>
                  {/* Spent/Upcoming */}
                  <View style={styles.catSubRow}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <MaterialCommunityIcons
                        name="flash-outline"
                        color={cat.color}
                        size={14}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.catSpent}>Spent: £{cat.spent}</Text>
                    </View>
                    {cat.upcoming > 0 && (
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <MaterialCommunityIcons
                          name="alarm-light-outline"
                          color={PURPLE}
                          size={14}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.catUpcoming}>
                          Upcoming: £{cat.upcoming}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            <Feather name="github" size={16} color={PURPLE} /> Powered by{" "}
            <Text style={{ color: PURPLE }}>expenzez</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 32,
    paddingHorizontal: 26,
    backgroundColor: GREY_LIGHT,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: GREY_DARK,
    letterSpacing: -0.6,
  },
  infoBtn: {
    backgroundColor: "#FFF",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: PURPLE_LIGHT,
    shadowColor: PURPLE,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  tabSwitchWrap: {
    flexDirection: "row",
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 30,
    marginHorizontal: 26,
    marginTop: 18,
    marginBottom: 18,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E3D5CA",
  },
  tabBtn: {
    flex: 1,
    borderRadius: 26,
    height: 42,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabBtnActive: {
    backgroundColor: PURPLE,
    shadowColor: PURPLE,
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  tabBtnText: {
    color: PURPLE,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  tabBtnTextActive: {
    color: "#FFF",
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  monthsRow: {
    marginLeft: 18,
    marginBottom: 4,
    marginTop: 2,
    flexDirection: "row",
  },
  monthBtn: {
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 18,
    marginRight: 11,
    borderWidth: 1.3,
    borderColor: PURPLE_LIGHT,
    backgroundColor: "#FFF",
  },
  monthBtnActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  monthBtnText: {
    color: PURPLE,
    fontWeight: "bold",
    fontSize: 16,
  },
  monthBtnTextActive: {
    color: "#FFF",
    fontWeight: "900",
  },
  chartCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 18,
    marginTop: 8,
    borderRadius: 26,
    padding: 20,
    shadowColor: PURPLE,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: PURPLE_LIGHT,
  },
  sectionLabel: {
    color: GREY,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  spendAmount: {
    fontWeight: "bold",
    color: PURPLE,
    fontSize: 23,
    marginLeft: 5,
  },
  pieRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
    width: "100%",
    justifyContent: "space-between",
  },
  legendCol: {
    marginLeft: 14,
    flex: 1,
    justifyContent: "center",
  },
  legend: {
    width: 18,
    height: 8,
    borderRadius: 5,
    marginRight: 3,
    backgroundColor: PURPLE,
  },
  legendLabel: {
    color: GREY_DARK,
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  upcomingLabel: {
    color: PURPLE,
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  pieCenterLabel: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "none",
  },
  leftToSpend: {
    fontSize: 26,
    fontWeight: "900",
    color: PURPLE,
    marginBottom: -3,
    letterSpacing: 0.8,
  },
  leftToSpendText: {
    color: GREY_DARK,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 2,
  },
  outlinedBtn2: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: PURPLE,
    borderWidth: 1.2,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: "#FFF",
  },
  outlinedBtnText2: {
    color: PURPLE,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  catCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 16,
    shadowColor: PURPLE,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
    borderLeftWidth: 6,
    borderLeftColor: PURPLE,
    borderTopWidth: 0.7,
    borderColor: PURPLE_LIGHT,
  },
  catTitle: {
    fontWeight: "900",
    fontSize: 17,
    color: GREY_DARK,
    marginLeft: 11,
    marginRight: 7,
    letterSpacing: 0.2,
  },
  catLeft: {
    color: PURPLE,
    fontWeight: "700",
    fontSize: 15,
    marginLeft: "auto",
    marginRight: 4,
    letterSpacing: 0.2,
  },
  catBudget: {
    color: GREY_DARK,
    fontWeight: "700",
    fontSize: 14,
  },
  progressBarBg: {
    height: 9,
    borderRadius: 7,
    backgroundColor: PURPLE_LIGHT,
    marginVertical: 7,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 9,
    borderRadius: 7,
    backgroundColor: PURPLE,
  },
  catSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  catSpent: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: "bold",
  },
  catUpcoming: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 30,
    alignItems: "center",
    paddingVertical: 12,
  },
  footerText: {
    color: GREY,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
