import { api } from '../config/apiClient';

export interface DeviceRegistrationRequest {
  deviceId: string;
  deviceFingerprint: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  rememberMe: boolean;
}

export interface RegisteredDevice {
  deviceId: string;
  deviceName: string;
  platform: string;
  registeredAt: number;
  expiresAt: number;
  rememberMe: boolean;
}

export interface DeviceRegistrationResponse {
  success: boolean;
  message: string;
  device: RegisteredDevice;
}

export interface DeviceListResponse {
  success: boolean;
  devices: Array<{
    deviceId: string;
    deviceName: string;
    platform: string;
    appVersion: string;
    registeredAt: number;
    lastUsed: number;
    expiresAt: number;
    rememberMe: boolean;
    isCurrentDevice: boolean;
    daysUntilExpiry: number;
  }>;
  totalDevices: number;
}

export const deviceAPI = {
  /**
   * Register device with backend for trusted device management
   */
  async registerDevice(deviceInfo: DeviceRegistrationRequest): Promise<DeviceRegistrationResponse> {
    try {
      console.log('🔐 [DeviceAPI] Registering device:', {
        deviceId: deviceInfo.deviceId,
        platform: deviceInfo.platform,
        rememberMe: deviceInfo.rememberMe
      });

      const response = await api.post('/devices/register', deviceInfo);

      console.log('🔐 [DeviceAPI] Device registration response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('🔐 [DeviceAPI] Device registration failed:', error);

      // Don't throw - device registration failure shouldn't block login
      return {
        success: false,
        message: error.response?.data?.error || 'Device registration failed',
        device: {} as RegisteredDevice
      };
    }
  },

  /**
   * Get list of registered devices for the user
   */
  async getDeviceList(currentDeviceId?: string): Promise<DeviceListResponse> {
    try {
      const params = currentDeviceId ? { currentDeviceId } : {};
      const response = await api.get('/devices/list', { params });
      return response.data;
    } catch (error: any) {
      console.error('🔐 [DeviceAPI] Get device list failed:', error);
      throw error;
    }
  },

  /**
   * Revoke a specific device
   */
  async revokeDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete('/devices/revoke', {
        data: { deviceId }
      });
      return response.data;
    } catch (error: any) {
      console.error('🔐 [DeviceAPI] Revoke device failed:', error);
      throw error;
    }
  },

  /**
   * Update device last used timestamp
   */
  async updateLastUsed(deviceId: string): Promise<{ success: boolean; message: string; lastUsed: number }> {
    try {
      const response = await api.put('/devices/update-last-used', { deviceId });
      return response.data;
    } catch (error: any) {
      console.error('🔐 [DeviceAPI] Update last used failed:', error);

      // Don't throw - this is not critical
      return {
        success: false,
        message: 'Failed to update last used timestamp',
        lastUsed: Date.now()
      };
    }
  }
};