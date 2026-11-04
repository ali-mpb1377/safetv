import * as Application from "expo-application";
import * as Device from "expo-device";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { Platform } from "react-native";

import { getApkAbisNative } from "../../modules/tv-player/src/index";

const GITHUB_RELEASES_URL =
  "https://api.github.com/repos/ali-mpb1377/safetv/releases/latest";
const APK_DOWNLOAD_DIR = FileSystemLegacy.documentDirectory;

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  apkUrl: string;
  /** Which build is installed / will be downloaded (arm64-v8a, universal ...). */
  variant?: string;
}

const VARIANT_RE = /-(arm64-v8a|armeabi-v7a|x86_64|x86|universal)\.apk$/i;

function variantOf(assetName: string): string | null {
  const m = VARIANT_RE.exec(assetName);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Which kind of APK is installed right now. The APK's own lib/ folders tell:
 * several ABIs = the universal build, one ABI = that per-ABI build. If that
 * cannot be read, the device's preferred ABI is used.
 */
export async function getInstalledVariant(): Promise<string | null> {
  const abis = await getApkAbisNative();
  if (abis.length > 1) return "universal";
  if (abis.length === 1) return abis[0].toLowerCase();
  const preferred = Device.supportedCpuArchitectures?.[0];
  return preferred ? preferred.toLowerCase() : null;
}

/** Same variant as installed; sensible fallbacks only if it is missing. */
function pickApkAsset(assets: any[], variant: string | null): any | null {
  const apks = (assets ?? []).filter(
    (a: any) => typeof a?.name === "string" && a.name.endsWith(".apk"),
  );
  if (apks.length === 0) return null;
  if (variant) {
    const exact = apks.find((a: any) => variantOf(a.name) === variant);
    if (exact) return exact;
  }
  // Installed variant is not in this release: universal works everywhere,
  // otherwise the device's preferred ABI, otherwise the first APK.
  const universal = apks.find((a: any) => variantOf(a.name) === "universal");
  if (universal) return universal;
  const deviceAbi = Device.supportedCpuArchitectures?.[0]?.toLowerCase();
  const byDevice = deviceAbi
    ? apks.find((a: any) => variantOf(a.name) === deviceAbi)
    : null;
  return byDevice ?? apks[0];
}

function compareVersions(a: string, b: string): number {
  const partsA = a.replace(/^v/, "").split(".").map(Number);
  const partsB = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const valA = partsA[i] || 0;
    const valB = partsB[i] || 0;
    if (valA > valB) return 1;
    if (valA < valB) return -1;
  }
  return 0;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  if (Platform.OS !== "android") {
    return null;
  }

  try {
    const response = await fetch(GITHUB_RELEASES_URL, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) {
      console.error("Failed to fetch latest release");
      return null;
    }

    const data = await response.json();
    const currentVersion = Application.nativeApplicationVersion || "0.0.0";
    const latestVersion = data.tag_name.replace(/^v/, "");

    if (compareVersions(latestVersion, currentVersion) > 0) {
      const variant = await getInstalledVariant();
      const apkAsset = pickApkAsset(data.assets, variant);
      if (!apkAsset) {
        console.error("No APK asset found in release");
        return null;
      }

      const releaseNotes = data.body || "No release notes available";

      return {
        available: true,
        currentVersion,
        latestVersion,
        releaseNotes,
        apkUrl: apkAsset.browser_download_url,
        variant: variantOf(apkAsset.name) ?? undefined,
      };
    }

    return {
      available: false,
      currentVersion,
      latestVersion,
      releaseNotes: "",
      apkUrl: "",
    };
  } catch (error) {
    console.error("Error checking for update:", error);
    return null;
  }
}

export async function downloadApk(
  apkUrl: string,
  onProgress?: (progress: number) => void,
): Promise<string | null> {
  if (Platform.OS !== "android" || !APK_DOWNLOAD_DIR) {
    return null;
  }

  try {
    const apkPath = `${APK_DOWNLOAD_DIR}safetv-update.apk`;

    const downloadResumable = FileSystemLegacy.createDownloadResumable(
      apkUrl,
      apkPath,
      {},
      (downloadProgress) => {
        if (onProgress && downloadProgress.totalBytesExpectedToWrite > 0) {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          onProgress(progress);
        }
      },
    );

    const result = await downloadResumable.downloadAsync();
    return result?.uri || null;
  } catch (error) {
    console.error("Error downloading APK:", error);
    return null;
  }
}

export async function getDownloadedApkPath(): Promise<string | null> {
  if (!APK_DOWNLOAD_DIR) return null;
  const apkPath = `${APK_DOWNLOAD_DIR}safetv-update.apk`;
  const fileInfo = await FileSystemLegacy.getInfoAsync(apkPath);
  return fileInfo.exists ? apkPath : null;
}

export async function clearDownloadedApk(): Promise<void> {
  if (!APK_DOWNLOAD_DIR) return;
  const apkPath = `${APK_DOWNLOAD_DIR}safetv-update.apk`;
  try {
    const fileInfo = await FileSystemLegacy.getInfoAsync(apkPath);
    if (fileInfo.exists) {
      await FileSystemLegacy.deleteAsync(apkPath);
    }
  } catch (error) {
    console.error("Error clearing downloaded APK:", error);
  }
}

export async function getApkContentUri(apkPath: string): Promise<string | null> {
  try {
    return await FileSystemLegacy.getContentUriAsync(apkPath);
  } catch (error) {
    console.error("Error getting content URI:", error);
    return null;
  }
}
