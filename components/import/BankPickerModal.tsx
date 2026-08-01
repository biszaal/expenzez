import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { fontFamily } from "../../constants/theme";
import { getSupportedBanks } from "../../services/ukBankFormats";
import { BankAvatar } from "../accounts/BankAvatar";

interface BankPickerModalProps {
  visible: boolean;
  /** Currently chosen bank name, if any. */
  value?: string | null;
  onSelect: (bankName: string) => void;
  onClose: () => void;
}

/**
 * "Which bank is this statement from?"
 *
 * Shown when the parser couldn't identify the issuer, and reachable via
 * "Change" when it could. Naming the bank is what lets us keep a statement's
 * transactions together as an account instead of dumping every upload into one
 * anonymous bucket — so when detection fails, we ask rather than guess.
 */
export const BankPickerModal: React.FC<BankPickerModalProps> = ({
  visible,
  value,
  onSelect,
  onClose,
}) => {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");

  const banks = useMemo(() => {
    const all = getSupportedBanks().filter((b) => b.id !== "generic");
    const q = search.trim().toLowerCase();
    return q ? all.filter((b) => b.name.toLowerCase().includes(q)) : all;
  }, [search]);

  const choose = (name: string) => {
    setSearch("");
    setCustomName("");
    onSelect(name);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.container, { backgroundColor: colors.background.primary }]}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: colors.text.primary, fontFamily: fontFamily.semibold },
            ]}
          >
            Which bank?
          </Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={colors.text.secondary} />
          </Pressable>
        </View>

        <View
          style={[
            styles.searchRow,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.medium,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.text.tertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search banks"
            placeholderTextColor={colors.text.tertiary}
            style={[
              styles.searchInput,
              { color: colors.text.primary, fontFamily: fontFamily.medium },
            ]}
            autoCorrect={false}
          />
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {banks.map((bank) => {
            const isSelected = value === bank.name;
            return (
              <Pressable
                key={bank.id}
                onPress={() => choose(bank.name)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderColor: isSelected
                      ? colors.primary[500]
                      : colors.border.medium,
                    backgroundColor: colors.card.background,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                accessibilityRole="button"
              >
                <BankAvatar bankId={bank.id} bankName={bank.name} size={34} />
                <Text
                  style={[
                    styles.rowLabel,
                    {
                      color: colors.text.primary,
                      fontFamily: fontFamily.medium,
                    },
                  ]}
                >
                  {bank.name}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary[500]}
                  />
                )}
              </Pressable>
            );
          })}

          {/* Free text for anything not in the list — a small bank, a foreign
              account, a card issuer we don't know yet. Better a real name the
              user recognises than filing it under "Other bank". */}
          <View style={styles.customBlock}>
            <Text
              style={[
                styles.customLabel,
                {
                  color: colors.text.secondary,
                  fontFamily: fontFamily.medium,
                },
              ]}
            >
              Not listed? Type its name.
            </Text>
            <View style={styles.customRow}>
              <TextInput
                value={customName}
                onChangeText={setCustomName}
                placeholder="e.g. Kroo Bank"
                placeholderTextColor={colors.text.tertiary}
                style={[
                  styles.customInput,
                  {
                    color: colors.text.primary,
                    borderColor: colors.border.medium,
                    backgroundColor: colors.background.secondary,
                    fontFamily: fontFamily.medium,
                  },
                ]}
                maxLength={60}
                returnKeyType="done"
                onSubmitEditing={() =>
                  customName.trim() && choose(customName.trim())
                }
              />
              <Pressable
                onPress={() => customName.trim() && choose(customName.trim())}
                disabled={!customName.trim()}
                style={({ pressed }) => [
                  styles.customButton,
                  {
                    backgroundColor: colors.primary[500],
                    opacity: !customName.trim() ? 0.4 : pressed ? 0.85 : 1,
                  },
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.customButtonLabel,
                    { fontFamily: fontFamily.semibold },
                  ]}
                >
                  Use
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => choose("Other bank")}
              style={styles.otherLink}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.otherLabel,
                  {
                    color: colors.text.tertiary,
                    fontFamily: fontFamily.medium,
                  },
                ]}
              >
                Skip — file as &ldquo;Other bank&rdquo;
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 22, letterSpacing: -0.4 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  list: { gap: 8, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  rowLabel: { flex: 1, fontSize: 15 },
  customBlock: { marginTop: 20, gap: 10 },
  customLabel: { fontSize: 13 },
  customRow: { flexDirection: "row", gap: 8 },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  customButton: {
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  customButtonLabel: { color: "#FFFFFF", fontSize: 14 },
  otherLink: { paddingVertical: 8, alignItems: "center" },
  otherLabel: { fontSize: 13 },
});
