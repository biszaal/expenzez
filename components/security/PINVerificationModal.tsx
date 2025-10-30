import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import PinInput from "../PinInput";
import { spacing, borderRadius, shadows } from "../../constants/theme";

interface PINVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onPinChange: (pin: string) => void;
  pin: string;
  isLoading: boolean;
  title?: string;
  subtitle?: string;
  mainText?: string;
  subText?: string;
  showBiometric?: boolean;
}

export const PINVerificationModal: React.FC<PINVerificationModalProps> = ({
  visible,
  onClose,
  onPinChange,
  pin,
  isLoading,
  title = "Verify Your PIN",
  subtitle,
  mainText = "Disable App Security",
  subText = "Enter your 5-digit PIN to remove app lock protection",
  showBiometric = false,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.verificationContainer,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.verificationHeader}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.background.secondary },
              ]}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text
              style={[
                styles.verificationTitle,
                { color: colors.text.primary },
              ]}
            >
              {title}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Content */}
          <View style={styles.verificationContent}>
            {/* Title Section */}
            <View style={styles.verificationTextSection}>
              <Text
                style={[
                  styles.verificationMainText,
                  { color: colors.text.primary },
                ]}
              >
                {mainText}
              </Text>
              <Text
                style={[
                  styles.verificationSubText,
                  { color: colors.text.secondary },
                ]}
              >
                {subText}
              </Text>
            </View>

            {/* PIN Input Section */}
            <View style={styles.verificationPinSection}>
              <PinInput
                pin={pin}
                onPinChange={onPinChange}
                isLoading={isLoading}
                maxLength={5}
                showBiometric={showBiometric}
              />

              {/* Fixed Height Status Container */}
              <View style={styles.statusContainer}>
                {isLoading ? (
                  <View style={styles.loadingSection}>
                    <ActivityIndicator
                      size="small"
                      color={colors.primary.main}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: colors.primary.main,
                          marginLeft: spacing.sm,
                        },
                      ]}
                    >
                      Verifying PIN...
                    </Text>
                  </View>
                ) : (
                  <View style={{ height: 40 }} />
                )}
              </View>

              {/* Spacer to maintain layout */}
              <View style={{ height: 60 }} />
            </View>
          </View>

          {/* Loading Overlay */}
          {isLoading && (
            <View
              style={[
                styles.loadingOverlay,
                { backgroundColor: colors.background.primary + "90" },
              ]}
            >
              <View
                style={[
                  styles.loadingCard,
                  { backgroundColor: colors.background.primary },
                ]}
              >
                <ActivityIndicator size="large" color={colors.primary.main} />
                <Text
                  style={[
                    styles.loadingText,
                    { color: colors.text.primary },
                  ]}
                >
                  Verifying...
                </Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  verificationContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  verificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  verificationContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["2xl"],
  },
  verificationTextSection: {
    alignItems: "center",
    marginBottom: spacing["3xl"],
  },
  verificationMainText: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  verificationSubText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  verificationPinSection: {
    alignItems: "center",
  },
  statusContainer: {
    height: 40,
    marginTop: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    padding: spacing["2xl"],
    borderRadius: borderRadius.xl,
    alignItems: "center",
    ...shadows.lg,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: spacing.md,
  },
});
