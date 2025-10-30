import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "../contexts/ThemeContext";
import { useSubscription } from "../hooks/useSubscription";
import { PremiumFeature } from "../services/subscriptionService";
import { CSVImportPaywall } from "../components/paywalls/CSVImportPaywall";
import { transactionAPI } from "../services/api";
import { autoBillDetection } from "../services/automaticBillDetection";
import { ExpenseCategory, ImportPreview } from "../types/expense";
import type { CSVTransaction } from "../services/api/transactionAPI";
import { CSVDetector, ParsedCSVRow } from "../services/csvDetector";
import { CategorizeTransaction } from "../services/categorizeTransaction";

interface CSVTransactionPreview {
  id: string;
  date: string;
  description: string;
  amount: number;
  originalAmount: number;
  category: string;
  type: "debit" | "credit";
  tags?: string[];
  merchant?: string;
  accountId?: string;
  bankName?: string;
  accountType?: string;
  isPending?: boolean;
}

const CSV_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "food", name: "Food & Dining", emoji: "🍔" },
  { id: "transport", name: "Transport", emoji: "🚗" },
  { id: "shopping", name: "Shopping", emoji: "🛍️" },
  { id: "entertainment", name: "Entertainment", emoji: "🎬" },
  { id: "bills", name: "Bills & Utilities", emoji: "💡" },
  { id: "healthcare", name: "Healthcare", emoji: "💊" },
  { id: "education", name: "Education", emoji: "📚" },
  { id: "travel", name: "Travel", emoji: "✈️" },
  { id: "groceries", name: "Groceries", emoji: "🛒" },
  { id: "fuel", name: "Fuel", emoji: "⛽" },
  { id: "subscriptions", name: "Subscriptions", emoji: "💳" },
  { id: "income", name: "Income", emoji: "💰" },
  { id: "other", name: "Other", emoji: "📦" },
];

export default function CSVImportScreen() {
  const { colors } = useTheme();
  const { isPremium, hasFeatureAccess } = useSubscription();

  // Check if user has access to CSV import feature
  const featureAccess = hasFeatureAccess(PremiumFeature.CSV_IMPORT);

  // Show paywall if user doesn't have access
  if (!isPremium || !featureAccess.hasAccess) {
    return <CSVImportPaywall />;
  }

  const [loading, setLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [allTransactions, setAllTransactions] = useState<CSVTransaction[]>([]);
  const [previewTransactions, setPreviewTransactions] = useState<
    CSVTransactionPreview[]
  >([]);

  const validateCSVFormat = (
    csvText: string
  ): { isValid: boolean; error?: string } => {
    // Check if file is empty or too small
    if (!csvText || csvText.trim().length < 10) {
      return {
        isValid: false,
        error: "File appears to be empty or too small.",
      };
    }

    // Check for basic CSV structure
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      return {
        isValid: false,
        error: "File must contain at least a header row and one data row.",
      };
    }

    // Check if it looks like a CSV (contains commas)
    const hasCommas = lines.some((line) => line.includes(","));
    if (!hasCommas) {
      return {
        isValid: false,
        error: "File does not appear to be in CSV format (no commas found).",
      };
    }

    // Check header row for expected columns
    const header = lines[0].toLowerCase();
    const hasDate = header.includes("date");
    const hasDescription = header.includes("description");
    const hasAmount = header.includes("amount");
    const hasCategory = header.includes("category");
    const hasType = header.includes("type");

    if (!hasDate && !hasDescription && !hasAmount && !hasCategory && !hasType) {
      // Maybe no header row, check if first data row looks valid
      const firstDataRow = lines[0].split(",");
      if (firstDataRow.length < 5) {
        return {
          isValid: false,
          error:
            "CSV must have exactly 5 columns: Date, Description, Amount, Category, Type.",
        };
      }

      // Try to validate first row as data
      const dateStr = firstDataRow[0].trim().replace(/"/g, "");
      if (!isValidDate(dateStr)) {
        return {
          isValid: false,
          error: "First column does not appear to contain valid dates.",
        };
      }
    } else {
      // Check that all required columns are present
      if (
        !hasDate ||
        !hasDescription ||
        !hasAmount ||
        !hasCategory ||
        !hasType
      ) {
        return {
          isValid: false,
          error:
            "CSV header must contain: Date, Description, Amount, Category, Type",
        };
      }
    }

    return { isValid: true };
  };

  const parseCSV = (
    csvText: string
  ): {
    transactions: CSVTransaction[];
    preview: CSVTransactionPreview[];
    errors: string[];
  } => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    const transactions: CSVTransaction[] = [];
    const preview: CSVTransactionPreview[] = [];
    const errors: string[] = [];

    // Determine if first row is header
    const firstRow = lines[0].toLowerCase();
    const isHeader =
      firstRow.includes("date") &&
      firstRow.includes("description") &&
      firstRow.includes("amount") &&
      firstRow.includes("category") &&
      firstRow.includes("type");
    const dataLines = isHeader ? lines.slice(1) : lines;

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const columns = line
        .split(",")
        .map((col) => col.trim().replace(/"/g, ""));
      const rowNumber = i + (isHeader ? 2 : 1);

      // Validate minimum columns (Date, Description, Amount, Category, Type)
      if (columns.length < 5) {
        errors.push(
          `Row ${rowNumber}: Must have 5 columns: Date, Description, Amount, Category, Type`
        );
        continue;
      }

      const dateStr = columns[0];
      const description = columns[1];
      const amountStr = columns[2];
      const categoryStr = columns[3];
      const typeStr = columns[4];

      // Basic validation only - let backend handle categorization
      if (!dateStr || !isValidDate(dateStr)) {
        errors.push(`Row ${rowNumber}: Invalid or missing date "${dateStr}"`);
        continue;
      }

      if (!description || description.length < 2) {
        errors.push(`Row ${rowNumber}: Description too short or missing`);
        continue;
      }

      const rawAmount = parseFloat(amountStr.replace(/[£$,\s]/g, ""));
      if (isNaN(rawAmount) || rawAmount === 0) {
        errors.push(`Row ${rowNumber}: Invalid amount "${amountStr}"`);
        continue;
      }

      if (
        !typeStr ||
        (typeStr.toLowerCase() !== "debit" &&
          typeStr.toLowerCase() !== "credit")
      ) {
        errors.push(
          `Row ${rowNumber}: Type must be "debit" or "credit", got "${typeStr}"`
        );
        continue;
      }

      const type = typeStr.toLowerCase() as "debit" | "credit";
      const amount = Math.abs(rawAmount);

      // Create transaction for backend (no category validation)
      transactions.push({
        id: `csv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        date: formatDate(dateStr),
        description: description.trim(),
        amount,
        originalAmount: amount,
        category: categoryStr || "", // Send original category, let backend auto-categorize if invalid
        type,
      });

      // Create preview transaction with basic categorization for preview
      const previewCategory = categorizeTransaction(description.trim());

      preview.push({
        id: `csv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        date: formatDate(dateStr),
        description: description.trim(),
        amount: type === "debit" ? -amount : amount,
        originalAmount: amount,
        category: previewCategory,
        type,
        tags: ["csv-import"],
        merchant: description.trim(),
        accountId: "csv-import",
        bankName: "CSV Import",
        accountType: "Imported Account",
        isPending: false,
      });
    }

    return { transactions, preview, errors };
  };

  const isValidDate = (dateStr: string): boolean => {
    // Support various date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toISOString();
  };

  const categorizeTransaction = (description: string): string => {
    // Enhanced keyword matching for transaction categorization
    const desc = description.toLowerCase();

    // Check for income keywords first (but exclude rent payments)
    if (
      (desc.includes("salary") ||
        desc.includes("wage") ||
        desc.includes("pay") ||
        desc.includes("income") ||
        desc.includes("deposit") ||
        desc.includes("refund") ||
        desc.includes("bonus") ||
        desc.includes("interest") ||
        desc.includes("freelance") ||
        desc.includes("dividend")) &&
      !desc.includes("rent")
    ) {
      return "income";
    }

    // Healthcare - specific patterns
    if (
      desc.includes("fitness assessment") ||
      desc.includes("month end fitness") ||
      desc.includes("health assessment") ||
      desc.includes("fitness") ||
      desc.includes("health") ||
      desc.includes("assessment") ||
      desc.includes("hospital") ||
      desc.includes("doctor") ||
      desc.includes("medical") ||
      desc.includes("pharmacy") ||
      desc.includes("dentist") ||
      desc.includes("optician") ||
      desc.includes("boots") ||
      desc.includes("nhs") ||
      desc.includes("prescription")
    ) {
      return "healthcare";
    }

    // Transport - specific patterns
    if (
      desc.includes("equipment transport") ||
      desc.includes("autumn equipment transport") ||
      desc.includes("transport") ||
      desc.includes("uber") ||
      desc.includes("taxi") ||
      desc.includes("bus") ||
      desc.includes("train") ||
      desc.includes("tfl") ||
      desc.includes("oyster") ||
      desc.includes("parking") ||
      desc.includes("toll") ||
      desc.includes("delivery")
    ) {
      return "transport";
    }

    // Fuel
    if (
      desc.includes("petrol") ||
      desc.includes("diesel") ||
      desc.includes("fuel") ||
      desc.includes("shell") ||
      desc.includes("bp") ||
      desc.includes("esso") ||
      desc.includes("texaco")
    ) {
      return "fuel";
    }

    // Groceries - specific patterns
    if (
      desc.includes("co-op weekly shop") ||
      desc.includes("weekly shop") ||
      desc.includes("tesco grocery") ||
      desc.includes("grocery shopping") ||
      desc.includes("grocery") ||
      desc.includes("groceries") ||
      desc.includes("supermarket") ||
      desc.includes("tesco") ||
      desc.includes("sainsbury") ||
      desc.includes("asda") ||
      desc.includes("morrisons") ||
      desc.includes("co-op") ||
      desc.includes("waitrose") ||
      desc.includes("lidl") ||
      desc.includes("aldi") ||
      desc.includes("iceland")
    ) {
      return "groceries";
    }

    // Food & Dining - specific patterns
    if (
      desc.includes("last week of september dinner") ||
      desc.includes("autumn harvest dinner") ||
      desc.includes("september dinner") ||
      desc.includes("harvest dinner") ||
      desc.includes("dinner") ||
      desc.includes("lunch") ||
      desc.includes("breakfast") ||
      desc.includes("meal") ||
      desc.includes("restaurant") ||
      desc.includes("cafe") ||
      desc.includes("pub") ||
      desc.includes("takeaway") ||
      desc.includes("mcdonald") ||
      desc.includes("kfc") ||
      desc.includes("pizza") ||
      desc.includes("burger") ||
      desc.includes("subway") ||
      desc.includes("starbucks") ||
      desc.includes("costa") ||
      desc.includes("nando") ||
      desc.includes("deliveroo") ||
      desc.includes("just eat") ||
      desc.includes("uber eats")
    ) {
      return "food";
    }

    // Shopping - specific patterns
    if (
      desc.includes("premium autumn shop") ||
      desc.includes("autumn sports equipment") ||
      desc.includes("professional autumn collection") ||
      desc.includes("professional camera upgrade") ||
      desc.includes("camera upgrade") ||
      desc.includes("sports equipment") ||
      desc.includes("autumn collection") ||
      desc.includes("shopping") ||
      desc.includes("shop") ||
      desc.includes("equipment") ||
      desc.includes("upgrade") ||
      desc.includes("camera") ||
      desc.includes("collection") ||
      desc.includes("professional") ||
      desc.includes("amazon") ||
      desc.includes("ebay") ||
      desc.includes("argos") ||
      desc.includes("currys") ||
      desc.includes("john lewis") ||
      desc.includes("marks") ||
      desc.includes("next") ||
      desc.includes("h&m") ||
      desc.includes("zara") ||
      desc.includes("clothing") ||
      desc.includes("fashion")
    ) {
      return "shopping";
    }

    // Subscriptions - specific patterns
    if (
      desc.includes("audible monthly subscription") ||
      desc.includes("monthly subscription") ||
      desc.includes("audible") ||
      desc.includes("subscription") ||
      desc.includes("netflix") ||
      desc.includes("spotify") ||
      desc.includes("amazon prime") ||
      desc.includes("disney") ||
      desc.includes("youtube") ||
      desc.includes("apple music") ||
      desc.includes("monthly payment") ||
      desc.includes("annual fee") ||
      desc.includes("membership")
    ) {
      return "subscriptions";
    }

    // Entertainment
    if (
      desc.includes("entertainment") ||
      desc.includes("cinema") ||
      desc.includes("gym") ||
      desc.includes("sport") ||
      desc.includes("game") ||
      desc.includes("playstation") ||
      desc.includes("xbox")
    ) {
      return "entertainment";
    }

    // Bills detection - comprehensive patterns
    if (isBillTransaction(desc)) {
      return "bills";
    }

    // Education
    if (
      desc.includes("education") ||
      desc.includes("school") ||
      desc.includes("university") ||
      desc.includes("college") ||
      desc.includes("course") ||
      desc.includes("tuition") ||
      desc.includes("books") ||
      desc.includes("student")
    ) {
      return "education";
    }

    // Travel
    if (
      desc.includes("travel") ||
      desc.includes("hotel") ||
      desc.includes("flight") ||
      desc.includes("airline") ||
      desc.includes("booking") ||
      desc.includes("expedia") ||
      desc.includes("airbnb") ||
      desc.includes("holiday")
    ) {
      return "travel";
    }

    return "other";
  };

  const isBillTransaction = (description: string): boolean => {
    const desc = description.toLowerCase();

    // Utility bills patterns
    const utilityPatterns = [
      // Energy companies
      "british gas",
      "bg",
      "eon",
      "e.on",
      "edf",
      "scottish power",
      "npower",
      "sse",
      "bulb",
      "octopus",
      "green supplier",
      "utility warehouse",

      // Water companies
      "thames water",
      "anglian water",
      "severn trent",
      "united utilities",
      "yorkshire water",
      "south west water",
      "water bill",

      // Telecoms
      "bt",
      "ee",
      "o2",
      "vodafone",
      "three",
      "3 mobile",
      "virgin media",
      "sky",
      "talktalk",
      "plusnet",
      "giffgaff",
      "tesco mobile",

      // Internet/TV
      "broadband",
      "wifi",
      "internet",
      "tv licence",
      "netflix",
      "spotify",
      "amazon prime",
      "disney plus",
      "apple music",
      "youtube premium",

      // Insurance
      "insurance",
      "policy",
      "premium",
      "aviva",
      "axa",
      "direct line",
      "churchill",
      "admiral",
      "compare the market",
      "go compare",

      // Housing
      "rent",
      "mortgage",
      "council tax",
      "service charge",
      "ground rent",
      "letting",
      "property",
      "estate agent",

      // General bill keywords
      "bill",
      "payment",
      "direct debit",
      "dd",
      "standing order",
      "so",
      "monthly payment",
      "subscription",
      "membership",
    ];

    // Bill-specific terms
    const billTerms = [
      "electric",
      "electricity",
      "gas",
      "water",
      "heating",
      "energy",
      "phone",
      "mobile",
      "landline",
      "broadband",
      "internet",
      "wifi",
      "council tax",
      "rates",
      "service charge",
      "maintenance",
      "insurance",
      "policy",
      "premium",
      "cover",
      "mortgage",
      "rent",
      "letting",
      "property",
      "subscription",
      "membership",
      "annual fee",
      "monthly fee",
    ];

    // Payment method indicators (often used for bills)
    const paymentIndicators = [
      "direct debit",
      "dd ",
      " dd",
      "standing order",
      "so ",
      " so",
      "auto payment",
      "recurring",
      "monthly payment",
      "quarterly payment",
      "annual payment",
      "autopay",
    ];

    // Amount patterns that suggest bills (regular, round numbers)
    const isRegularAmount = (desc: string): boolean => {
      const amounts = desc.match(/[\d.,]+/g);
      if (amounts) {
        return amounts.some((amount) => {
          const num = parseFloat(amount.replace(",", ""));
          // Bills often end in .00, .50, .99 or are round numbers
          return (
            num % 1 === 0 ||
            num % 0.5 === 0 ||
            amount.endsWith(".99") ||
            amount.endsWith(".00")
          );
        });
      }
      return false;
    };

    // Check for utility company names
    if (utilityPatterns.some((pattern) => desc.includes(pattern))) {
      return true;
    }

    // Check for bill-specific terms
    if (billTerms.some((term) => desc.includes(term))) {
      return true;
    }

    // Check for payment method indicators
    if (paymentIndicators.some((indicator) => desc.includes(indicator))) {
      return true;
    }

    // Check for regular amount patterns combined with neutral descriptions
    if (
      isRegularAmount(desc) &&
      (desc.includes("payment") ||
        desc.includes("monthly") ||
        desc.includes("annual") ||
        desc.includes("quarterly"))
    ) {
      return true;
    }

    // Date-based patterns (bills often have dates in description)
    const hasDatePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(desc);
    const hasMonthYear =
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{2,4}\b/i.test(
        desc
      );

    if (
      (hasDatePattern || hasMonthYear) &&
      (desc.includes("payment") ||
        desc.includes("bill") ||
        desc.includes("charge"))
    ) {
      return true;
    }

    return false;
  };

  const handleFileSelect = async () => {
    try {
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({});
      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];

      // Validate file extension
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith(".csv") && !fileName.endsWith(".txt")) {
        Alert.alert(
          "Invalid File Type",
          "Please select a CSV file (.csv) or text file (.txt) with comma-separated values."
        );
        setLoading(false);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert(
          "File Too Large",
          "File size exceeds 5MB limit. Please select a smaller file."
        );
        setLoading(false);
        return;
      }

      setSelectedFile(file.name);

      // Read file content
      const response = await fetch(file.uri);
      const csvText = await response.text();

      // Use new smart CSV detector
      const parseResult = CSVDetector.parseCSV(csvText);

      if (parseResult.rows.length === 0) {
        Alert.alert(
          "No Data",
          parseResult.errors[0] || "No valid transactions found in the CSV file. Please check the format."
        );
        setLoading(false);
        return;
      }

      // Auto-categorize transactions (ignore CSV categories, always use smart detection)
      const categorizedTransactions = parseResult.rows.map((row) => ({
        id: `csv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        date: row.date,
        description: row.description,
        amount: row.amount,
        originalAmount: row.amount,
        category: CategorizeTransaction.categorize(row.description, row.merchant),
        type: row.type,
        merchant: row.merchant,
        tags: ["csv-import"],
      }));

      // Show warnings if there were parsing errors
      if (parseResult.errors.length > 0) {
        const errorSummary = parseResult.errors.slice(0, 2).join("\n");
        const moreErrors =
          parseResult.errors.length > 2
            ? `\n... and ${parseResult.errors.length - 2} more`
            : "";
        Alert.alert(
          "Info",
          `${parseResult.errors.length} rows were skipped.\n\n${errorSummary}${moreErrors}\n\nImporting ${parseResult.rows.length} valid transactions.`
        );
      }

      // Navigate to preview screen with transactions
      router.push({
        pathname: "/csv-import-preview",
        params: {
          transactions: JSON.stringify(categorizedTransactions),
          fileName: file.name,
          formatDetected: parseResult.formatDetected,
        },
      });
    } catch (error) {
      console.error("Error reading CSV file:", error);
      Alert.alert("Error", "Failed to read the CSV file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importPreview) return;

    try {
      setImporting(true);

      // Use backend CSV import with auto-categorization
      const result =
        await transactionAPI.importCsvTransactions(allTransactions);

      // Use summary if available, otherwise fallback to direct properties
      const summary = result.summary || {
        imported: result.imported,
        failed: result.failed,
        autoCategorized: 0,
        keywordCategorized: 0,
        aiCategorized: 0,
      };

      const expenseCount = previewTransactions.filter(
        (t) => t.amount < 0
      ).length;
      const incomeCount = previewTransactions.filter(
        (t) => t.amount > 0
      ).length;

      let summaryMessage = `Import completed with auto-categorization:\n• ${summary.imported} transactions saved to database\n• ${expenseCount} expenses\n• ${incomeCount} income entries`;

      if (summary.autoCategorized && summary.autoCategorized > 0) {
        summaryMessage += `\n• ${summary.autoCategorized} transactions auto-categorized`;

        if (summary.keywordCategorized && summary.keywordCategorized > 0) {
          summaryMessage += `\n  - ${summary.keywordCategorized} by keyword matching`;
        }

        if (summary.aiCategorized && summary.aiCategorized > 0) {
          summaryMessage += `\n  - ${summary.aiCategorized} by AI analysis`;
        }
      }

      if (summary.failed > 0) {
        summaryMessage += `\n• ${summary.failed} failed to import`;

        // Show first few errors
        if (result.errors && result.errors.length > 0) {
          const maxErrors = 3;
          const errorSummary = result.errors.slice(0, maxErrors).join("\n");
          const moreErrors =
            result.errors.length > maxErrors
              ? `\n... and ${result.errors.length - maxErrors} more errors`
              : "";
          console.warn(`Import errors:\n${errorSummary}${moreErrors}`);
        }
      }

      // Trigger automatic bill detection for recurring patterns
      if (summary.imported > 0) {
        // Run bill detection in background (don't block the success alert)
        autoBillDetection
          .refreshAfterTransactionChanges(summary.imported)
          .then((detectedBills) => {
            if (detectedBills.length > 0) {
              console.log(
                `[CSV Import] Detected ${detectedBills.length} bills after import`
              );
            }
          })
          .catch((error) => {
            console.warn(
              "[CSV Import] Background bill detection failed:",
              error
            );
          });

        summaryMessage += `\n\n✨ Transactions were automatically categorized based on their descriptions.\n💡 Check the Bills tab to see any recurring payments detected from your data.`;
      }

      Alert.alert(
        summary.imported > 0 ? "Import Successful" : "Import Failed",
        summaryMessage,
        [
          {
            text: "View Dashboard",
            onPress: () => {
              router.replace("/");
            },
          },
          ...(summary.imported > 0
            ? [
                {
                  text: "View Bills",
                  onPress: () => {
                    router.replace("/(tabs)/bills");
                  },
                },
              ]
            : []),
        ]
      );
    } catch (error: any) {
      console.error("Error importing CSV:", error);
      Alert.alert(
        "Error",
        `Failed to import transactions: ${error.message || "Please check your connection and try again."}`
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary.main}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Import CSV
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Instructions */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Smart CSV Import
          </Text>
          <Text style={[styles.instructions, { color: colors.text.secondary }]}>
            Upload a CSV file from your bank, credit card, or payment app. Our smart import engine automatically detects the format, intelligently categorizes each transaction, identifies recurring bills, and learns from your spending patterns.
          </Text>

          <View style={styles.formatInfo}>
            <Text style={[styles.formatTitle, { color: colors.text.primary }]}>
              Supported formats:
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • Minimum: Date, Amount, Description
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • Full: Date, Description, Amount, Category, Type, Merchant
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • Works with most banks and payment apps
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • Amounts: Positive or negative values supported
            </Text>

            <Text
              style={[
                styles.formatTitle,
                { color: colors.text.primary, marginTop: 12 },
              ]}
            >
              Requirements:
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • File size: Maximum 5MB
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • Valid dates (YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY)
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • Non-empty descriptions
            </Text>
            <Text style={[styles.formatItem, { color: colors.text.secondary }]}>
              • Amounts under £50,000
            </Text>
          </View>
        </View>

        {/* File Selection */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.selectButton,
              {
                backgroundColor: colors.primary.main[100],
                borderColor: colors.primary.main[300],
              },
            ]}
            onPress={handleFileSelect}
            disabled={loading}
          >
            <Ionicons
              name="document-text"
              size={24}
              color={colors.primary.main[600]}
            />
            <Text
              style={[styles.selectButtonText, { color: colors.primary.main[600] }]}
            >
              {loading ? "Reading file..." : "Select CSV File"}
            </Text>
            {loading && (
              <ActivityIndicator size="small" color={colors.primary.main[600]} />
            )}
          </TouchableOpacity>

          {selectedFile && (
            <Text
              style={[styles.selectedFile, { color: colors.text.secondary }]}
            >
              Selected: {selectedFile}
            </Text>
          )}
        </View>

        {/* Import Preview */}
        {importPreview && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Import Preview
            </Text>

            <View style={styles.previewStats}>
              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: colors.text.primary }]}
                >
                  {importPreview.totalTransactions}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.text.secondary }]}
                >
                  Transactions
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: colors.text.primary }]}
                >
                  £{importPreview.totalAmount.toFixed(2)}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.text.secondary }]}
                >
                  Total Amount
                </Text>
              </View>
            </View>

            <Text style={[styles.dateRange, { color: colors.text.secondary }]}>
              Date range: {importPreview.dateRange.start} -{" "}
              {importPreview.dateRange.end}
            </Text>

            <View style={styles.previewList}>
              <Text
                style={[styles.previewTitle, { color: colors.text.primary }]}
              >
                Sample Transactions:
              </Text>
              {importPreview.transactions.map((transaction, index) => (
                <View key={index} style={styles.previewItem}>
                  <View style={styles.previewItemHeader}>
                    <Text
                      style={[
                        styles.previewDescription,
                        { color: colors.text.primary },
                      ]}
                    >
                      {transaction.description}
                    </Text>
                    <Text
                      style={[
                        styles.previewAmount,
                        {
                          color: transaction.amount > 0 ? "#059669" : "#DC2626",
                        },
                      ]}
                    >
                      {transaction.amount > 0 ? "+" : ""}£
                      {Math.abs(transaction.amount).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.previewItemFooter}>
                    <Text
                      style={[
                        styles.previewDate,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                    <View
                      style={[
                        styles.categoryTag,
                        {
                          backgroundColor:
                            transaction.category === "bills"
                              ? "#FEF3C7"
                              : transaction.amount > 0
                                ? "#E8F5E8"
                                : "#FEF2F2",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          {
                            color:
                              transaction.category === "bills"
                                ? "#D97706"
                                : transaction.amount > 0
                                  ? "#059669"
                                  : "#DC2626",
                          },
                        ]}
                      >
                        {CSV_EXPENSE_CATEGORIES.find(
                          (c) => c.id === transaction.category
                        )?.name || "Other"}
                        {transaction.category === "bills" && " 💡"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.importButton,
                {
                  backgroundColor: colors.primary.main,
                  opacity: importing ? 0.6 : 1,
                },
              ]}
              onPress={handleImport}
              disabled={importing}
            >
              {importing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="cloud-upload" size={20} color="#fff" />
              )}
              <Text style={styles.importButtonText}>
                {importing ? "Importing..." : "Import All Transactions"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  formatInfo: {
    marginTop: 8,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  formatItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    gap: 8,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  selectedFile: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  previewStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  dateRange: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  previewList: {
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  previewItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  previewItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  previewAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  previewItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewDate: {
    fontSize: 12,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  importButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
