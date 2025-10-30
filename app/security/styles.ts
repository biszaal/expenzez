import { StyleSheet } from "react-native";
import { spacing, borderRadius, shadows, typography } from "../../constants/theme";

export const securityStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  card: {
    borderRadius: 8,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 12,
    marginLeft: 12,
    flex: 1,
    opacity: 0.7,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 8,
  },
  // PIN Verification Screen styles
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
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  verificationTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700",
  },
  verificationContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  verificationTextSection: {
    alignItems: "center",
    paddingTop: spacing["3xl"],
    paddingBottom: spacing.xl,
  },
  verificationMainText: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  verificationSubText: {
    fontSize: typography.fontSizes.base,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  verificationPinSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  statusContainer: {
    marginTop: spacing["2xl"],
    alignItems: "center",
    minHeight: 60,
    justifyContent: "center",
  },
  loadingSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: typography.fontSizes.base,
    textAlign: "center",
    fontWeight: "500",
  },
  verifyButton: {
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
    ...shadows.md,
  },
  verifyButtonText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600",
  },
  manualVerifyButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
    ...shadows.sm,
  },
  manualVerifyButtonText: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingCard: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["2xl"],
    borderRadius: borderRadius["2xl"],
    alignItems: "center",
    minWidth: 200,
    ...shadows.lg,
  },
  loadingText: {
    fontSize: typography.fontSizes.lg,
    marginTop: spacing.lg,
    textAlign: "center",
    fontWeight: "600",
  },
  loadingSubtext: {
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: 18,
  },
  // Legacy styles (keeping for compatibility)
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["2xl"],
  },
  // Device Management Styles
  loadingDevicesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  loadingDevicesText: {
    fontSize: typography.fontSizes.sm,
    marginLeft: spacing.sm,
  },
  emptyDevicesContainer: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
    paddingHorizontal: spacing.lg,
  },
  emptyDevicesText: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600",
    marginTop: spacing.md,
    textAlign: "center",
  },
  emptyDevicesSubtext: {
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.xs,
    textAlign: "center",
    lineHeight: 18,
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  deviceLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  deviceContent: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  deviceName: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600",
    flex: 1,
  },
  currentDeviceBadge: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "500",
  },
  trustedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginLeft: spacing.sm,
  },
  trustedBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  deviceType: {
    fontSize: typography.fontSizes.sm,
    marginBottom: spacing.xs,
  },
  deviceLastSeen: {
    fontSize: typography.fontSizes.xs,
    marginBottom: spacing.xs,
  },
  deviceLocation: {
    fontSize: typography.fontSizes.xs,
  },
  deviceActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  deviceActionButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  deviceSeparator: {
    height: 1,
    marginHorizontal: spacing.lg,
  },
});
