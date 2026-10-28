import AsyncStorage from "@react-native-async-storage/async-storage";
import { SecureTokenNative } from "../../modules/secure-token/src/index";

/**
 * Encrypted storage for the account token (Android Keystore, AES-256-GCM).
 * Falls back to plain AsyncStorage only when the native module is missing
 * (for example in a JS-only dev client).
 */
const PREFIX = "safetv_secure_";

export async function secureSet(key: string, value: string): Promise<void> {
  if (SecureTokenNative) {
    await SecureTokenNative.setItem(key, value);
    return;
  }
  await AsyncStorage.setItem(PREFIX + key, value);
}

export async function secureGet(key: string): Promise<string | null> {
  try {
    if (SecureTokenNative) return await SecureTokenNative.getItem(key);
    return await AsyncStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export async function secureRemove(key: string): Promise<void> {
  try {
    if (SecureTokenNative) {
      await SecureTokenNative.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {}
}
