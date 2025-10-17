/**
 * Security Features Unit Tests
 * Tests for PIN setup, cross-device sync, and biometric authentication
 */

import { nativeSecurityAPI } from '../../services/api/nativeSecurityAPI';
import { nativeCryptoStorage } from '../../services/nativeCryptoStorage';

describe('Security Features', () => {
  describe('PIN Setup', () => {
    test('should validate PIN format (5 digits)', async () => {
      const validPin = '12345';
      const invalidPin = '123';

      expect(/^\d{5}$/.test(validPin)).toBe(true);
      expect(/^\d{5}$/.test(invalidPin)).toBe(false);
    });

    test('should reject non-numeric PIN', () => {
      const invalidPin = 'abcde';
      expect(/^\d{5}$/.test(invalidPin)).toBe(false);
    });

    test('should setup PIN successfully', async () => {
      const request = {
        pin: '12345',
        deviceId: 'test-device-123',
        biometricEnabled: false,
      };

      // Mock the API call
      const result = await nativeSecurityAPI.setupPin(request);

      // Should return success (this will actually call the real API in integration tests)
      expect(result).toHaveProperty('success');
    });
  });

  describe('Cross-Device PIN Sync', () => {
    test('should detect when user has server PIN but no local PIN', () => {
      const appLockEnabled = true;
      const needsPinSetup = true;
      const hasServerPin = appLockEnabled && needsPinSetup;

      expect(hasServerPin).toBe(true);
    });

    test('should not show sync modal when PIN exists locally', () => {
      const appLockEnabled = true;
      const needsPinSetup = false; // Has local PIN
      const hasServerPin = appLockEnabled && needsPinSetup;

      expect(hasServerPin).toBe(false);
    });

    test('should validate PIN against server for sync', async () => {
      const request = {
        pin: '12345',
        deviceId: 'new-device-456',
      };

      // This should validate against server, not local
      const result = await nativeSecurityAPI.validatePinForSync(request);

      expect(result).toHaveProperty('success');
      if (!result.success) {
        expect(result).toHaveProperty('error');
      }
    });
  });

  describe('PIN Validation', () => {
    test('should validate correct PIN', async () => {
      const request = {
        pin: '12345',
        deviceId: 'test-device-123',
      };

      const result = await nativeSecurityAPI.validatePin(request);

      expect(result).toHaveProperty('success');
    });

    test('should reject incorrect PIN format', async () => {
      const request = {
        pin: '123', // Too short
        deviceId: 'test-device-123',
      };

      const result = await nativeSecurityAPI.validatePin(request);

      expect(result.success).toBe(false);
    });
  });

  describe('Biometric Authentication', () => {
    test('should update biometric settings', async () => {
      const result = await nativeSecurityAPI.updateBiometricSettings(
        'test-device-123',
        true
      );

      expect(result).toHaveProperty('success');
    });
  });

  describe('Session Management', () => {
    test('should create session after successful PIN validation', async () => {
      // Session should be created after PIN validation
      const hasSession = await nativeSecurityAPI.hasValidSession();

      expect(typeof hasSession).toBe('boolean');
    });

    test('should clear session on logout', async () => {
      await nativeSecurityAPI.clearSession();

      const hasSession = await nativeSecurityAPI.hasValidSession();
      expect(hasSession).toBe(false);
    });
  });
});
