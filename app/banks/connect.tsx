import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAlert } from "../../hooks/useAlert";
import { useTheme } from "../../contexts/ThemeContext";
import { bankingAPI } from "../../services/api";
import { DEEP_LINK_URLS } from "../../constants/config";
import { spacing, borderRadius, shadows } from "../../constants/theme";

/**
 * Connect Bank Screen - Direct TrueLayer Connection
 *
 * This page immediately initiates a TrueLayer OAuth flow without
 * showing a bank selection page. Users will select their bank
 * directly on TrueLayer's page.
 */
export default function ConnectBankScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuthGuard();
  const { showError, showSuccess } = useAlert();
  const { colors } = useTheme();
  const [connecting, setConnecting] = useState(false);

  // Auto-connect when the screen loads
  useEffect(() => {
    if (isLoggedIn) {
      handleConnectBank();
    }
  }, [isLoggedIn]);

  const handleConnectBank = async () => {
    try {
      setConnecting(true);
      console.log("[ConnectBank] Starting TrueLayer connection...");

      // Get the TrueLayer auth link (this will show bank selection on TrueLayer's page)
      const response = await bankingAPI.connectBank();

      if (response.link) {
        console.log(
          "[ConnectBank] Opening TrueLayer auth page:",
          response.link
        );

        // Open TrueLayer OAuth page - user selects bank there
        const result = await WebBrowser.openAuthSessionAsync(
          response.link,
          DEEP_LINK_URLS.BANK_CALLBACK
        );

        console.log("[ConnectBank] OAuth result:", result);

        if (result.type === "success") {
          showSuccess("Bank connection initiated successfully!");
          router.back();
        } else if (result.type === "cancel") {
          console.log("[ConnectBank] User cancelled the connection");
        }
      } else {
        showError("Failed to generate connection link");
      }
    } catch (error) {
      console.error("[ConnectBank] Error connecting bank:", error);
      showError("Failed to start bank connection process");
    } finally {
      setConnecting(false);
    }
  };

  // If not logged in, don't render anything (auth guard will handle redirect)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: colors.background.primary }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.background.secondary },
            ]}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary[500]}
            />
          </TouchableOpacity>

          <View style={styles.headerTitleSection}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Connect Bank
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.text.secondary }]}
            >
              Secure connection via TrueLayer
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {connecting ? (
          <View style={styles.connectingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text
              style={[styles.connectingTitle, { color: colors.text.primary }]}
            >
              Opening TrueLayer...
            </Text>
            <Text
              style={[styles.connectingText, { color: colors.text.secondary }]}
            >
              You&apos;ll be redirected to select your bank and authorize the
              connection.
            </Text>
          </View>
        ) : (
          <View style={styles.manualContainer}>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.background.primary },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={48}
                color={colors.primary[500]}
                style={styles.infoIcon}
              />
              <Text style={[styles.infoTitle, { color: colors.text.primary }]}>
                Secure Bank Connection
              </Text>
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                Connect your bank account securely through TrueLayer, a
                regulated Open Banking provider.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.connectButton,
                { backgroundColor: colors.primary[500] },
              ]}
              onPress={handleConnectBank}
              disabled={connecting}
            >
              <Ionicons name="link" size={24} color="white" />
              <Text style={styles.connectButtonText}>Connect Bank Account</Text>
            </TouchableOpacity>

            <View style={styles.features}>
              <View style={styles.feature}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={colors.primary[500]}
                />
                <Text
                  style={[styles.featureText, { color: colors.text.secondary }]}
                >
                  Bank-grade security
                </Text>
              </View>
              <View style={styles.feature}>
                <Ionicons
                  name="eye-off"
                  size={20}
                  color={colors.primary[500]}
                />
                <Text
                  style={[styles.featureText, { color: colors.text.secondary }]}
                >
                  Read-only access
                </Text>
              </View>
              <View style={styles.feature}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary[500]}
                />
                <Text
                  style={[styles.featureText, { color: colors.text.secondary }]}
                >
                  FCA regulated
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  headerTitleSection: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  connectingContainer: {
    alignItems: "center",
    padding: 40,
  },
  connectingTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
  },
  connectingText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  manualContainer: {
    alignItems: "center",
  },
  infoCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 40,
    ...shadows.lg,
  },
  infoIcon: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  infoText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 40,
    ...shadows.md,
  },
  connectButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  features: {
    width: "100%",
    maxWidth: 300,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
  },
});
