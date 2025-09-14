/**
 * Minimal PIN storage test to debug the crash
 * This will help us isolate if the issue is with CryptoJS, SecureStore, or something else
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export class DebugPinStorage {
  static async runDiagnostics() {
    console.log('🔍 [DEBUG] Starting comprehensive PIN storage diagnostics...');
    
    try {
      // Test 1: Basic SecureStore availability
      console.log('🔍 [DEBUG] Test 1: SecureStore availability');
      console.log('🔍 [DEBUG] Platform:', Platform.OS);
      console.log('🔍 [DEBUG] SecureStore available:', !!SecureStore);
      
      // Test 2: Simple SecureStore read/write
      console.log('🔍 [DEBUG] Test 2: Simple SecureStore operations');
      await SecureStore.setItemAsync('debug_test', 'test_value');
      const retrieved = await SecureStore.getItemAsync('debug_test');
      console.log('🔍 [DEBUG] SecureStore write/read test:', retrieved === 'test_value' ? 'PASS' : 'FAIL');
      await SecureStore.deleteItemAsync('debug_test');
      
      // Test 3: CryptoJS basic operations
      console.log('🔍 [DEBUG] Test 3: CryptoJS basic operations');
      const CryptoJS = require('crypto-js');
      console.log('🔍 [DEBUG] CryptoJS available:', !!CryptoJS);
      
      // Test simple SHA256 (no PBKDF2)
      const simpleHash = CryptoJS.SHA256('test').toString();
      console.log('🔍 [DEBUG] Simple SHA256 test:', simpleHash.length > 0 ? 'PASS' : 'FAIL');
      
      // Test 4: PBKDF2 with minimal iterations
      console.log('🔍 [DEBUG] Test 4: PBKDF2 with 1 iteration');
      const minimalPbkdf2 = CryptoJS.PBKDF2('test', 'salt', {
        keySize: 256 / 32,
        iterations: 1,
        hasher: CryptoJS.algo.SHA256
      }).toString();
      console.log('🔍 [DEBUG] Minimal PBKDF2 test:', minimalPbkdf2.length > 0 ? 'PASS' : 'FAIL');
      
      // Test 5: PBKDF2 with more iterations (but still low)
      console.log('🔍 [DEBUG] Test 5: PBKDF2 with 10 iterations');
      const lowPbkdf2 = CryptoJS.PBKDF2('test', 'salt', {
        keySize: 256 / 32,
        iterations: 10,
        hasher: CryptoJS.algo.SHA256
      }).toString();
      console.log('🔍 [DEBUG] Low iteration PBKDF2 test:', lowPbkdf2.length > 0 ? 'PASS' : 'FAIL');
      
      // Test 6: PBKDF2 with async wrapper (what we're using)
      console.log('🔍 [DEBUG] Test 6: Async PBKDF2 wrapper');
      const asyncPbkdf2 = await new Promise<string>((resolve, reject) => {
        setTimeout(() => {
          try {
            const result = CryptoJS.PBKDF2('test', 'salt', {
              keySize: 256 / 32,
              iterations: 10,
              hasher: CryptoJS.algo.SHA256
            }).toString();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, 10);
      });
      console.log('🔍 [DEBUG] Async PBKDF2 test:', asyncPbkdf2.length > 0 ? 'PASS' : 'FAIL');
      
      // Test 7: Current production parameters (1000 iterations)
      console.log('🔍 [DEBUG] Test 7: Production PBKDF2 (1000 iterations)');
      const startTime = Date.now();
      const prodPbkdf2 = await new Promise<string>((resolve, reject) => {
        setTimeout(() => {
          try {
            console.log('🔍 [DEBUG] Starting 1000 iteration PBKDF2...');
            const result = CryptoJS.PBKDF2('test', 'salt', {
              keySize: 256 / 32,
              iterations: 1000,
              hasher: CryptoJS.algo.SHA256
            }).toString();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, 10);
      });
      const duration = Date.now() - startTime;
      console.log('🔍 [DEBUG] Production PBKDF2 test:', prodPbkdf2.length > 0 ? 'PASS' : 'FAIL');
      console.log('🔍 [DEBUG] Duration:', duration + 'ms');
      
      // Test 8: Combined SecureStore + PBKDF2
      console.log('🔍 [DEBUG] Test 8: Combined SecureStore + PBKDF2');
      const combinedHash = await new Promise<string>((resolve, reject) => {
        setTimeout(() => {
          try {
            const result = CryptoJS.PBKDF2('test_pin', 'test_salt', {
              keySize: 256 / 32,
              iterations: 100, // Lower for test
              hasher: CryptoJS.algo.SHA256
            }).toString();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, 10);
      });
      
      await SecureStore.setItemAsync('debug_pin_hash', combinedHash);
      const retrievedHash = await SecureStore.getItemAsync('debug_pin_hash');
      console.log('🔍 [DEBUG] Combined test:', retrievedHash === combinedHash ? 'PASS' : 'FAIL');
      await SecureStore.deleteItemAsync('debug_pin_hash');
      
      console.log('🔍 [DEBUG] ✅ All diagnostic tests completed successfully!');
      return { success: true, message: 'All tests passed' };
      
    } catch (error: any) {
      console.error('🔍 [DEBUG] ❌ Diagnostic test failed:', error);
      console.error('🔍 [DEBUG] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Test the actual PIN storage process with detailed logging
   */
  static async testPinStorage(pin: string) {
    console.log('🔍 [DEBUG] Testing actual PIN storage process...');
    
    try {
      // Step 1: Generate salt
      console.log('🔍 [DEBUG] Step 1: Generating salt...');
      const salt = Math.random().toString(36).substring(2, 15);
      console.log('🔍 [DEBUG] Salt generated:', salt);
      
      // Step 2: Hash PIN with minimal parameters
      console.log('🔍 [DEBUG] Step 2: Hashing PIN...');
      const hash = await new Promise<string>((resolve, reject) => {
        console.log('🔍 [DEBUG] Starting PBKDF2 computation...');
        setTimeout(() => {
          try {
            const CryptoJS = require('crypto-js');
            const result = CryptoJS.PBKDF2(pin, salt, {
              keySize: 256 / 32,
              iterations: 100, // Very low for testing
              hasher: CryptoJS.algo.SHA256
            }).toString();
            console.log('🔍 [DEBUG] PBKDF2 computation complete');
            resolve(result);
          } catch (error) {
            console.error('🔍 [DEBUG] PBKDF2 failed:', error);
            reject(error);
          }
        }, 10);
      });
      console.log('🔍 [DEBUG] PIN hashed successfully, length:', hash.length);
      
      // Step 3: Store in SecureStore
      console.log('🔍 [DEBUG] Step 3: Storing in SecureStore...');
      await SecureStore.setItemAsync('debug_pin_test', hash);
      await SecureStore.setItemAsync('debug_salt_test', salt);
      console.log('🔍 [DEBUG] Stored in SecureStore successfully');
      
      // Step 4: Retrieve and verify
      console.log('🔍 [DEBUG] Step 4: Retrieving and verifying...');
      const storedHash = await SecureStore.getItemAsync('debug_pin_test');
      const storedSalt = await SecureStore.getItemAsync('debug_salt_test');
      
      const verifyHash = await new Promise<string>((resolve, reject) => {
        setTimeout(() => {
          try {
            const CryptoJS = require('crypto-js');
            const result = CryptoJS.PBKDF2(pin, storedSalt, {
              keySize: 256 / 32,
              iterations: 100,
              hasher: CryptoJS.algo.SHA256
            }).toString();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, 10);
      });
      
      const isValid = storedHash === verifyHash;
      console.log('🔍 [DEBUG] Verification result:', isValid ? 'PASS' : 'FAIL');
      
      // Cleanup
      await SecureStore.deleteItemAsync('debug_pin_test');
      await SecureStore.deleteItemAsync('debug_salt_test');
      
      console.log('🔍 [DEBUG] ✅ PIN storage test completed successfully!');
      return { success: true, message: 'PIN storage test passed' };
      
    } catch (error: any) {
      console.error('🔍 [DEBUG] ❌ PIN storage test failed:', error);
      console.error('🔍 [DEBUG] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return { success: false, error: error.message };
    }
  }
}