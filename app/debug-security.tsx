import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSecurity } from "../contexts/SecurityContext";
import { deviceManager } from "../services/deviceManager";
import { nativeSecurityAPI } from "../services/api/nativeSecurityAPI";

export default function DebugSecurityScreen() {
  const router = useRouter();
  const security = useSecurity();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      const info: any = {};

      // AsyncStorage values
      const keys = [
        '@expenzez_app_password',
        '@expenzez_security_enabled',
        '@expenzez_app_locked',
        '@expenzez_app_lock_preference',
        '@expenzez_last_unlock',
        'isLoggedIn'
      ];

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        info[key] = value;
      }

      // Security Context values
      info.contextIsLocked = security.isLocked;
      info.contextIsSecurityEnabled = security.isSecurityEnabled;
      info.contextNeedsPinSetup = security.needsPinSetup;
      info.contextIsInitialized = security.isInitialized;
      info.contextSecurityPreferences = JSON.stringify(security.securityPreferences, null, 2);

      // Device ID
      info.deviceId = await deviceManager.getDeviceId();

      // Check database PIN
      try {
        const settings = await nativeSecurityAPI.getSecuritySettings(info.deviceId);
        info.dbHasPin = settings && !!settings.encryptedPin;
        info.dbPinLength = settings?.encryptedPin?.length || 0;
      } catch (e) {
        info.dbError = e.message;
      }

      // Session check
      const lastUnlock = info['@expenzez_last_unlock'];
      if (lastUnlock) {
        const now = Date.now();
        const sessionAge = now - parseInt(lastUnlock);
        info.sessionAgeMinutes = (sessionAge / 1000 / 60).toFixed(2);
        info.sessionValid = sessionAge < (2 * 60 * 1000); // 2 min timeout
      }

      setDebugInfo(info);
    } catch (error) {
      console.error("Debug error:", error);
      setDebugInfo({ error: error.message });
    }
  };

  const clearAll = async () => {
    try {
      await AsyncStorage.multiRemove([
        '@expenzez_app_password',
        '@expenzez_security_enabled',
        '@expenzez_app_locked',
        '@expenzez_app_lock_preference',
        '@expenzez_last_unlock',
      ]);
      await security.disableSecurity();
      await loadDebugInfo();
      alert("Security cleared!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Security Debug</Text>
      </View>

      <ScrollView style={styles.content}>
        {Object.entries(debugInfo).map(([key, value]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.key}>{key}:</Text>
            <Text style={styles.value}>{String(value)}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttons}>
        <TouchableOpacity onPress={loadDebugInfo} style={styles.button}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearAll} style={[styles.button, styles.dangerButton]}>
          <Text style={styles.buttonText}>Clear Security</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: "#007AFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  row: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  key: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: "#000",
    fontFamily: "monospace",
  },
  buttons: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  dangerButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
