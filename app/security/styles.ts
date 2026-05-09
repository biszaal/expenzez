import { StyleSheet } from "react-native";
import { spacing, borderRadius, shadows, typography, fontFamily } from "../../constants/theme";

// v1.5 redesign — hairline section cards, uppercase eyebrow labels,
// 14 px row title with mono-friendly meta, rose-token reset button.
export const securityStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fontFamily.semibold,
    letterSpacing: -0.2,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginHorizontal: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: fontFamily.semibold,
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  settingSubtitle: {
    fontSize: 11.5,
    fontFamily: fontFamily.medium,
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
    fontFamily: fontFamily.medium,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  resetButtonText: {
    fontSize: 13.5,
    fontFamily: fontFamily.semibold,
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
