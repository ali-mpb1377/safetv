import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";

/**
 * Device identifier shown on the home screen, formatted like a MAC address.
 *
 * NOTE: Android 6+ does not let apps read the real network MAC (the OS returns
 * a fixed dummy value), so this is a STABLE DEVICE ID derived from the Android
 * ID, formatted as XX:XX:XX:XX:XX:XX. It stays the same across restarts and
 * app updates, which makes it usable later as a subscription-lock key.
 * It is NOT the hardware MAC address.
 */
const STORAGE_KEY = "safetv_device_id";

function toMacFormat(hex12: string): string {
  const h = hex12.toUpperCase().padEnd(12, "0").slice(0, 12);
  return h.match(/.{2}/g)!.join(":");
}

function hashHex(input: string): string {
  // Two 32-bit FNV-1a passes → 12+ hex chars. Not cryptographic; only used to
  // turn an id string into a fixed-length, MAC-shaped value.
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x85ebca6b) >>> 0;
  }
  return (
    a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0")
  ).slice(0, 12);
}

let cached: string | null = null;

export async function getDeviceMac(): Promise<string> {
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
    // Fallback: random id generated once and persisted.
    seed = `${Date.now()}-${Math.random()}-${Math.random()}`;
  }
  const hex = hashHex(`safetv:${seed}`);
  // Force the "locally administered, unicast" bits so it can never be
  // mistaken for a real vendor MAC.
  const first = (parseInt(hex.slice(0, 2), 16) & 0xfc) | 0x02;
  const mac = toMacFormat(first.toString(16).padStart(2, "0") + hex.slice(2));
  cached = mac;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mac);
  } catch {}
  return mac;
}
