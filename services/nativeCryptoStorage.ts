/**
 * Native Crypto PIN Storage - Using expo-crypto instead of CryptoJS
 * This eliminates memory issues and crashes that CryptoJS causes on iOS
 */
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const SECURE_KEYS = {
  PIN_HASH: 'secure_pin_hash',
  PIN_SALT: 'secure_pin_salt',
  DEVICE_KEY: 'secure_device_key',
  SESSION_TOKEN: 'secure_session_token',
  SESSION_EXPIRY: 'secure_session_expiry',
} as const;

export class NativeCryptoStorage {
  private deviceKey: string | null = null;
  private initialized = false;

  /**
   * Initialize the native crypto storage system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔒 [NativeCrypto] Initializing native crypto storage...');
      
      // Generate or retrieve device key
      this.deviceKey = await SecureStore.getItemAsync(SECURE_KEYS.DEVICE_KEY);
      
      if (!this.deviceKey) {
        console.log('🔒 [NativeCrypto] Generating new device key...');
        // Generate a random device key using native crypto
        const randomBytes = await Crypto.getRandomBytesAsync(32);
        this.deviceKey = Array.from(randomBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        await SecureStore.setItemAsync(SECURE_KEYS.DEVICE_KEY, this.deviceKey);
        console.log('🔒 [NativeCrypto] ✅ Device key generated and stored');
      } else {
        console.log('🔒 [NativeCrypto] ✅ Device key retrieved');
      }

      this.initialized = true;
      console.log('🔒 [NativeCrypto] ✅ Native crypto storage initialized');
    } catch (error) {
      console.error('🔒 [NativeCrypto] ❌ Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Generate secure salt using native crypto
   */
  private async generateSecureSalt(): Promise<string> {
    const saltBytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(saltBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Hash PIN using native SHA-256 with salt (much faster than PBKDF2)
   */
  async hashPin(pin: string): Promise<{ hash: string; salt: string }> {
    try {
      if (!this.deviceKey) {
        await this.initialize();
      }

      console.log('🔒 [NativeCrypto] Starting native PIN hashing...');
      
      // Generate secure salt
      const salt = await this.generateSecureSalt();
      console.log('🔒 [NativeCrypto] Salt generated');
      
      // Combine PIN + salt + device key for security
      const saltedPin = `${pin}_${salt}_${this.deviceKey}`;
      
      // Use native SHA-256 (much faster and memory-efficient than PBKDF2)
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        saltedPin,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      console.log('🔒 [NativeCrypto] ✅ Native PIN hashing complete');
      return { hash, salt };
    } catch (error) {
      console.error('🔒 [NativeCrypto] ❌ Failed to hash PIN:', error);
      throw new Error('Failed to hash PIN with native crypto');
    }
  }

  /**
   * Verify PIN against stored hash using native crypto
   */
  async verifyPin(pin: string): Promise<boolean> {
    try {
      if (!this.deviceKey) {
        await this.initialize();
      }

      // Get stored hash and salt
      const storedHash = await SecureStore.getItemAsync(SECURE_KEYS.PIN_HASH);
      const storedSalt = await SecureStore.getItemAsync(SECURE_KEYS.PIN_SALT);
      
      if (!storedHash || !storedSalt) {
        console.log('🔒 [NativeCrypto] ❌ No PIN hash found');
        return false;
      }

      // Recreate the hash with the same parameters
      const saltedPin = `${pin}_${storedSalt}_${this.deviceKey}`;
      
      const computedHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        saltedPin,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      // Constant-time comparison
      const isValid = this.constantTimeCompare(computedHash, storedHash);
      
      console.log('🔒 [NativeCrypto] PIN verification:', isValid ? '✅ Valid' : '❌ Invalid');
      return isValid;
    } catch (error) {
      console.error('🔒 [NativeCrypto] ❌ Failed to verify PIN:', error);
      return false;
    }
  }

  /**
   * Store PIN hash securely
   */
  async storePinHash(pin: string): Promise<void> {
    try {
      console.log('🔒 [NativeCrypto] Starting PIN hash storage...');
      
      const { hash, salt } = await this.hashPin(pin);
      
      console.log('🔒 [NativeCrypto] Storing hash in secure store...');
      await SecureStore.setItemAsync(SECURE_KEYS.PIN_HASH, hash);
      await SecureStore.setItemAsync(SECURE_KEYS.PIN_SALT, salt);
      
      console.log('🔒 [NativeCrypto] ✅ PIN hash stored securely');
    } catch (error) {
      console.error('🔒 [NativeCrypto] ❌ Failed to store PIN hash:', error);
      throw error;
    }
  }

  /**
   * Check if PIN hash exists
   */
  async hasPinHash(): Promise<boolean> {
    try {
      const hash = await SecureStore.getItemAsync(SECURE_KEYS.PIN_HASH);
      const salt = await SecureStore.getItemAsync(SECURE_KEYS.PIN_SALT);
      return !!(hash && salt);
    } catch (error) {
      console.error('🔒 [NativeCrypto] ❌ Failed to check PIN hash:', error);
      return false;
    }
  }

  /**
   * Create a secure session
   */
  async createSession(deviceId: string): Promise<void> {
    try {
      const sessionToken = await this.generateSecureSalt(); // Random session token
      const expiryTime = Date.now() + (15 * 60 * 1000); // 15 minutes (increased from 5)
      
      await SecureStore.setItemAsync(SECURE_KEYS.SESSION_TOKEN, sessionToken);
      await SecureStore.setItemAsync(SECURE_KEYS.SESSION_EXPIRY, expiryTime.toString());
      
      console.log('🔒 [NativeCrypto] ✅ Session created');
    } catch (error) {
      console.error('🔒 [NativeCrypto] ❌ Failed to create session:', error);
    }
  }

  /**
   * Check if session is valid
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync(SECURE_KEYS.SESSION_TOKEN);
      const expiryStr = await SecureStore.getItemAsync(SECURE_KEYS.SESSION_EXPIRY);
      
      if (!token || !expiryStr) return false;
      
      const expiry = parseInt(expiryStr);
      return Date.now() < expiry;
    } catch (error) {
      console.error('🔒 [NativeCrypto] ❌ Failed to check session:', error);
      return false;
    }
  }

  /**
   * Clear session
   */
  async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.SESSION_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_KEYS.SESSION_EXPIRY);
      console.log('🔒 [NativeCrypto] ✅ Session cleared');
    } catch (error) {
      console.error('🔒 [NativeCrypto] ❌ Failed to clear session:', error);
    }
  }

  /**
   * Clear all security data
   */
  async clearAllSecurityData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.PIN_HASH);
      await SecureStore.deleteItemAsync(SECURE_KEYS.PIN_SALT);
      await this.clearSession();
      console.log('🔒 [NativeCrypto] ✅ All security data cleared');
    } catch (error) {
      console.error('🔒 [NativeCrypto] ❌ Failed to clear security data:', error);
      throw error;
    }
  }

  /**
   * Get security settings structure for compatibility
   */
  async getSecuritySettings() {
    const hasPin = await this.hasPinHash();
    const hasSession = await this.isSessionValid();
    
    return {
      securityEnabled: hasPin,
      biometricEnabled: false, // We'll add biometric support later
      sessionTimeout: 5 * 60 * 1000,
      maxAttempts: 5,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };
  }

  /**
   * Set security settings (for compatibility)
   */
  async setSecuritySettings(settings: any) {
    // For now, just log the settings
    console.log('🔒 [NativeCrypto] Security settings updated:', settings);
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}

// Export singleton instance
export const nativeCryptoStorage = new NativeCryptoStorage();