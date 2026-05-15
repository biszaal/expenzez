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
import { transactionAPI } from "../services/api";
import { ImportQuotaCard } from "../components/imports/ImportQuotaCard";
import type {
  ImportUsageResponse,
  ParsedStatementTransaction,
  StatementMetadata,
  StatementImportResponse,
} from "../services/api/transactionAPI";

const MAX_PDF_BYTES = 8 * 1024 * 1024;

type Stage = "idle" | "parsing" | "preview" | "importing" | "done";

export default function ImportStatementScreen() {
  const { colors } = useTheme();
  const { sharedUri, sharedName } = useLocalSearchParams<{
    sharedUri?: string;
    sharedName?: string;
  }>();

  const [stage, setStage] = useState<Stage>("idle");
  const [statement, setStatement] = useState<StatementMetadata | null>(null);
  const [transactions, setTransactions] = useState<ParsedStatementTransaction[]>(
    []
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<StatementImportResponse | null>(null);
  const [usage, setUsage] = useState<ImportUsageResponse | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const autoUploadedRef = useRef<string | null>(null);

  const refreshUsage = useCallback(async () => {
    try {
      const u = await transactionAPI.getImportUsage();
      setUsage(u);
    } catch (err) {
      console.warn("[ImportStatement] usage fetch failed", err);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  const parseFromUri = useCallback(
    async (uri: string, filename?: string) => {
      // Track the most recent step so we can surface a useful error message
      // when something fails — "An unexpected error occurred" was hiding the
      // real cause (typically iOS share-intent URI permissions).
      let step: "info" | "copy" | "read" | "upload" = "info";

      try {
        setStage("parsing");
        setResult(null);

        // iOS share-intent (e.g. "Share PDF" from PayPal) hands us a URI in
        // the source app's sandbox. FileSystem.readAsStringAsync can fail
        // because of security-scoped resource access. Copying to our own
        // cache directory first is the canonical workaround and is cheap.
        let workingUri = uri;
        const isShareUri =
          typeof uri === "string" &&
          (uri.includes("/tmp/") ||
            uri.includes("Inbox") ||
            uri.startsWith("ph://") ||
            uri.startsWith("content://"));

        if (isShareUri) {
          step = "copy";
          const cacheDir = (FileSystem as any).cacheDirectory as
            | string
            | undefined;
          if (cacheDir) {
            const safeName =
              (filename && filename.replace(/[^\w.\-]/g, "_")) ||
              `share-${Date.now()}.pdf`;
            const dest = `${cacheDir}${safeName}`;
            try {
              await FileSystem.copyAsync({ from: uri, to: dest });
              workingUri = dest;
            } catch (copyErr: any) {
              console.warn(
                "[ImportStatement] copyAsync failed, falling back to original URI",
                copyErr?.message
              );
            }
          }
        }

        step = "info";
        const info = await FileSystem.getInfoAsync(workingUri);
        if (
          info.exists &&
          (info as any).size &&
          (info as any).size > MAX_PDF_BYTES
        ) {
          Alert.alert(
            "File too large",
            "Statements must be 8 MB or smaller. Try splitting it or contact support."
          );
          setStage("idle");
          return;
        }

        step = "read";
        const fileBase64 = await FileSystem.readAsStringAsync(workingUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        step = "upload";
        const response = await transactionAPI.parseStatement(
          fileBase64,
          filename
        );

        if (!response.transactions || response.transactions.length === 0) {
          Alert.alert(
            "No transactions found",
            "We couldn't find any transactions in this PDF. Try a different statement."
          );
          setStage("idle");
          return;
        }

        setStatement(response.statement);
        setTransactions(response.transactions);
        setSelected(new Set(response.transactions.map((_, i) => i)));
        setStage("preview");
      } catch (err: any) {
        // Always log the underlying error so we can see what really failed
        // when a user hits this — "An unexpected error occurred" from the
        // generic API error mapper used to swallow the actual cause.
        console.error(
          `[ImportStatement] parseFromUri failed at step=${step}:`,
          err
        );

        const friendlyByStep: Record<typeof step, string> = {
          info: "Couldn't access the shared file. Try opening the PDF directly in Expenzez instead of sharing.",
          copy: "Couldn't copy the shared file into the app. Try opening the PDF directly in Expenzez instead.",
          read: "Couldn't read the shared file. Try opening the PDF directly in Expenzez instead of sharing.",
          upload: "Failed to parse the statement. Please try again in a moment.",
        };
        const backendMessage =
          err?.response?.data?.message || err?.response?.data?.error;
        const code = err?.response?.data?.code;
        // Refresh quota card on any backend error from the upload step —
        // IMPORT_LIMIT_REACHED in particular changes the visible state.
        if (step === "upload") refreshUsage();
        // Quota-exhausted gets a distinct title + matches the card CTA.
        if (code === "IMPORT_LIMIT_REACHED") {
          Alert.alert(
            "Monthly import limit reached",
            backendMessage ||
              "You've used all your imports this month. Upgrade for more."
          );
          setStage("idle");
          return;
        }
        const message =
          backendMessage ||
          friendlyByStep[step] ||
          err?.message ||
          "Failed to parse statement. Please try again.";

        Alert.alert("Parse failed", message);
        setStage("idle");
      }
    },
    []
  );

  // Auto-parse when arriving via share intent.
  useEffect(() => {
    if (!sharedUri || autoUploadedRef.current === sharedUri) return;
    autoUploadedRef.current = sharedUri;
    parseFromUri(sharedUri, sharedName);
  }, [sharedUri, sharedName, parseFromUri]);

  const handlePickAndParse = async () => {
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
      await parseFromUri(asset.uri, asset.name);
    } catch (err: any) {
      Alert.alert(
        "Import failed",
        err?.message || "Failed to pick file. Please try again."
      );
    }
  };

  const toggleRow = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectAll = () =>
    setSelected(new Set(transactions.map((_, i) => i)));
  const selectNone = () => setSelected(new Set());

  const handleConfirmImport = async () => {
    if (selected.size === 0) {
      Alert.alert(
        "No transactions selected",
        "Tick at least one transaction to import."
      );
      return;
    }
    try {
      setStage("importing");
      const toImport = transactions.filter((_, i) => selected.has(i));
      const response = await transactionAPI.importStatement(
        toImport,
        statement ?? undefined
      );
      setResult(response);
      setStage("done");
      // Pull the new used/remaining numbers so the quota card reflects the save.
      refreshUsage();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to import. Please try again.";
      Alert.alert("Import failed", message);
      setStage("preview");
      // Quota may have changed (e.g. 403 IMPORT_LIMIT_REACHED) — refresh
      // so the card is accurate even on failure paths.
      refreshUsage();
    }
  };

  const handleStartOver = () => {
    setStage("idle");
    setStatement(null);
    setTransactions([]);
    setSelected(new Set());
    setResult(null);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Import Statement
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {(stage === "idle" || stage === "parsing") && (
        <IdleView
          colors={colors}
          parsing={stage === "parsing"}
          onPick={handlePickAndParse}
          quotaCard={
            <ImportQuotaCard usage={usage} loading={usageLoading} />
          }
          quotaExhausted={!!usage && usage.remaining === 0}
        />
      )}

      {stage === "preview" && (
        <PreviewView
          colors={colors}
          statement={statement}
          transactions={transactions}
          selected={selected}
          onToggle={toggleRow}
          onSelectAll={selectAll}
          onSelectNone={selectNone}
          onConfirm={handleConfirmImport}
          onCancel={handleStartOver}
        />
      )}

      {stage === "importing" && (
        <View style={styles.centerView}>
          <ActivityIndicator color={colors.primary[500]} size="large" />
          <Text style={[styles.statusText, { color: colors.text.secondary }]}>
            Saving {selected.size} transaction
            {selected.size === 1 ? "" : "s"}…
          </Text>
        </View>
      )}

      {stage === "done" && result && (
        <ResultView
          colors={colors}
          result={result}
          onStartOver={handleStartOver}
        />
      )}
    </SafeAreaView>
  );
}

const IdleView: React.FC<{
  colors: any;
  parsing: boolean;
  onPick: () => void;
  quotaCard?: React.ReactNode;
  quotaExhausted?: boolean;
}> = ({ colors, parsing, onPick, quotaCard, quotaExhausted }) => (
  <ScrollView contentContainerStyle={styles.content}>
    {quotaCard}

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
        transactions, auto-categorize them, and let you review before
        importing.
      </Text>
    </View>

    <TouchableOpacity
      style={[
        styles.primaryButton,
        { backgroundColor: colors.primary[500] },
        (parsing || quotaExhausted) && styles.buttonDisabled,
      ]}
      onPress={onPick}
      disabled={parsing || quotaExhausted}
    >
      {parsing ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Ionicons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>
            {quotaExhausted ? "Quota reached" : "Choose PDF"}
          </Text>
        </>
      )}
    </TouchableOpacity>

    {parsing && (
      <Text style={[styles.statusText, { color: colors.text.tertiary }]}>
        Parsing your statement… this can take 10–20 seconds.
      </Text>
    )}
  </ScrollView>
);

const PreviewView: React.FC<{
  colors: any;
  statement: StatementMetadata | null;
  transactions: ParsedStatementTransaction[];
  selected: Set<number>;
  onToggle: (i: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  colors,
  statement,
  transactions,
  selected,
  onToggle,
  onSelectAll,
  onSelectNone,
  onConfirm,
  onCancel,
}) => {
  const formatAmount = (t: ParsedStatementTransaction) => {
    const sign = t.type === "credit" ? "+" : "−";
    return `${sign}£${Math.abs(t.amount).toFixed(2)}`;
  };
  const allSelected = selected.size === transactions.length;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.previewContent}>
        {statement && (statement.issuer || statement.periodStart) && (
          <View
            style={[
              styles.metaCard,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            {statement.issuer && (
              <Text style={[styles.metaTitle, { color: colors.text.primary }]}>
                {statement.issuer}
                {statement.accountIdentifier
                  ? ` · ${statement.accountIdentifier}`
                  : ""}
              </Text>
            )}
            {statement.periodStart && statement.periodEnd && (
              <Text
                style={[styles.metaSubtitle, { color: colors.text.tertiary }]}
              >
                {statement.periodStart} → {statement.periodEnd}
              </Text>
            )}
          </View>
        )}

        <View style={styles.selectionRow}>
          <Text style={[styles.selectionText, { color: colors.text.secondary }]}>
            {selected.size} of {transactions.length} selected
          </Text>
          <TouchableOpacity onPress={allSelected ? onSelectNone : onSelectAll}>
            <Text style={[styles.selectionLink, { color: colors.primary[500] }]}>
              {allSelected ? "Deselect all" : "Select all"}
            </Text>
          </TouchableOpacity>
        </View>

        {transactions.map((t, i) => {
          const isSelected = selected.has(i);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onToggle(i)}
              activeOpacity={0.7}
              style={[
                styles.txnRow,
                {
                  backgroundColor: colors.background.secondary,
                  opacity: isSelected ? 1 : 0.5,
                },
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isSelected
                      ? colors.primary[500]
                      : colors.border,
                    backgroundColor: isSelected
                      ? colors.primary[500]
                      : "transparent",
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <View style={styles.txnBody}>
                <Text
                  style={[styles.txnMerchant, { color: colors.text.primary }]}
                  numberOfLines={1}
                >
                  {t.merchant}
                </Text>
                <Text
                  style={[styles.txnMeta, { color: colors.text.tertiary }]}
                  numberOfLines={1}
                >
                  {t.date}
                  {t.category ? ` · ${t.category}` : ""}
                </Text>
              </View>
              <Text
                style={[
                  styles.txnAmount,
                  {
                    color:
                      t.type === "credit"
                        ? colors.success?.[500] ?? "#10B981"
                        : colors.text.primary,
                  },
                ]}
              >
                {formatAmount(t)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background.primary,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onCancel}
          style={[styles.secondaryButton, { borderColor: colors.border }]}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              { color: colors.text.secondary },
            ]}
          >
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onConfirm}
          style={[
            styles.primaryButton,
            styles.footerPrimary,
            { backgroundColor: colors.primary[500] },
            selected.size === 0 && styles.buttonDisabled,
          ]}
          disabled={selected.size === 0}
        >
          <Text style={styles.primaryButtonText}>
            Import {selected.size} transaction
            {selected.size === 1 ? "" : "s"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ResultView: React.FC<{
  colors: any;
  result: StatementImportResponse;
  onStartOver: () => void;
}> = ({ colors, result, onStartOver }) => {
  const { summary, statement, alreadyImported } = result;
  const title = alreadyImported
    ? "Statement already imported"
    : `${summary.imported} transaction${summary.imported === 1 ? "" : "s"} imported`;

  return (
    <ScrollView contentContainerStyle={styles.content}>
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
            color={
              alreadyImported
                ? colors.warning?.[500] ?? "#F59E0B"
                : colors.success?.[500] ?? "#10B981"
            }
          />
          <Text style={[styles.resultTitle, { color: colors.text.primary }]}>
            {title}
          </Text>
        </View>

        {(statement.issuer || statement.periodStart) && (
          <View style={styles.resultMeta}>
            {statement.issuer && (
              <Text
                style={[
                  styles.resultMetaText,
                  { color: colors.text.secondary },
                ]}
              >
                {statement.issuer}
                {statement.accountIdentifier
                  ? ` · ${statement.accountIdentifier}`
                  : ""}
              </Text>
            )}
            {statement.periodStart && statement.periodEnd && (
              <Text
                style={[
                  styles.resultMetaText,
                  { color: colors.text.tertiary },
                ]}
              >
                {statement.periodStart} → {statement.periodEnd}
              </Text>
            )}
          </View>
        )}

        <View style={styles.statRow}>
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
          style={[styles.primaryButton, { backgroundColor: colors.primary[500] }]}
          onPress={() => router.replace("/(tabs)/spending" as any)}
        >
          <Text style={styles.primaryButtonText}>View transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border, marginTop: 8 }]}
          onPress={onStartOver}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text.secondary }]}>
            Import another
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  centerView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
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
  buttonDisabled: { opacity: 0.5 },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: "600" },
  statusText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
  },
  // Preview
  previewContent: { padding: 16, paddingBottom: 16 },
  metaCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  metaTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  metaSubtitle: { fontSize: 13 },
  selectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 8,
  },
  selectionText: { fontSize: 14 },
  selectionLink: { fontSize: 14, fontWeight: "600" },
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  txnBody: { flex: 1 },
  txnMerchant: { fontSize: 15, fontWeight: "500", marginBottom: 2 },
  txnMeta: { fontSize: 12 },
  txnAmount: { fontSize: 15, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  footerPrimary: { flex: 1 },
  // Result
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
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
});
