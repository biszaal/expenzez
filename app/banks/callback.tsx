import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import { bankingAPI, authAPI } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BankCallbackScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showAlert, showError } = useAlert();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Processing bank connection...");

  const params = useLocalSearchParams();
  const { code, error: oauthError } = params;

  useEffect(() => {
    // Add a small delay to ensure the screen is fully loaded
    const timer = setTimeout(() => {
      handleCallback();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleCallback = async () => {
    try {
      console.log(
        "[CALLBACK] Starting TrueLayer callback with params:",
        params
      );

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

      if (code) {
        setStatus("loading");
        setMessage("Finalizing bank connection...");

        // Check if user is authenticated before making API call
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) {
          console.error("[CALLBACK] No access token found");
          setStatus("error");
          setMessage("Authentication required. Please log in again.");
          showError("Please log in to complete bank connection.");
          setTimeout(() => {
            try {
              router.push("/auth/Login");
            } catch (navError) {
              router.back();
            }
          }, 2000);
          return;
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
          const response = await bankingAPI.handleCallback(code as string);
          console.log(
            "[BankCallbackScreen] handleCallback response:",
            response
          );
          console.log("[CALLBACK] TrueLayer token response:", response);
          setStatus("success");
          setMessage("Bank connected successfully!");
          showAlert(
            "Success",
            "Your bank account has been connected successfully."
          );
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
          } else {
            setStatus("error");
            setMessage("Failed to complete bank connection.");
            showError(
              apiError.response?.data?.message ||
                "Failed to complete bank connection. Please try again."
            );
            setTimeout(() => {
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
      setTimeout(() => {
        try {
          router.push("/(tabs)");
        } catch (navError) {
          router.back();
        }
      }, 2000);
    }
  };

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
