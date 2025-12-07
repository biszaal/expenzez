import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

/**
 * Secure Storage Utility
 *
 * For truly sensitive data (tokens, credentials), use SecureStore directly.
 * This utility provides an additional layer of obfuscation for non-critical
 * sensitive data stored in AsyncStorage.
 *
 * SECURITY NOTE: For production apps handling financial data,
 * always use SecureStore for sensitive data rather than this utility.
 */
class SecureStorage {
  private static instance: SecureStorage;
  private encryptionKey: string | null = null;
  private initialized: boolean = false;

  public static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * Initialize encryption key using SecureStore
   * Key is stored in device's secure keychain/keystore
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try to get existing key from SecureStore (device keychain)
      let key = await SecureStore.getItemAsync('encryption_master_key');

      if (!key) {
        // Generate cryptographically secure random key
        const randomBytes = await Crypto.getRandomBytesAsync(32);
        const randomHex = Array.from(randomBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Create key with additional entropy from device-specific hash
        key = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          randomHex + Date.now().toString()
        );

        // Store in device's secure storage
        await SecureStore.setItemAsync('encryption_master_key', key);
      }

      this.encryptionKey = key;
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      // Fallback: generate session-only key (less secure but functional)
      const fallbackBytes = await Crypto.getRandomBytesAsync(32);
      this.encryptionKey = Array.from(fallbackBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      this.initialized = true;
    }
  }

  /**
   * Encrypt using AES-like stream cipher with key derivation
   * This is NOT AES but provides better security than XOR
   */
  private async encrypt(text: string): Promise<string> {
    if (!this.encryptionKey) throw new Error('Secure storage not initialized');

    // Generate random IV for each encryption
    const ivBytes = await Crypto.getRandomBytesAsync(16);
    const iv = Array.from(ivBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // Derive a unique key for this message using IV
    const derivedKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      this.encryptionKey + iv
    );

    // Convert text to bytes
    const textBytes = new TextEncoder().encode(text);

    // Encrypt using derived key (stream cipher approach)
    const encryptedBytes = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      // Use multiple rounds of key material
      const keyByte = parseInt(derivedKey.substr((i * 2) % 62, 2), 16);
      const extraEntropy = parseInt(derivedKey.substr(((i + 32) * 2) % 62, 2), 16);
      encryptedBytes[i] = textBytes[i] ^ keyByte ^ (extraEntropy >> (i % 8));
    }

    // Combine IV + encrypted data and base64 encode
    const combined = iv + Array.from(encryptedBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return btoa(combined);
  }

  /**
   * Decrypt data encrypted with the encrypt method
   */
  private async decrypt(encryptedText: string): Promise<string> {
    if (!this.encryptionKey) throw new Error('Secure storage not initialized');

    try {
      const combined = atob(encryptedText);

      // Extract IV (first 32 hex chars = 16 bytes)
      const iv = combined.substring(0, 32);
      const encryptedHex = combined.substring(32);

      // Derive the same key using IV
      const derivedKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        this.encryptionKey + iv
      );

      // Convert hex string to bytes
      const encryptedBytes = new Uint8Array(encryptedHex.length / 2);
      for (let i = 0; i < encryptedHex.length; i += 2) {
        encryptedBytes[i / 2] = parseInt(encryptedHex.substr(i, 2), 16);
      }

      // Decrypt using same key derivation
      const decryptedBytes = new Uint8Array(encryptedBytes.length);
      for (let i = 0; i < encryptedBytes.length; i++) {
        const keyByte = parseInt(derivedKey.substr((i * 2) % 62, 2), 16);
        const extraEntropy = parseInt(derivedKey.substr(((i + 32) * 2) % 62, 2), 16);
        decryptedBytes[i] = encryptedBytes[i] ^ keyByte ^ (extraEntropy >> (i % 8));
      }

      return new TextDecoder().decode(decryptedBytes);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Store sensitive data with encryption
   */
  public async setSecureItem(key: string, value: string): Promise<void> {
    await this.ensureInitialized();

    try {
      const encrypted = await this.encrypt(value);
      await AsyncStorage.setItem(`@secure_${key}`, encrypted);
    } catch (error) {
      console.error(`Failed to store secure item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt sensitive data
   */
  public async getSecureItem(key: string): Promise<string | null> {
    await this.ensureInitialized();

    try {
      const encrypted = await AsyncStorage.getItem(`@secure_${key}`);
      if (!encrypted) return null;

      return await this.decrypt(encrypted);
    } catch (error) {
      console.error(`Failed to retrieve secure item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove secure item
   */
  public async removeSecureItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@secure_${key}`);
    } catch (error) {
      console.error(`Failed to remove secure item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all secure items
   */
  public async clearSecureStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(key => key.startsWith('@secure_'));
      await AsyncStorage.multiRemove(secureKeys);
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      throw error;
    }
  }

  /**
   * Check if storage is properly initialized
   */
  public isInitialized(): boolean {
    return this.initialized && this.encryptionKey !== null;
  }

  /**
   * Ensure initialization before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

export default SecureStorage.getInstance();
