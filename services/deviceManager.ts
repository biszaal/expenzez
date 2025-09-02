import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  version: string;
  appVersion: string;
  registeredAt: number;
  lastUsed: number;
  isTrusted: boolean;
}

export interface PersistentSession {
  deviceId: string;
  userId: string;
  refreshToken: string;
  deviceFingerprint: string;
  createdAt: number;
  lastRefreshed: number;
  expiresAt: number; // Long-lived session (30 days)
  rememberMe: boolean;
}

class DeviceManager {
  private deviceId: string | null = null;
  private deviceFingerprint: string | null = null;

  /**
   * Generate a unique device ID and fingerprint
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    if (!this.deviceId) {
      // Try to get existing device ID
      this.deviceId = await AsyncStorage.getItem('device_id');
      
      if (!this.deviceId) {
        // Generate new device ID
        this.deviceId = await this.generateDeviceId();
        await AsyncStorage.setItem('device_id', this.deviceId);
      }
    }

    if (!this.deviceFingerprint) {
      this.deviceFingerprint = await this.generateDeviceFingerprint();
    }

    return {
      deviceId: this.deviceId,
      deviceName: await this.getDeviceName(),
      platform: Platform.OS,
      version: Platform.Version.toString(),
      appVersion: Application.nativeApplicationVersion || '1.0.0',
      registeredAt: Date.now(),
      lastUsed: Date.now(),
      isTrusted: await this.isDeviceTrusted(),
    };
  }

  /**
   * Generate unique device ID
   */
  private async generateDeviceId(): Promise<string> {
    // Use a combination of device-specific identifiers
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const platform = Platform.OS;
    
    // Try to get install ID from Expo
    let installationId = '';
    try {
      installationId = Constants.installationId || '';
    } catch (error) {
      // Silently handle installation ID error
    }

    return `${platform}_${installationId}_${timestamp}_${random}`;
  }

  /**
   * Generate device fingerprint for security
   */
  private async generateDeviceFingerprint(): Promise<string> {
    const components = [
      Platform.OS,
      Platform.Version.toString(),
      Constants.systemVersion || '',
      Constants.deviceName || '',
      Application.nativeApplicationVersion || '',
      Constants.installationId || '',
    ];

    // Create fingerprint hash
    const fingerprint = components.join('|');
    return Buffer.from(fingerprint).toString('base64');
  }

  /**
   * Get human-readable device name
   */
  private async getDeviceName(): Promise<string> {
    try {
      return Constants.deviceName || `${Platform.OS} Device`;
    } catch (error) {
      return `${Platform.OS} Device`;
    }
  }

  /**
   * Check if device is marked as trusted
   */
  async isDeviceTrusted(): Promise<boolean> {
    try {
      const trustedDevices = await AsyncStorage.getItem('trusted_devices');
      if (!trustedDevices) return false;

      const devices = JSON.parse(trustedDevices);
      const deviceId = await this.getDeviceId();
      
      return devices.includes(deviceId);
    } catch (error) {
      return false;
    }
  }

  /**
   * Mark device as trusted for persistent login
   */
  async trustDevice(rememberMe: boolean = true): Promise<void> {
    try {
      const deviceId = await this.getDeviceId();
      const trustedDevices = await AsyncStorage.getItem('trusted_devices');
      
      let devices = [];
      if (trustedDevices) {
        devices = JSON.parse(trustedDevices);
      }

      if (!devices.includes(deviceId)) {
        devices.push(deviceId);
        await AsyncStorage.setItem('trusted_devices', JSON.stringify(devices));
      }

      // Store remember me preference
      await AsyncStorage.setItem('remember_me', rememberMe.toString());
    } catch (error) {
      console.error('[DeviceManager] Error trusting device:', error);
    }
  }

  /**
   * Remove device from trusted list
   */
  async untrustDevice(): Promise<void> {
    try {
      const deviceId = await this.getDeviceId();
      const trustedDevices = await AsyncStorage.getItem('trusted_devices');
      
      if (trustedDevices) {
        const devices = JSON.parse(trustedDevices);
        const filteredDevices = devices.filter((id: string) => id !== deviceId);
        await AsyncStorage.setItem('trusted_devices', JSON.stringify(filteredDevices));
      }

      await AsyncStorage.removeItem('remember_me');
      await AsyncStorage.removeItem('persistent_session');
    } catch (error) {
      console.error('[DeviceManager] Error untrusting device:', error);
    }
  }

  /**
   * Get device ID (generate if needed)
   */
  async getDeviceId(): Promise<string> {
    if (!this.deviceId) {
      const deviceInfo = await this.getDeviceInfo();
      return deviceInfo.deviceId;
    }
    return this.deviceId;
  }

  /**
   * Create persistent session for trusted device
   */
  async createPersistentSession(userId: string, refreshToken: string, rememberMe: boolean = true): Promise<void> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      const now = Date.now();
      
      // Long-lived session: 30 days for trusted devices, 7 days for remember me
      const expirationTime = rememberMe ? (30 * 24 * 60 * 60 * 1000) : (7 * 24 * 60 * 60 * 1000);
      
      const session: PersistentSession = {
        deviceId: deviceInfo.deviceId,
        userId,
        refreshToken,
        deviceFingerprint: this.deviceFingerprint || await this.generateDeviceFingerprint(),
        createdAt: now,
        lastRefreshed: now,
        expiresAt: now + expirationTime,
        rememberMe,
      };

      await AsyncStorage.setItem('persistent_session', JSON.stringify(session));
      
      // Trust this device if remember me is enabled
      if (rememberMe) {
        await this.trustDevice(true);
      }

    } catch (error) {
      console.error('[DeviceManager] Error creating persistent session:', error);
    }
  }

  /**
   * Get persistent session if valid
   */
  async getPersistentSession(): Promise<PersistentSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem('persistent_session');
      if (!sessionData) return null;

      const session: PersistentSession = JSON.parse(sessionData);
      const now = Date.now();

      // Check if session has expired
      if (session.expiresAt < now) {
        await AsyncStorage.removeItem('persistent_session');
        return null;
      }

      // Verify device fingerprint for security
      const currentFingerprint = await this.generateDeviceFingerprint();
      if (session.deviceFingerprint !== currentFingerprint) {
        await AsyncStorage.removeItem('persistent_session');
        return null;
      }

      // Update last used time
      session.lastRefreshed = now;
      await AsyncStorage.setItem('persistent_session', JSON.stringify(session));

      return session;
    } catch (error) {
      console.error('[DeviceManager] Error getting persistent session:', error);
      return null;
    }
  }

  /**
   * Clear persistent session
   */
  async clearPersistentSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('persistent_session');
    } catch (error) {
      console.error('[DeviceManager] Error clearing persistent session:', error);
    }
  }

  /**
   * Check if remember me is enabled
   */
  async isRememberMeEnabled(): Promise<boolean> {
    try {
      const rememberMe = await AsyncStorage.getItem('remember_me');
      return rememberMe === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up expired sessions and old trusted devices
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      // Clean up persistent session if expired
      await this.getPersistentSession(); // This will remove expired sessions

      // Clean up old trusted devices (older than 90 days)
      const deviceRegistrations = await AsyncStorage.getItem('device_registrations');
      if (deviceRegistrations) {
        const registrations = JSON.parse(deviceRegistrations);
        const now = Date.now();
        const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days

        const activeRegistrations = Object.keys(registrations).reduce((acc, deviceId) => {
          if (now - registrations[deviceId].lastUsed < maxAge) {
            acc[deviceId] = registrations[deviceId];
          }
          return acc;
        }, {} as Record<string, any>);

        await AsyncStorage.setItem('device_registrations', JSON.stringify(activeRegistrations));
      }
    } catch (error) {
      console.error('[DeviceManager] Error during cleanup:', error);
    }
  }
}

export const deviceManager = new DeviceManager();