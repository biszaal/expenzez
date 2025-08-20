import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Secure storage utility for sensitive data
class SecureStorage {
  private static instance: SecureStorage;
  private encryptionKey: string | null = null;

  public static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  // Initialize encryption key (should be called on app start)
  public async initialize(): Promise<void> {
    try {
      let key = await AsyncStorage.getItem('@encryption_key');
      if (!key) {
        // Generate new encryption key
        key = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          Date.now().toString() + Math.random().toString()
        );
        await AsyncStorage.setItem('@encryption_key', key);
      }
      this.encryptionKey = key;
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      throw error;
    }
  }

  // Simple XOR encryption (for demo - use stronger encryption in production)
  private encrypt(text: string): string {
    if (!this.encryptionKey) throw new Error('Secure storage not initialized');
    
    const key = this.encryptionKey;
    let encrypted = '';
    
    for (let i = 0; i < text.length; i++) {
      encrypted += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return btoa(encrypted);
  }

  private decrypt(encryptedText: string): string {
    if (!this.encryptionKey) throw new Error('Secure storage not initialized');
    
    const key = this.encryptionKey;
    const encrypted = atob(encryptedText);
    let decrypted = '';
    
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(
        encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return decrypted;
  }

  // Store sensitive data with encryption
  public async setSecureItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = this.encrypt(value);
      await AsyncStorage.setItem(`@secure_${key}`, encrypted);
    } catch (error) {
      console.error(`Failed to store secure item ${key}:`, error);
      throw error;
    }
  }

  // Retrieve and decrypt sensitive data
  public async getSecureItem(key: string): Promise<string | null> {
    try {
      const encrypted = await AsyncStorage.getItem(`@secure_${key}`);
      if (!encrypted) return null;
      
      return this.decrypt(encrypted);
    } catch (error) {
      console.error(`Failed to retrieve secure item ${key}:`, error);
      return null;
    }
  }

  // Remove secure item
  public async removeSecureItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@secure_${key}`);
    } catch (error) {
      console.error(`Failed to remove secure item ${key}:`, error);
      throw error;
    }
  }

  // Clear all secure items
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

  // Check if storage is properly initialized
  public isInitialized(): boolean {
    return this.encryptionKey !== null;
  }
}

export default SecureStorage.getInstance();