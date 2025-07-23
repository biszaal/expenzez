import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";
import { getPaymentMethods } from "../../services/dataSource";
import { useAlert } from "../../hooks/useAlert";

interface PaymentMethod {
  id: string;
  type: "card" | "bank";
  name: string;
  number: string;
  expiry?: string;
  isDefault: boolean;
  isActive: boolean;
  icon: string;
  color: string;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess } = useAlert();

  useEffect(() => {
    const fetchMethods = async () => {
      setLoading(true);
      const data = await getPaymentMethods();
      setMethods(data);
      setLoading(false);
    };
    fetchMethods();
  }, []);

  const setDefaultMethod = (id: string) => {
    setMethods((prev) =>
      prev.map((method) => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
  };

  const toggleMethodStatus = (id: string) => {
    setMethods((prev) =>
      prev.map((method) =>
        method.id === id ? { ...method, isActive: !method.isActive } : method
      )
    );
  };

  const deleteMethod = (id: string) => {
    Alert.alert(
      "Delete Payment Method",
      "Are you sure you want to delete this payment method?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setMethods((prev) => prev.filter((method) => method.id !== id));
          },
        },
      ]
    );
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment Methods</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => showSuccess("Add new payment method")}
            >
              <Ionicons name="add" size={24} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Payment Methods</Text>
          <View style={styles.methodsCard}>
            {loading ? (
              <Text>Loading payment methods...</Text>
            ) : methods.length === 0 ? (
              <Text>No payment methods found. Add a new one!</Text>
            ) : (
              methods.map((method, index) => (
                <View
                  key={method.id}
                  style={[
                    styles.methodItem,
                    index !== methods.length - 1 && styles.methodItemBorder,
                  ]}
                >
                  <View style={styles.methodInfo}>
                    <View
                      style={[
                        styles.methodIcon,
                        { backgroundColor: method.color },
                      ]}
                    >
                      <Ionicons
                        name={method.icon as any}
                        size={20}
                        color="white"
                      />
                    </View>
                    <View style={styles.methodDetails}>
                      <Text style={styles.methodName}>{method.name}</Text>
                      <Text style={styles.methodNumber}>{method.number}</Text>
                      {method.expiry && (
                        <Text style={styles.methodExpiry}>
                          Expires {method.expiry}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.methodActions}>
                    {method.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>Default</Text>
                      </View>
                    )}
                    <Switch
                      value={method.isActive}
                      onValueChange={() => toggleMethodStatus(method.id)}
                      trackColor={{
                        false: colors.gray[200],
                        true: colors.primary[500],
                      }}
                      thumbColor={method.isActive ? "white" : colors.gray[300]}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Add New Card</Text>
                <Text style={styles.actionSubtitle}>
                  Add a credit or debit card
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary[500]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push("/banks/connect" as any)}
            >
              <View style={styles.actionIcon}>
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Connect Bank Account</Text>
                <Text style={styles.actionSubtitle}>
                  Link your bank account
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary[500]}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons
                  name="wallet-outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Digital Wallets</Text>
                <Text style={styles.actionSubtitle}>Apple Pay, Google Pay</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Settings</Text>
          <View style={styles.securityCard}>
            <View style={styles.securityItem}>
              <View style={styles.securityIcon}>
                <Ionicons
                  name="shield-outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.securityContent}>
                <Text style={styles.securityTitle}>3D Secure</Text>
                <Text style={styles.securitySubtitle}>
                  Enhanced security for online payments
                </Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{
                  false: colors.gray[200],
                  true: colors.primary[500],
                }}
                thumbColor="white"
              />
            </View>

            <View style={styles.securityItem}>
              <View style={styles.securityIcon}>
                <Ionicons
                  name="finger-print-outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.securityContent}>
                <Text style={styles.securityTitle}>
                  Biometric Authentication
                </Text>
                <Text style={styles.securitySubtitle}>
                  Use fingerprint or face ID
                </Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{
                  false: colors.gray[200],
                  true: colors.primary[500],
                }}
                thumbColor="white"
              />
            </View>

            <View style={styles.securityItem}>
              <View style={styles.securityIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.securityContent}>
                <Text style={styles.securityTitle}>Transaction Alerts</Text>
                <Text style={styles.securitySubtitle}>
                  Get notified of all transactions
                </Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{
                  false: colors.gray[200],
                  true: colors.primary[500],
                }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.historyCard}>
            <Text
              style={{
                color: colors.text.secondary,
                textAlign: "center",
                marginVertical: spacing.lg,
              }}
            >
              No recent transactions.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.primary,
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
    color: colors.text.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[100],
    ...shadows.sm,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  methodsCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["3xl"],
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  methodItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  methodItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  methodInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    color: colors.text.primary,
  },
  methodNumber: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  methodExpiry: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  methodActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  defaultBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  defaultText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "600" as const,
    color: colors.primary[500],
  },
  actionsCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["3xl"],
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    color: colors.text.primary,
  },
  actionSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  securityCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["3xl"],
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    color: colors.text.primary,
  },
  securitySubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  historyCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["3xl"],
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    color: colors.text.primary,
  },
  historySubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  historyAmount: {
    fontSize: typography.fontSizes.base,
    fontWeight: "700" as const,
    color: "#DC2626",
  },
});
