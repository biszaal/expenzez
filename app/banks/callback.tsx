import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import { bankingAPI, authAPI } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";

export default function BankCallbackScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showAlert, showError } = useAlert();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "redirecting">(
    "redirecting" // Start with redirecting to prevent flash
  );
  const [message, setMessage] = useState("Processing bank connection...");

  const params = useLocalSearchParams();
  const { code, error: oauthError, reconnect } = params;

  // Check if this is a reconnection flow
  const isReconnecting = !!reconnect;
  const reconnectAccountId = reconnect as string;

  useEffect(() => {
    // Complete the auth session to close the in-app browser
    WebBrowser.maybeCompleteAuthSession();

    // IMMEDIATE CHECK: If no valid params, redirect immediately without delay
    if (!params.ref && !params.code && !params.error && !params.reconnect) {
      console.log('[CALLBACK] No valid parameters detected on useEffect - redirecting immediately');
      setStatus("redirecting");
      router.replace("/(tabs)");
      return;
    }
    
    // ADDITIONAL CHECK: If we have a ref parameter, verify it's valid
    if (params.ref && typeof params.ref === 'string') {
      // Check if the ref looks like it might be stale (older than 15 minutes)
      const match = params.ref.match(/expenzez_(\d+)/);
      if (match) {
        const timestamp = parseInt(match[1]);
        const age = Date.now() - timestamp;
        const FIFTEEN_MINUTES = 15 * 60 * 1000;
        
        if (age > FIFTEEN_MINUTES) {
          console.log(`[CALLBACK] Stale reference detected: ${params.ref} (${Math.round(age/1000)}s old) - redirecting immediately`);
          setStatus("redirecting");
          router.replace("/(tabs)");
          return;
        }
      }
    }

    // Add a small delay to ensure the screen is fully loaded
    const timer = setTimeout(() => {
      handleCallback();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleCallback = async () => {
    try {
      console.log(
        "[CALLBACK] Starting Nordigen/GoCardless callback with params:",
        params
      );
      
      // For GoCardless/Nordigen, success callbacks may only have 'ref' parameter
      // The 'ref' parameter indicates a successful callback from GoCardless
      const hasCallbackParams = params.code || params.error || params.reconnect || params.ref;
      
      // AGGRESSIVE CHECK: If no valid callback params, immediately redirect without showing UI
      if (!hasCallbackParams || Object.keys(params).length === 0) {
        console.log('[CALLBACK] No banking callback parameters found, redirecting immediately');
        setStatus("redirecting");
        router.replace("/(tabs)");
        return;
      }
      
      // ADDITIONAL CHECK: If params exist but look stale (old reference without current banking flow)
      if (params.ref && !params.code && !params.error && !params.reconnect) {
        console.log('[CALLBACK] Checking if banking reference is stale...');
        
        // If reference exists but no associated stored requisition, it's stale
        const storedRequisitionId = await AsyncStorage.getItem(`requisition_${params.ref}`);
        if (!storedRequisitionId) {
          console.log('[CALLBACK] Stale banking reference - no stored requisition, redirecting immediately');
          setStatus("redirecting");
          router.replace("/(tabs)");
          return;
        }
      }
      
      // Additional check: if we only have a ref but it looks old/invalid, redirect
      if (params.ref && !params.code && !params.error) {
        try {
          const storedRequisitionId = await AsyncStorage.getItem(`requisition_${params.ref}`);
          if (!storedRequisitionId) {
            console.log('[CALLBACK] Stale reference detected, no stored requisition found, cleaning up and redirecting home');
            // Set status to redirecting to hide UI
            setStatus("redirecting");
            // Clean up any stale AsyncStorage keys related to this reference
            try {
              await AsyncStorage.removeItem(`requisition_${params.ref}`);
            } catch (cleanupError) {
              console.log('[CALLBACK] Error during cleanup:', cleanupError);
            }
            // Force immediate redirect without showing UI
            setTimeout(() => router.replace("/(tabs)"), 100);
            return;
          }
        } catch (error) {
          console.log('[CALLBACK] Error checking stored requisition, redirecting home');
          setTimeout(() => router.replace("/(tabs)"), 100);
          return;
        }
      }
      
      console.log('[CALLBACK] Processing GoCardless callback with ref:', params.ref);

      // Check if there's an error from the bank
      if (oauthError) {
        setStatus("error");
        setMessage("Bank connection was cancelled or failed.");
        showError("Bank connection failed. Please try again.");
        setTimeout(() => {
          try {
            router.push("/(tabs)");
          } catch (navError) {
            router.back();
          }
        }, 2000);
        return;
      }

      if (code || params.ref) {
        setStatus("loading");
        setMessage("Finalizing bank connection...");

        // Banking callback can proceed without authentication 
        // Backend is configured to handle this as a critical endpoint
        console.log("[CALLBACK] Creating new bank connection");
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) {
          console.log("[CALLBACK] No access token found - this is normal during banking callbacks");
          // Don't return here - allow the request to proceed
        }

        // Try to refresh the token before making the API call
        try {
          const refreshToken = await AsyncStorage.getItem("refreshToken");
          if (refreshToken) {
            console.log("[CALLBACK] Attempting token refresh before API call");
            const refreshResponse = await authAPI.refreshToken(refreshToken);
            if (refreshResponse.accessToken) {
              await AsyncStorage.setItem(
                "accessToken",
                refreshResponse.accessToken
              );
              console.log("[CALLBACK] Token refreshed successfully");
            }
          }
        } catch (refreshError) {
          console.error("[CALLBACK] Token refresh failed:", refreshError);
          // Continue with the original token
        }

        try {
          let response;
          if (isReconnecting && reconnectAccountId) {
            console.log("[CALLBACK] Reconnecting bank:", reconnectAccountId);
            setMessage("Reconnecting your bank account...");
            response = await bankingAPI.reconnectBank(
              reconnectAccountId
            );
            console.log(
              "[BankCallbackScreen] reconnectBank response:",
              response
            );
            setStatus("success");
            setMessage("Bank reconnected successfully!");
            showAlert(
              "Success",
              "Your bank account has been reconnected successfully."
            );
          } else {
            console.log("[CALLBACK] Creating new bank connection");
            let callbackParam = code as string;
            
            // For GoCardless callbacks, we need to get the requisition ID from the stored reference
            if (!code && params.ref) {
              console.log("[CALLBACK] GoCardless callback - looking up requisition ID for ref:", params.ref);
              try {
                const storedRequisitionId = await AsyncStorage.getItem(`requisition_${params.ref}`);
                if (storedRequisitionId) {
                  callbackParam = storedRequisitionId;
                  console.log("[CALLBACK] Found stored requisition ID:", storedRequisitionId);
                } else {
                  console.error("[CALLBACK] No stored requisition ID found for ref:", params.ref);
                  
                  // Fallback: Check if the reference itself looks like a UUID (direct requisition ID)
                  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                  if (uuidRegex.test(params.ref as string)) {
                    console.log("[CALLBACK] Reference looks like a UUID, using directly as requisition ID:", params.ref);
                    callbackParam = params.ref as string;
                  } else {
                    // Try to find any stored requisition that might match
                    console.log("[CALLBACK] Searching for any stored requisition references...");
                    const allKeys = await AsyncStorage.getAllKeys();
                    const requisitionKeys = allKeys.filter(key => key.startsWith('requisition_'));
                    
                    if (requisitionKeys.length > 0) {
                      const latestKey = requisitionKeys[requisitionKeys.length - 1]; // Get most recent
                      const latestRequisitionId = await AsyncStorage.getItem(latestKey);
                      if (latestRequisitionId) {
                        console.log("[CALLBACK] Using latest stored requisition ID as fallback:", latestRequisitionId);
                        callbackParam = latestRequisitionId;
                      } else {
                        throw new Error(`No requisition ID found for reference: ${params.ref}`);
                      }
                    } else {
                      throw new Error(`No requisition ID found for reference: ${params.ref}`);
                    }
                  }
                }
              } catch (lookupError) {
                console.error("[CALLBACK] Error looking up requisition ID:", lookupError);
                throw lookupError;
              }
            }
            
            response = await bankingAPI.handleCallback(callbackParam);
            console.log(
              "[BankCallbackScreen] handleCallback response:",
              response
            );
            setStatus("success");
            setMessage("Bank connected successfully!");
            showAlert(
              "Success",
              "Your bank account has been connected successfully."
            );
          }
          // Set a flag to trigger refresh on the home screen
          await AsyncStorage.setItem("bankConnected", "true");
          // Ensure the in-app browser closes after success
          WebBrowser.maybeCompleteAuthSession();
          setTimeout(() => {
            try {
              router.push("/(tabs)");
            } catch (navError) {
              router.back();
            }
          }, 2000);
        } catch (apiError: any) {
          console.error("[CALLBACK] API Error:", apiError);

          // Handle authentication errors specifically
          if (apiError.response?.status === 401) {
            setStatus("error");
            setMessage("Authentication expired. Please log in again.");
            showError("Your session has expired. Please log in again.");
            // Clear auth data and redirect to login
            await AsyncStorage.multiRemove([
              "accessToken",
              "idToken",
              "refreshToken",
              "isLoggedIn",
              "user",
            ]);
            setTimeout(() => {
              try {
                router.push("/auth/Login");
              } catch (navError) {
                router.back();
              }
            }, 2000);
          } else if (apiError.response?.status === 429 && apiError.response?.data?.error === 'DAILY_LIMIT_REACHED') {
            // Handle GoCardless daily limit error
            setStatus("error");
            setMessage("Daily API limit reached. Try again tomorrow.");
            Alert.alert(
              "API Limit Reached",
              "GoCardless daily API limit has been reached. This is common during development. Please try connecting your bank again tomorrow.\n\nNote: This limit resets every 24 hours.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    setTimeout(() => {
                      try {
                        router.push("/(tabs)");
                      } catch (navError) {
                        router.back();
                      }
                    }, 500);
                  }
                }
              ]
            );
          } else {
            setStatus("error");
            setMessage("Failed to complete bank connection.");
            showError(
              apiError.response?.data?.message ||
                "Failed to complete bank connection. Please try again."
            );
            setTimeout(() => {
              WebBrowser.maybeCompleteAuthSession(); // Ensure browser closes on API error
              try {
                router.push("/(tabs)");
              } catch (navError) {
                router.back();
              }
            }, 2000);
          }
        }
      } else {
        setStatus("error");
        setMessage("Bank connection failed. No code provided.");
        showError("Failed to connect bank account. Please try again.");
        setTimeout(() => {
          WebBrowser.maybeCompleteAuthSession(); // Ensure browser closes on missing code
          try {
            router.push("/(tabs)");
          } catch (navError) {
            router.back();
          }
        }, 2000);
      }
    } catch (error: any) {
      console.error("[CALLBACK] General Error:", error);
      setStatus("error");
      setMessage("An error occurred while processing the connection.");
      showError("Connection processing failed. Please try again.");
      WebBrowser.maybeCompleteAuthSession(); // Ensure browser closes on general error
      setTimeout(() => {
        try {
          router.push("/(tabs)");
        } catch (navError) {
          router.back();
        }
      }, 2000);
    }
  };

  // Don't render anything if we're redirecting immediately
  if (status === "redirecting") {
    return null;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <View style={styles.content}>
        {status === "loading" && (
          <ActivityIndicator size="large" color={colors.primary[500]} />
        )}

        <Text style={[styles.title, { color: colors.text.primary }]}>
          {status === "success"
            ? "✅ Success"
            : status === "error"
              ? "❌ Error"
              : "⏳ Processing"}
        </Text>

        <Text style={[styles.message, { color: colors.text.secondary }]}>
          {message}
        </Text>

        <Text style={[styles.redirect, { color: colors.text.tertiary }]}>
          Redirecting you back to the app...
        </Text>

        {/* Manual back button in case automatic navigation fails */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary[500] }]}
          onPress={() => {
            try {
              router.push("/(tabs)");
            } catch (navError) {
              console.error("[CALLBACK] Manual navigation error:", navError);
              router.back();
            }
          }}
        >
          <Text style={[styles.backButtonText, { color: "white" }]}>
            Go to Home
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 24,
  },
  redirect: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
