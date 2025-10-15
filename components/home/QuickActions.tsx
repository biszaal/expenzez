import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Alert,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { DEEP_LINK_URLS } from "../../constants/config";
import { SHADOWS } from "../../constants/Colors";
import { styles } from "./QuickActions.styles";
import { useRevenueCat } from "../../contexts/RevenueCatContext";
import { transactionAPI } from "../../services/api";
import { autoBillDetection } from "../../services/automaticBillDetection";

export const QuickActions: React.FC = () => {
  const router = useRouter();
  const { isPro } = useRevenueCat();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConnectBank = async () => {
    // Navigate to Finexer bank connection screen
    router.push("/banking/connect");
  };

  const handleAddEntry = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Manual Entry", "Import CSV"],
          cancelButtonIndex: 0,
          title: "Add Transaction",
          message: "Choose how you want to add your transaction",
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            router.push("/add-transaction");
          } else if (buttonIndex === 2) {
            handleImportCSV();
          }
        }
      );
    } else {
      Alert.alert(
        "Add Transaction",
        "Choose how you want to add your transaction",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Manual Entry",
            onPress: () => router.push("/add-transaction"),
          },
          { text: "Import CSV", onPress: handleImportCSV },
        ]
      );
    }
  };

  const handleImportCSV = async () => {
    try {
      setIsProcessing(true);

      // Pick CSV file
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file) {
        Alert.alert("Error", "No file selected");
        return;
      }

      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(file.uri);

      // Parse CSV
      const lines = fileContent.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        Alert.alert(
          "Error",
          "CSV file must have at least a header and one data row"
        );
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const requiredHeaders = ["date", "description", "amount", "type"];
      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h)
      );

      if (missingHeaders.length > 0) {
        Alert.alert(
          "Invalid CSV Format",
          `Missing required columns: ${missingHeaders.join(", ")}\n\nRequired format:\nDate, Description, Amount, Type\nExample: 2024-01-15, Coffee Shop, 4.50, debit`
        );
        return;
      }

      // Parse transactions
      const transactions = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values.length >= 4) {
          const amount = parseFloat(values[2]);
          if (!isNaN(amount)) {
            transactions.push({
              date: values[0],
              description: values[1],
              amount: amount,
              type: values[3].toLowerCase(),
              category: "general",
              merchant: values[1],
              accountId: "csv-import",
              accountType: "Imported Account",
              bankName: "CSV Import",
              isPending: false,
            });
          }
        }
      }

      if (transactions.length === 0) {
        Alert.alert("Error", "No valid transactions found in CSV file");
        return;
      }

      // Show preview and confirm
      Alert.alert(
        "Import Preview",
        `Found ${transactions.length} transactions to import. Do you want to continue?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Import",
            onPress: () => importTransactions(transactions),
          },
        ]
      );
    } catch (error) {
      console.error("CSV Import Error:", error);
      Alert.alert(
        "Error",
        "Failed to process CSV file. Please check the format and try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const importTransactions = async (transactions: any[]) => {
    try {
      setIsProcessing(true);

      // Import transactions via API
      const response = await transactionAPI.importCSV(transactions);

      if (response.success) {
        Alert.alert(
          "Import Successful",
          `Successfully imported ${transactions.length} transactions!`,
          [{ text: "OK", onPress: () => router.push("/(tabs)/") }]
        );
      } else {
        Alert.alert(
          "Import Failed",
          response.error || "Failed to import transactions"
        );
      }
    } catch (error) {
      console.error("Import Error:", error);
      Alert.alert(
        "Import Failed",
        "Failed to import transactions. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.professionalQuickActionsWrapper}>
      <View style={styles.professionalQuickActionsGrid}>
        <TouchableOpacity
          style={styles.professionalQuickActionCard}
          onPress={() => router.push("/ai-assistant")}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.professionalQuickActionGradient,
              SHADOWS.lg,
              { backgroundColor: "#8B5CF6" },
            ]}
          >
            <View style={styles.professionalQuickActionIconContainer}>
              <View style={styles.professionalQuickActionIcon}>
                <Ionicons name="sparkles" size={24} color="white" />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>
                AI Insights
              </Text>
              <Text style={styles.professionalQuickActionSubtitle}>
                Smart analysis
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.professionalQuickActionCard}
          onPress={handleAddEntry}
          activeOpacity={0.85}
          disabled={isProcessing}
        >
          <View
            style={[
              styles.professionalQuickActionGradient,
              SHADOWS.lg,
              { backgroundColor: "#3B82F6" },
            ]}
          >
            <View style={styles.professionalQuickActionIconContainer}>
              <View style={styles.professionalQuickActionIcon}>
                <Ionicons
                  name={
                    isProcessing ? "hourglass-outline" : "add-circle-outline"
                  }
                  size={24}
                  color="white"
                />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>Add Entry</Text>
              <Text style={styles.professionalQuickActionSubtitle}>
                {isProcessing ? "Processing..." : "Manual or CSV"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.professionalQuickActionCard}
          onPress={handleConnectBank}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.professionalQuickActionGradient,
              SHADOWS.lg,
              { backgroundColor: "#10B981" },
            ]}
          >
            <View style={styles.professionalQuickActionIconContainer}>
              <View style={styles.professionalQuickActionIcon}>
                <Ionicons name="card-outline" size={24} color="white" />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>
                Connect Bank
              </Text>
              <Text style={styles.professionalQuickActionSubtitle}>
                Open banking
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.professionalQuickActionCard}
          onPress={() => router.push("/spending")}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.professionalQuickActionGradient,
              SHADOWS.lg,
              { backgroundColor: "#0EA5E9" },
            ]}
          >
            <View style={styles.professionalQuickActionIconContainer}>
              <View style={styles.professionalQuickActionIcon}>
                <Ionicons name="analytics-outline" size={24} color="white" />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>Analytics</Text>
              <Text style={styles.professionalQuickActionSubtitle}>
                Track spending
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
