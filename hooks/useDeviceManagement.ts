import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { deviceManager } from "../services/deviceManager";
import { deviceAPI, DeviceInfo } from "../services/api/deviceAPI";

export const useDeviceManagement = () => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  const loadCurrentDeviceId = useCallback(async () => {
    try {
      const deviceId = await deviceManager.getDeviceId();
      setCurrentDeviceId(deviceId);
      return deviceId;
    } catch (error) {
      console.error("Error getting current device ID:", error);
      return null;
    }
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      setLoadingDevices(true);
      const response = await deviceAPI.getDeviceList();
      if (response.success) {
        setDevices(response.devices);
        return response.devices;
      }
      return [];
    } catch (error) {
      console.error("Error loading devices:", error);
      return [];
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  const handleRevokeDevice = useCallback(
    async (deviceId: string, deviceName: string) => {
      return new Promise<boolean>((resolve) => {
        Alert.alert(
          "Revoke Device",
          `Are you sure you want to revoke access for "${deviceName}"? This device will need to log in again.`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: "Revoke",
              style: "destructive",
              onPress: async () => {
                try {
                  await deviceAPI.revokeDevice(deviceId);
                  Alert.alert(
                    "Device Revoked",
                    `"${deviceName}" has been revoked successfully.`
                  );
                  await loadDevices();
                  resolve(true);
                } catch (error) {
                  console.error("Error revoking device:", error);
                  Alert.alert("Error", "Failed to revoke device. Please try again.");
                  resolve(false);
                }
              },
            },
          ]
        );
      });
    },
    [loadDevices]
  );

  const handleTrustDevice = useCallback(
    async (deviceId: string, deviceName: string) => {
      try {
        await deviceAPI.trustDevice(deviceId);
        Alert.alert("Device Trusted", `"${deviceName}" is now a trusted device.`);
        await loadDevices();
        return true;
      } catch (error) {
        console.error("Error trusting device:", error);
        Alert.alert("Error", "Failed to trust device. Please try again.");
        return false;
      }
    },
    [loadDevices]
  );

  return {
    devices,
    loadingDevices,
    currentDeviceId,
    loadDevices,
    loadCurrentDeviceId,
    handleRevokeDevice,
    handleTrustDevice,
  };
};
