import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { DeviceInfo } from "../../services/api/deviceAPI";
import {
  formatDeviceType,
  formatLastSeen,
  getDeviceIcon,
} from "../../utils/deviceFormatters";
import { spacing, borderRadius, shadows } from "../../constants/theme";

interface DeviceListItemProps {
  device: DeviceInfo;
  isCurrentDevice: boolean;
  onTrust?: (deviceId: string, deviceName: string) => void;
  onRevoke?: (deviceId: string, deviceName: string) => void;
}

export const DeviceListItem: React.FC<DeviceListItemProps> = ({
  device,
  isCurrentDevice,
  onTrust,
  onRevoke,
}) => {
  const { colors } = useTheme();

  // Determine trust level color
  const getTrustColor = () => {
    if (isCurrentDevice) return colors.success;
    if (device.isTrusted) return colors.primary.main;
    return colors.gray;
  };

  const trustColors = getTrustColor();

  return (
    <View style={styles.deviceItem}>
      <View style={styles.deviceLeft}>
        <View
          style={[
            styles.deviceIcon,
            {
              backgroundColor: trustColors[100],
              borderWidth: 2,
              borderColor: trustColors[200],
            },
          ]}
        >
          <Ionicons
            name={getDeviceIcon(device) as any}
            size={22}
            color={trustColors[600]}
          />
        </View>
        <View style={styles.deviceContent}>
          <View style={styles.deviceHeader}>
            <Text
              style={[styles.deviceName, { color: colors.text.primary }]}
            >
              {device.deviceName}
              {isCurrentDevice && (
                <Text
                  style={[
                    styles.currentDeviceBadge,
                    { color: colors.success[600] },
                  ]}
                >
                  {" "}
                  • This device
                </Text>
              )}
            </Text>
            {device.isTrusted && (
              <View
                style={[
                  styles.trustedBadge,
                  { backgroundColor: colors.success[100] },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={12}
                  color={colors.success[600]}
                />
                <Text
                  style={[
                    styles.trustedBadgeText,
                    { color: colors.success[600] },
                  ]}
                >
                  Trusted
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.deviceType, { color: colors.text.secondary }]}
          >
            {formatDeviceType(device)}
          </Text>
          <Text
            style={[styles.deviceLastSeen, { color: colors.gray[400] }]}
          >
            Last seen: {formatLastSeen(device.lastSeen)}
          </Text>
          {device.location && (
            <Text
              style={[styles.deviceLocation, { color: colors.gray[400] }]}
            >
              📍 {device.location}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.deviceActions}>
        {!device.isTrusted && onTrust && (
          <TouchableOpacity
            style={[
              styles.deviceActionButton,
              { backgroundColor: colors.success[100] },
            ]}
            onPress={() => onTrust(device.deviceId, device.deviceName)}
          >
            <Ionicons
              name="shield-checkmark"
              size={16}
              color={colors.success[600]}
            />
          </TouchableOpacity>
        )}
        {!isCurrentDevice && onRevoke && (
          <TouchableOpacity
            style={[
              styles.deviceActionButton,
              { backgroundColor: colors.error[100] },
            ]}
            onPress={() => onRevoke(device.deviceId, device.deviceName)}
          >
            <Ionicons name="trash" size={16} color={colors.error[600]} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  currentDeviceBadge: {
    fontSize: 14,
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
    fontSize: 11,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  deviceType: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  deviceLastSeen: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  deviceLocation: {
    fontSize: 12,
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
});
