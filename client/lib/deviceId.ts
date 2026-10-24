import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";

/**
 * Stable device identifier shown on the home screen, e.g. "7F3A-91C2-D40E".
 *
 * Source: the Android ID (unique per device + app signing key, stable across
 * restarts and app updates). If it is unavailable, a random id is generated
 * once and kept in storage. The id is stored under a key that is NOT wiped by
 * "Clear All Data", so a subscription server can rely on it.
 *
 * Limits worth knowing: the Android ID changes after a factory reset or if the
 * app is later signed with a different key; a random fallback id is lost if
 * the app is uninstalled.
 */
const STORAGE_KEY = "safetv_device_uid";

function hashHex(input: string): string {
  // Two 32-bit FNV-1a style passes -> 16 hex chars. Not cryptographic; it only
  // turns the raw id into a fixed-length, non-reversible public identifier.
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x85ebca6b) >>> 0;
  }
  return (
    a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0")
  ).toUpperCase();
}

function format(hex: string): string {
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      cached = saved;
      return saved;
    }
  } catch {}

  let seed: string | null = null;
  if (Platform.OS === "android") {
    try {
      seed = Application.getAndroidId();
    } catch {}
  }
  if (!seed) {
    seed = `${Date.now()}-${Math.random()}-${Math.random()}`;
  }
  const id = format(hashHex(`safetv:${seed}`));
  cached = id;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, id);
  } catch {}
  return id;
}
