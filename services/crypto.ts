import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

const KEY_NAME = 'cruzer_aes_key_v1';

async function getOrCreateKey() {
  let key = await SecureStore.getItemAsync(KEY_NAME);
  if (!key) {
    const rand = CryptoJS.lib.WordArray.random(32).toString();
    await SecureStore.setItemAsync(KEY_NAME, rand, { keychainService: KEY_NAME });
    key = rand;
  }
  return key;
}

export async function encryptMessage(plaintext: string) {
  const key = await getOrCreateKey();
  const ciphertext = CryptoJS.AES.encrypt(plaintext, key).toString();
  return ciphertext;
}

export async function decryptMessage(ciphertext: string) {
  const key = await getOrCreateKey();
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8) || '';
  } catch {
    return '';
  }
}

// Placeholder for future Signal Protocol integration
export async function initSignalProtocol() {
  // TODO: replace AES placeholder with libsignal-protocol bindings
  return true;
}
