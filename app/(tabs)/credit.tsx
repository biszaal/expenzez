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

// Color palette: all purple and grey but with a unique, modern twist
const PURPLE = "#7C3AED";
const PURPLE_LIGHT = "#E9D5FF";
const GREY = "#A1A1AA";
const GREY_DARK = "#52525B";
const GREY_LIGHT = "#F4F4F5";
const WHITE = "#FFF";
const SCREEN_WIDTH = Dimensions.get("window").width;

const creditOptions = [
  {
    icon: (
      <MaterialCommunityIcons name="bank-outline" size={28} color={PURPLE} />
    ),
    name: "Loans",
    desc: "Flexible options for big dreams",
    bg: "#EBDFFC",
  },
  {
    icon: <MaterialCommunityIcons name="car" size={28} color={PURPLE} />,
    name: "Auto finance",
    desc: "Drive now, pay later",
    bg: "#F3EDFC",
  },
  {
    icon: <MaterialCommunityIcons name="home-roof" size={28} color={PURPLE} />,
    name: "Renovation credit",
    desc: "Upgrade your place",
    bg: "#EFF1F8",
  },
  {
    icon: (
      <MaterialCommunityIcons name="swap-horizontal" size={28} color={PURPLE} />
    ),
    name: "Debt optimizer",
    desc: "Merge & manage debts",
    bg: "#F5F3FF",
  },
  {
    icon: (
      <MaterialCommunityIcons
        name="credit-card-outline"
        size={28}
        color={PURPLE}
      />
    ),
    name: "Cards explorer",
    desc: "Find your perfect card",
    bg: "#F3F0FB",
  },
  {
    icon: (
      <MaterialCommunityIcons
        name="home-city-outline"
        size={28}
        color={PURPLE}
      />
    ),
    name: "Mortgages",
    desc: "Unlock your new home",
    bg: "#F5F3FF",
  },
];

export default function CreditScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GREY_LIGHT }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>BA</Text>
          </View>
          <Text style={styles.screenTitle}>Credit & Offers</Text>
          <TouchableOpacity>
            <Feather name="help-circle" size={22} color={PURPLE} />
          </TouchableOpacity>
        </View>

        {/* Credit options - unique grid layout */}
        <View style={styles.creditGridWrap}>
          {creditOptions.map((opt, idx) => (
            <TouchableOpacity
              key={opt.name}
              style={[styles.creditTile, { backgroundColor: opt.bg }]}
            >
              <View style={styles.creditTileIcon}>{opt.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.creditTileTitle}>{opt.name}</Text>
                <Text style={styles.creditTileDesc}>{opt.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={PURPLE} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Offers section */}
        <Text style={styles.sectionHeadline}>
          Exclusive Offers & Credit Boost
        </Text>
        <View style={styles.offerCard}>
          <View style={styles.offerIcons}>
            <MaterialCommunityIcons
              name="star-four-points"
              size={30}
              color={PURPLE}
              style={{ opacity: 0.8 }}
            />
            <MaterialCommunityIcons
              name="star-outline"
              size={30}
              color={GREY_DARK}
              style={{ marginHorizontal: 9, opacity: 0.63 }}
            />
            <MaterialCommunityIcons
              name="star-four-points"
              size={30}
              color={PURPLE_LIGHT}
              style={{ opacity: 0.8 }}
            />
          </View>
          <Text style={styles.offerHeadline}>
            Boost your credit with Rent Shield
          </Text>
          <Text style={styles.offerDesc}>
            Each new rent payment helps build your credit. We’ll update
            Experian, Equifax, and TransUnion for you.
          </Text>
          <TouchableOpacity style={styles.offerBtn}>
            <Text style={styles.offerBtnText}>Get Started</Text>
            <Feather
              name="arrow-right"
              size={17}
              color={PURPLE}
              style={{ marginLeft: 7 }}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 22;

const styles = StyleSheet.create({
  header: {
    paddingTop: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    backgroundColor: GREY_LIGHT,
    marginBottom: 8,
  },
  avatar: {
    backgroundColor: PURPLE_LIGHT,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 3,
  },
  avatarTxt: {
    color: PURPLE,
    fontWeight: "900",
    fontSize: 20,
    letterSpacing: 0.3,
  },
  screenTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    color: GREY_DARK,
    letterSpacing: 0.3,
    marginRight: 30,
  },
  creditGridWrap: {
    marginHorizontal: 12,
    marginTop: 2,
    marginBottom: 18,
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  creditTile: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: CARD_RADIUS,
    paddingVertical: 13,
    paddingHorizontal: 13,
    marginBottom: 12,
    width: (SCREEN_WIDTH - 36) / 2,
    minHeight: 84,
    marginHorizontal: 3,
    shadowColor: PURPLE,
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  creditTileIcon: {
    backgroundColor: WHITE,
    borderRadius: 13,
    width: 41,
    height: 41,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  creditTileTitle: {
    fontWeight: "900",
    fontSize: 16,
    color: GREY_DARK,
    marginBottom: 1,
  },
  creditTileDesc: {
    color: GREY,
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  sectionHeadline: {
    color: GREY_DARK,
    fontWeight: "900",
    fontSize: 17,
    marginLeft: 24,
    marginTop: 2,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  offerCard: {
    backgroundColor: "#fff",
    borderRadius: CARD_RADIUS,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 24,
    shadowColor: PURPLE,
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: 18,
    alignItems: "flex-start",
  },
  offerIcons: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
    marginLeft: -2,
  },
  offerHeadline: {
    fontWeight: "900",
    color: PURPLE,
    fontSize: 17,
    marginBottom: 7,
    letterSpacing: 0.1,
  },
  offerDesc: {
    color: GREY_DARK,
    fontWeight: "600",
    fontSize: 14.5,
    marginBottom: 13,
    letterSpacing: 0.04,
  },
  offerBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: PURPLE_LIGHT,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 13,
    marginTop: 2,
  },
  offerBtnText: {
    color: PURPLE,
    fontWeight: "900",
    fontSize: 15,
  },
});
