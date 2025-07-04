import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PURPLE = "#7C3AED";
const PURPLE_LIGHT = "#E9D5FF";
const GREY = "#A1A1AA";
const GREY_DARK = "#52525B";
const GREY_LIGHT = "#F4F4F5";
const SCREEN_WIDTH = Dimensions.get("window").width;

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PURPLE_LIGHT }}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 32,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoBrand}>
            <Text style={{ color: PURPLE }}>expenzez</Text>
          </Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={25} color={PURPLE} />
          </TouchableOpacity>
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons
              name="hand-wave"
              size={28}
              color={PURPLE}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.welcomeText}>Welcome back,</Text>
          </View>
          <Text style={styles.userName}>Bishal 👋</Text>
          <Text style={styles.welcomeDesc}>
            Here’s your personal finance snapshot. Explore, track and grow!
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <View style={styles.statCard}>
            <Feather name="activity" size={24} color={PURPLE} />
            <Text style={styles.statLabel}>Monthly Spend</Text>
            <Text style={styles.statValue}>£366</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="target" size={24} color={GREY_DARK} />
            <Text style={[styles.statLabel, { color: GREY_DARK }]}>
              Budget Used
            </Text>
            <Text style={[styles.statValue, { color: GREY_DARK }]}>61%</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="wallet-outline" size={22} color={PURPLE} />
            <Text style={styles.actionBtnText}>View Spending</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="trending-up-outline" size={22} color={PURPLE} />
            <Text style={styles.actionBtnText}>Trends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="settings-outline" size={22} color={PURPLE} />
            <Text style={styles.actionBtnText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityIconBg}>
                <MaterialCommunityIcons name="bus" size={20} color={PURPLE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityLabel}>Transport</Text>
                <Text style={styles.activitySub}>Uber ride</Text>
              </View>
              <Text style={styles.activityAmount}>-£12.50</Text>
            </View>
            <View style={styles.activityItem}>
              <View
                style={[styles.activityIconBg, { backgroundColor: GREY_LIGHT }]}
              >
                <MaterialCommunityIcons
                  name="food-apple-outline"
                  size={20}
                  color={GREY_DARK}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activityLabel, { color: GREY_DARK }]}>
                  Groceries
                </Text>
                <Text style={styles.activitySub}>Tesco</Text>
              </View>
              <Text style={[styles.activityAmount, { color: GREY_DARK }]}>
                -£34.20
              </Text>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIconBg}>
                <Ionicons name="home-outline" size={20} color={PURPLE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityLabel}>Home</Text>
                <Text style={styles.activitySub}>Rent paid</Text>
              </View>
              <Text style={styles.activityAmount}>-£200.00</Text>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaText}>
            Ready to take control of your finances?
          </Text>
          <TouchableOpacity style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Set a Savings Goal</Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color="#fff"
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </View>

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

const CARD_RADIUS = 24;

const styles = StyleSheet.create({
  header: {
    paddingTop: 26,
    paddingHorizontal: 22,
    backgroundColor: PURPLE_LIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 2,
  },
  logoBrand: {
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -0.7,
    color: GREY_DARK,
  },
  headerIcon: {
    backgroundColor: "#fff",
    borderRadius: 17,
    padding: 7,
    borderWidth: 1,
    borderColor: PURPLE_LIGHT,
  },
  welcomeCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: CARD_RADIUS,
    padding: 20,
    shadowColor: PURPLE,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "700",
    color: GREY_DARK,
    letterSpacing: 0.2,
  },
  userName: {
    fontSize: 26,
    fontWeight: "900",
    color: PURPLE,
    marginTop: 8,
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  welcomeDesc: {
    color: GREY,
    fontSize: 15,
    marginTop: 5,
  },
  quickStatsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 26,
    marginBottom: 6,
    marginHorizontal: 4,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: CARD_RADIUS - 8,
    paddingVertical: 17,
    paddingHorizontal: 23,
    alignItems: "center",
    shadowColor: PURPLE,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    marginHorizontal: 4,
    width: SCREEN_WIDTH * 0.41,
    borderWidth: 1,
    borderColor: PURPLE_LIGHT,
  },
  statLabel: {
    color: PURPLE,
    fontWeight: "700",
    fontSize: 15,
    marginTop: 7,
    letterSpacing: 0.2,
  },
  statValue: {
    color: PURPLE,
    fontWeight: "900",
    fontSize: 23,
    marginTop: 3,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginHorizontal: 18,
  },
  actionBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    flex: 1,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: PURPLE_LIGHT,
    shadowColor: PURPLE,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  actionBtnText: {
    color: PURPLE,
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 7,
    letterSpacing: 0.2,
  },
  sectionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 28,
    borderRadius: CARD_RADIUS,
    padding: 20,
    shadowColor: PURPLE,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    borderWidth: 1,
    borderColor: PURPLE_LIGHT,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: GREY_DARK,
    fontWeight: "900",
    fontSize: 19,
    letterSpacing: 0.2,
  },
  sectionAction: {
    color: PURPLE,
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.1,
  },
  activityList: {
    marginTop: 2,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: PURPLE_LIGHT,
    marginBottom: 2,
  },
  activityIconBg: {
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 13,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  activityLabel: {
    fontSize: 15,
    color: PURPLE,
    fontWeight: "900",
  },
  activitySub: {
    fontSize: 12,
    color: GREY,
    fontWeight: "600",
  },
  activityAmount: {
    fontWeight: "900",
    color: PURPLE,
    fontSize: 16,
    letterSpacing: 0.2,
    marginLeft: 9,
  },
  ctaCard: {
    backgroundColor: PURPLE,
    marginHorizontal: 16,
    borderRadius: CARD_RADIUS,
    padding: 23,
    marginTop: 30,
    alignItems: "center",
    shadowColor: PURPLE,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  ctaText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
    marginBottom: 13,
    textAlign: "center",
    letterSpacing: 0.15,
  },
  ctaBtn: {
    backgroundColor: GREY_DARK,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  ctaBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  footer: {
    marginTop: 28,
    alignItems: "center",
    paddingVertical: 13,
  },
  footerText: {
    color: GREY_DARK,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
