/**
 * Test Setup Configuration
 * Runs before all tests to set up the testing environment
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn((algorithm, data) =>
    Promise.resolve('mocked-hash-' + data.substring(0, 10))
  ),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() =>
    Promise.resolve({ success: true, error: undefined })
  ),
  SecurityLevel: {
    BIOMETRIC_STRONG: 'BIOMETRIC_STRONG',
  },
}));

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper');

// Mock device manager
jest.mock('../../services/deviceManager', () => ({
  deviceManager: {
    getDeviceId: jest.fn(() => Promise.resolve('test-device-123')),
    getDeviceInfo: jest.fn(() =>
      Promise.resolve({
        deviceId: 'test-device-123',
        platform: 'ios',
        osVersion: '15.0',
      })
    ),
  },
}));

// Mock API client
jest.mock('../../services/config/apiClient', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

// Global test timeout
jest.setTimeout(30000);

// Suppress console errors in tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

console.log('Test environment setup complete');
