import { requireOptionalNativeModule } from "expo-modules-core";

interface SecureTokenModuleType {
  setItem(key: string, value: string): Promise<boolean>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<boolean>;
}

/** Native Keystore-backed store. `null` when the module is not available. */
export const SecureTokenNative =
  requireOptionalNativeModule<SecureTokenModuleType>("SecureToken");
