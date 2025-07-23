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
import { bankingAPI } from "../../services/api";
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
  const { ref, status: bankStatus, error, requisition_id } = params;

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      console.log("[CALLBACK] Starting bank callback with params:", params);

      // Check if there's an error from the bank
      if (error) {
        console.log("[CALLBACK] Bank returned error:", error);
        setStatus("error");
        setMessage("Bank connection was cancelled or failed.");
        showError("Bank connection failed. Please try again.");
        setTimeout(() => {
          try {
            router.push("/banks/connect");
          } catch (navError) {
            console.error("[CALLBACK] Navigation error:", navError);
            router.back();
          }
        }, 2000);
        return;
      }

      // Check if the connection was successful
      if (bankStatus === "success" || ref || requisition_id) {
        setStatus("loading");
        setMessage("Finalizing bank connection...");

        // Get requisition ID from URL params or stored value
        let requisitionId = (requisition_id as string) || (ref as string);

        // If no requisition ID in URL, try to get it from storage
        if (!requisitionId) {
          try {
            requisitionId = (await AsyncStorage.getItem("requisitionId")) || "";
            console.log(
              "[CALLBACK] Retrieved requisitionId from storage:",
              requisitionId
            );
          } catch (storageError) {
            console.error(
              "[CALLBACK] Error reading requisitionId from storage:",
              storageError
            );
          }
        }

        console.log("[CALLBACK] Processing requisitionId:", requisitionId);

        if (!requisitionId) {
          console.log("[CALLBACK] No requisitionId found");
          setStatus("error");
          setMessage("Bank connection failed - no session found.");
          showError(
            "Bank connection session not found. Please try connecting your bank again."
          );
          setTimeout(() => {
            try {
              router.push("/banks/connect");
            } catch (navError) {
              console.error("[CALLBACK] Navigation error:", navError);
              router.back();
            }
          }, 2000);
          return;
        }

        // Call backend to fetch accounts
        try {
          const response = await bankingAPI.handleCallback({
            requisitionId: requisitionId,
          });
          console.log("[CALLBACK] Bank connection response:", response);

          if (response.status === "connected") {
            setStatus("success");
            setMessage("Bank connected successfully!");
            showAlert(
              "Success",
              "Your bank account has been connected successfully."
            );
            // Clear stored requisition ID on success
            await AsyncStorage.removeItem("requisitionId");
            setTimeout(() => {
              try {
                router.push("/(tabs)");
              } catch (navError) {
                console.error("[CALLBACK] Navigation error:", navError);
                // Fallback: try to go back
                router.back();
              }
            }, 2000);
          } else if (response.status === "pending") {
            setStatus("error");
            setMessage(
              "Bank connection is still processing. Please try again later."
            );
            showError(
              response.suggestion ||
                "Connection is still processing. Please wait a moment and try again."
            );
            setTimeout(() => {
              try {
                router.push("/banks/connect");
              } catch (navError) {
                console.error("[CALLBACK] Navigation error:", navError);
                router.back();
              }
            }, 3000);
          } else {
            setStatus("error");
            setMessage("Bank connection status unclear.");
            showError("Connection status unclear. Please try again.");
            setTimeout(() => {
              try {
                router.push("/banks/connect");
              } catch (navError) {
                console.error("[CALLBACK] Navigation error:", navError);
                router.back();
              }
            }, 2000);
          }
        } catch (apiError: any) {
          console.error("[CALLBACK] API callback error:", apiError);
          setStatus("error");
          setMessage("Failed to complete bank connection.");

          // Handle specific error cases
          let errorMessage =
            "Failed to complete bank connection. Please try again.";
          if (apiError.response?.data?.error === "REQUISITION_NOT_FOUND") {
            errorMessage =
              "Bank session expired. Please try connecting your bank again.";
            // Clear stored requisition ID on error
            await AsyncStorage.removeItem("requisitionId");
          } else if (apiError.response?.data?.message) {
            errorMessage = apiError.response.data.message;
          } else if (apiError.message) {
            errorMessage = apiError.message;
          }

          showError(errorMessage);
          setTimeout(() => {
            try {
              router.push("/banks/connect");
            } catch (navError) {
              console.error("[CALLBACK] Navigation error:", navError);
              router.back();
            }
          }, 2000);
        }
      } else {
        console.log("[CALLBACK] No valid callback parameters found");
        setStatus("error");
        setMessage("Bank connection failed.");
        showError("Failed to connect bank account. Please try again.");
        setTimeout(() => {
          try {
            router.push("/banks/connect");
          } catch (navError) {
            console.error("[CALLBACK] Navigation error:", navError);
            router.back();
          }
        }, 2000);
      }
    } catch (error: any) {
      console.error("[CALLBACK] Unexpected error:", error);
      setStatus("error");
      setMessage("An error occurred while processing the connection.");
      showError("Connection processing failed. Please try again.");
      setTimeout(() => {
        try {
          router.push("/banks/connect");
        } catch (navError) {
          console.error("[CALLBACK] Navigation error:", navError);
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
