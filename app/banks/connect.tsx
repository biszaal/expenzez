import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAlert } from "../../hooks/useAlert";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, shadows } from "../../constants/theme";
import { bankingAPI } from "../../services/api/bankingAPI";

/**
 * Connect Bank Screen - Nordigen/GoCardless Connection
 *
 * This page uses Nordigen/GoCardless to securely connect EU bank accounts.
 * Users will go through Nordigen's secure authentication flow.
 */
export default function ConnectBankScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isLoggedIn } = useAuthGuard();
  const { showError, showSuccess } = useAlert();
  const { colors } = useTheme();
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { bankId, authUrl } = params;
  
  useEffect(() => {
    console.log('Connect screen received params:', { bankId, authUrl });
  }, [bankId, authUrl]);

  const handleOpenAuthUrl = async () => {
    if (isConnecting || !authUrl) return;
    
    setIsConnecting(true);
    try {
      console.log("[ConnectBank] Opening authorization URL:", authUrl);
      
      showSuccess("Redirecting to bank authentication...");
      
      // Open the authorization URL in the device browser
      const result = await WebBrowser.openBrowserAsync(authUrl as string, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: colors.primary[500],
      });
      
      console.log("[ConnectBank] Browser result:", result);
      
      // After user completes authentication, they'll be redirected back
      // For now, just show a success message
      if (result.type === 'dismiss') {
        showSuccess("Bank authentication completed! You can now go back to the home screen.");
        // Navigate back to banks screen
        router.replace('/banks');
      }
      
    } catch (error: any) {
      console.error("[ConnectBank] Error opening authorization URL:", error);
      showError("Failed to open bank authentication. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleNordigenConnect = async () => {
    if (authUrl) {
      // If we have an authUrl, open it directly
      return handleOpenAuthUrl();
    }
    
    // Fallback: redirect to bank selection
    router.replace('/banks/select');
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
              Secure connection via Nordigen/GoCardless
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
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
              {authUrl ? 'Ready to Connect' : 'Secure Bank Connection'}
            </Text>
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              {authUrl 
                ? 'Click below to open your bank\'s secure authentication page. You\'ll be redirected back to the app after completing the process.'
                : 'Connect your European bank account securely through Nordigen/GoCardless, a regulated Open Banking provider trusted by financial institutions.'
              }
            </Text>
          </View>

          {/* Nordigen Connect Button */}
          <TouchableOpacity
            style={[
              styles.connectButton,
              { backgroundColor: colors.primary[500] },
              isConnecting && { opacity: 0.7 }
            ]}
            onPress={handleNordigenConnect}
            disabled={isConnecting}
          >
            <Text style={[styles.connectButtonText, { color: colors.text.primary }]}>
              {isConnecting ? "Opening..." : (authUrl ? "Open Bank Authentication" : "Select Bank")}
            </Text>
            {!isConnecting && (
              <Ionicons
                name="arrow-forward"
                size={20}
                color={colors.text.primary}
                style={{ marginLeft: 8 }}
              />
            )}
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
                PSD2 regulated & trusted
              </Text>
            </View>
          </View>
        </View>
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
    borderRadius: 12,
    marginBottom: 40,
    minWidth: 200,
    ...shadows.md,
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: "600",
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