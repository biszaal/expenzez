import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useTheme } from "../contexts/ThemeContext";
import { useSubscription } from "../hooks/useSubscription";
import { PremiumFeature } from "../services/subscriptionService";
import { CSVImportPaywall } from "../components/paywalls/CSVImportPaywall";
import { transactionAPI } from "../services/api";
import type { StatementImportResponse } from "../services/api/transactionAPI";

const MAX_PDF_BYTES = 8 * 1024 * 1024;

export default function ImportStatementScreen() {
  const { colors } = useTheme();
  const { hasFeatureAccess } = useSubscription();
  const access = hasFeatureAccess(PremiumFeature.CSV_IMPORT);
  const { sharedUri, sharedName } = useLocalSearchParams<{
    sharedUri?: string;
    sharedName?: string;
  }>();

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<StatementImportResponse | null>(null);
  const autoUploadedRef = useRef<string | null>(null);

  const uploadFromUri = useCallback(
    async (uri: string, filename?: string) => {
      try {
        setImporting(true);
        setResult(null);

        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists && (info as any).size && (info as any).size > MAX_PDF_BYTES) {
          Alert.alert(
            "File too large",
            "Statements must be 8 MB or smaller. Try splitting it or contact support."
          );
          return;
        }

        const fileBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const response = await transactionAPI.importStatement(
          fileBase64,
          filename
        );
        setResult(response);
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to import statement. Please try again.";
        Alert.alert("Import failed", message);
      } finally {
        setImporting(false);
      }
    },
    []
  );

  // Auto-upload when arriving via share intent (Android share-sheet → PDF).
  useEffect(() => {
    if (!access.hasAccess) return;
    if (!sharedUri || autoUploadedRef.current === sharedUri) return;
    autoUploadedRef.current = sharedUri;
    uploadFromUri(sharedUri, sharedName);
  }, [access.hasAccess, sharedUri, sharedName, uploadFromUri]);

  if (!access.hasAccess) {
    return <CSVImportPaywall />;
  }

  const handlePickAndImport = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (picked.canceled || !picked.assets || picked.assets.length === 0) {
        return;
      }

      const asset = picked.assets[0];
      if (asset.size && asset.size > MAX_PDF_BYTES) {
        Alert.alert(
          "File too large",
          "Statements must be 8 MB or smaller. Try splitting it or contact support."
        );
        return;
      }

      await uploadFromUri(asset.uri, asset.name);
    } catch (err: any) {
      Alert.alert(
        "Import failed",
        err?.message || "Failed to pick file. Please try again."
      );
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.primary },
      ]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Import Statement
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          <Ionicons name="document-text" size={48} color={colors.primary[500]} />
          <Text style={[styles.heroTitle, { color: colors.text.primary }]}>
            Upload a PDF statement
          </Text>
          <Text style={[styles.heroBody, { color: colors.text.secondary }]}>
            Pick any bank or credit-card statement PDF. We&apos;ll extract the
            transactions, auto-categorize them, and skip anything you&apos;ve
            already imported.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary[500] },
            importing && styles.buttonDisabled,
          ]}
          onPress={handlePickAndImport}
          disabled={importing}
        >
          {importing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Choose PDF</Text>
            </>
          )}
        </TouchableOpacity>

        {importing && (
          <Text
            style={[styles.statusText, { color: colors.text.tertiary }]}
          >
            Parsing your statement… this can take 20–60 seconds.
          </Text>
        )}

        {result && <ImportResultCard result={result} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const ImportResultCard: React.FC<{ result: StatementImportResponse }> = ({
  result,
}) => {
  const { colors } = useTheme();
  const { summary, statement, alreadyImported } = result;

  const title = alreadyImported
    ? "Statement already imported"
    : `${summary.imported} transaction${summary.imported === 1 ? "" : "s"} imported`;

  return (
    <View
      style={[
        styles.resultCard,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <View style={styles.resultHeader}>
        <Ionicons
          name={alreadyImported ? "information-circle" : "checkmark-circle"}
          size={28}
          color={alreadyImported ? colors.warning?.[500] ?? "#F59E0B" : colors.success?.[500] ?? "#10B981"}
        />
        <Text style={[styles.resultTitle, { color: colors.text.primary }]}>
          {title}
        </Text>
      </View>

      {(statement.issuer || statement.periodStart) && (
        <View style={styles.resultMeta}>
          {statement.issuer && (
            <Text style={[styles.resultMetaText, { color: colors.text.secondary }]}>
              {statement.issuer}
              {statement.accountIdentifier
                ? ` · ${statement.accountIdentifier}`
                : ""}
            </Text>
          )}
          {statement.periodStart && statement.periodEnd && (
            <Text style={[styles.resultMetaText, { color: colors.text.tertiary }]}>
              {statement.periodStart} → {statement.periodEnd}
            </Text>
          )}
        </View>
      )}

      <View style={styles.statRow}>
        <StatBox label="Found" value={summary.total} colors={colors} />
        <StatBox label="Imported" value={summary.imported} colors={colors} />
        <StatBox
          label="Duplicates"
          value={summary.duplicatesSkipped}
          colors={colors}
        />
        {summary.failed > 0 && (
          <StatBox label="Failed" value={summary.failed} colors={colors} />
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.viewButton,
          { borderColor: colors.primary[500] },
        ]}
        onPress={() => router.replace("/(tabs)/spending" as any)}
      >
        <Text style={[styles.viewButtonText, { color: colors.primary[500] }]}>
          View transactions
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const StatBox: React.FC<{ label: string; value: number; colors: any }> = ({
  label,
  value,
  colors,
}) => (
  <View style={styles.statBox}>
    <Text style={[styles.statValue, { color: colors.text.primary }]}>
      {value}
    </Text>
    <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  content: { padding: 16, paddingBottom: 48 },
  heroCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  heroBody: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  buttonDisabled: { opacity: 0.7 },
  statusText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  resultTitle: { fontSize: 17, fontWeight: "600", flexShrink: 1 },
  resultMeta: { marginBottom: 16 },
  resultMetaText: { fontSize: 14, marginBottom: 2 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 2 },
  viewButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  viewButtonText: { fontSize: 15, fontWeight: "600" },
});
