import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';

const KEY_NAME = 'cruzer_aes_key_v1';
let cachedKey: string | null = null;

async function getOrCreateKey() {
  // SecureStore is not available on web platform
  if (Platform.OS === 'web') {
    if (!cachedKey) {
      cachedKey = CryptoJS.lib.WordArray.random(32).toString();
    }
    return cachedKey;
  }

  try {
    let key = await SecureStore.getItemAsync(KEY_NAME);
    if (!key) {
      const rand = CryptoJS.lib.WordArray.random(32).toString();
      await SecureStore.setItemAsync(KEY_NAME, rand);
      key = rand;
    }
    return key;
  } catch (error) {
    console.warn('Failed to access secure storage:', error);
    // Return a fallback key (not secure, but prevents crash)
    if (!cachedKey) {
      cachedKey = CryptoJS.lib.WordArray.random(32).toString();
    }
    return cachedKey;
  }
}

export async function encryptMessage(plaintext: string) {
  try {
    const key = await getOrCreateKey();
    const ciphertext = CryptoJS.AES.encrypt(plaintext, key).toString();
    return ciphertext;
  } catch (error) {
    console.warn('Encryption failed:', error);
    return plaintext; // Return plaintext if encryption fails
  }
}

export async function decryptMessage(ciphertext: string) {
  try {
    const key = await getOrCreateKey();
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8) || '';
  } catch (error) {
    console.warn('Decryption failed:', error);
    return ''; // Return empty string if decryption fails
  }
}

// Placeholder for future Signal Protocol integration
export async function initSignalProtocol() {
  try {
    // TODO: replace AES placeholder with libsignal-protocol bindings
    return true;
  } catch (error) {
    console.warn('Signal protocol initialization failed:', error);
    return false;
  }
}
