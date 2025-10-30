import { DeviceInfo } from "../services/api/deviceAPI";

/**
 * Device Formatters
 * Pure utility functions for formatting device information
 */

/**
 * Format device type information into a readable string
 * @param device - Device information object
 * @returns Formatted string (e.g., "iOS • mobile • Safari")
 */
export const formatDeviceType = (device: DeviceInfo): string => {
  const parts: string[] = [];
  if (device.platform) parts.push(device.platform);
  if (device.deviceType) parts.push(device.deviceType);
  if (device.browser) parts.push(device.browser);
  return parts.join(" • ");
};

/**
 * Format last seen date into human-readable relative time
 * @param lastSeen - ISO date string
 * @returns Formatted string (e.g., "Today", "2 days ago")
 */
export const formatLastSeen = (lastSeen: string): string => {
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

/**
 * Get appropriate Ionicon name for device type and platform
 * @param device - Device information object
 * @returns Ionicon name string
 */
export const getDeviceIcon = (device: DeviceInfo): string => {
  // iOS devices
  if (device.platform === "ios") {
    if (device.deviceType === "tablet") return "tablet-portrait";
    if (device.deviceType === "desktop") return "desktop";
    return "phone-portrait";
  }

  // Android devices
  if (device.platform === "android") {
    if (device.deviceType === "tablet") return "tablet-landscape";
    return "phone-portrait-outline";
  }

  // Other devices (web, desktop apps, etc.)
  if (device.deviceType === "desktop") return "desktop-outline";
  if (device.deviceType === "tablet") return "tablet-landscape-outline";
  return "hardware-chip-outline";
};
