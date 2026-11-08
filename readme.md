<div align="center">

# 📺 SafeTV

**A modern M3U IPTV player for Android TV and Android phones.**

[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Android%20TV-3DDC84?logo=android&logoColor=white)](#-supported-platforms)
[![Framework](https://img.shields.io/badge/Framework-Expo%20SDK%2054%20%7C%20React%20Native-000020?logo=expo&logoColor=white)](#-tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](#-tech-stack)
[![Version](https://img.shields.io/badge/version-1.8.5-blue.svg)](../../releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#-license)

[**Download**](../../releases/latest) · [**What's new**](#-whats-new-compared-to-prysm) · [**Features**](#-features) · [**Getting Started**](#-getting-started)

</div>

---

SafeTV is an **IPTV player** with a purpose-built native playback engine and a
10-foot interface designed for TV remotes. It is a fork of
[Prysm](https://github.com/dereferencex/prysm) by dereferencex, reworked and
maintained by **[ali-mpb1377](https://github.com/ali-mpb1377)**.

SafeTV signs in with a **username and password** and downloads the channel list
from its own server. There is no option to add playlist links or stream
addresses.

---

## 🆕 What's new compared to Prysm

- **Account-based** — login with username and password; channels, logos and the
  subscription status come from the server (token stored encrypted). Expired
  or suspended accounts see only a warning screen.
- **Animated loading screen** that tests the connection and checks the account
  at start-up.
- **Rebrand** — new name, logo, app icon, TV banner and splash screen.
- **New home screen** — navy dashboard with logo, date/clock and gradient tiles
  (Live TV, Favorites, Series/Search, EPG Catch-up, Add Playlist, Settings), an
  Account button reserved for future account details, and a refresh button.
- **Device ID** on the home screen — a stable identifier derived from the
  Android ID, meant for server-side subscription control.
- **Live TV preview** — channel list on the left, a small live monitor on the
  right. Press a channel once to preview it, press it again for fullscreen.
- **Category visibility** — turn playlist categories on or off from Settings;
  hidden categories disappear from every channel list.
- **Category Lock** — optional 4-digit PIN: with the lock on, a PIN is needed to
  show a hidden category again.
- **Landscape only** — phones included; the screen rotates between the two
  landscape directions but never goes portrait.
- **TV interface everywhere** — the interface-mode switch was removed.
- **Fixed themes** — Light, Dark and Pitch Black, shared by phone and TV
  (Material You and seed colors were removed).
- **Performance on TV** — the channel list only renders rows near the screen, so
  large playlists no longer freeze the app and logos load reliably.
- **Better defaults** — VLC player engine and daily playlist auto-refresh.
- **Older devices** — adding a playlist retries with compatible TLS settings
  (Android 7) and shows the real network error.
- **No vibration** feedback.

See the [CHANGELOG](CHANGELOG.md) for the full list.

---

## ✨ Features

### 🔐 Account & channels
- **Username + password** login, token stored encrypted on the device
- Channels, groups and logos are downloaded from the account server
- Subscription status checked at start-up, on return to the app and
  periodically; expired / suspended accounts see only a warning screen
- Categories with filtering, per-category visibility and a PIN lock for
  showing hidden categories again

### 🎬 Playback
- Custom **native player** — **VLC** (default) or Media3/ExoPlayer
- **HLS**, **DASH (MPD)**, **Smooth Streaming (MSS/ISM)**
- Audio and subtitle track selection, aspect ratio, in-player favorites and
  recent channels
- **Picture-in-Picture** and **background audio**

### 🔐 DRM
- **Widevine**, **PlayReady**, **ClearKey** with license URL or embedded key,
  custom headers and PSSH

### 📅 EPG (XMLTV)
- Auto-detected from M3U `tvg-id` / `x-tvg-url`, with **Now / Next** and a full
  program guide
- Handles large gzip-compressed XMLTV feeds

### 📺 Android TV
- 3-column Live TV layout with preview and top navigation
- Full **D-pad / remote** navigation with clear focus rings

### 🧰 Also included
- Crash handler
- Per-ABI APKs — `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64` and a universal build

---

## 📥 Download

Grab the latest build from **[GitHub Releases](../../releases/latest)**.

| APK | Use it on |
| --- | --- |
| `safetv-<version>-arm64-v8a.apk` | Most modern phones and TV boxes (recommended) |
| `safetv-<version>-armeabi-v7a.apk` | Older 32-bit ARM devices (e.g. old tablets and boxes) |
| `safetv-<version>-x86_64.apk` | x86_64 emulators and some Chromebooks |
| `safetv-<version>-x86.apk` | 32-bit x86 emulators |
| `safetv-<version>-universal.apk` | When you are unsure — contains every ABI |

---

## 🎯 Supported Platforms

| Platform | Status |
| --- | --- |
| 📺 **Android TV** | ✅ Primary target |
| 🤖 **Android** (phone / tablet, landscape) | ✅ Supported |
| 🍎 iOS / 🌐 Web | ❌ Not a target |

---

## 🚀 Getting Started

### Requirements
- **Node.js** 18+ (22 recommended)
- **JDK 21** and **Android Studio** (for an emulator or a physical device)

### Setup

```bash
git clone https://github.com/ali-mpb1377/safetv.git
cd safetv
npm install --legacy-peer-deps
```

### Run

```bash
npm start          # Expo dev server
npm run android    # Build and install on a connected device/emulator
```

### Build a release APK

```bash
npx expo prebuild --platform android --no-install
cd android && ./gradlew assembleRelease
```

Per-ABI APKs land in `android/app/build/outputs/apk/release/`.

### Publish a release (GitHub Actions)

1. Raise `version` and `versionCode` in `app.json` (and `version` in `package.json`).
2. Add a `## [x.y.z]` section to `CHANGELOG.md` — it becomes the release notes.
3. Commit, push, then tag:

```bash
git tag v1.8.5
git push origin v1.8.5
```

The [workflow](.github/workflows/build-apk.yml) builds every ABI and publishes
`safetv-<version>-<abi>.apk` files on a new GitHub Release.

---

## 🛠️ Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | **Expo SDK 54** · React Native (`react-native-tvos` fork) |
| Language | **TypeScript** · **Kotlin** |
| Navigation | React Navigation 7 |
| Lists | FlashList (mobile) · windowed ScrollView (TV channel list) |
| Player | **Custom native module** — Media3/ExoPlayer + VLC (`libvlc`) |
| State | React Context · TanStack React Query |
| Storage | AsyncStorage |

### Native modules

| Module | Purpose |
| --- | --- |
| [`tv-player`](modules/tv-player) | ExoPlayer/VLC engine, DRM, PiP, background audio, media session |
| [`tv-channel`](modules/tv-channel) | Android TV launcher banner and home-row channel tiles |
| [`crash-handler`](modules/crash-handler) | Native crash capture |
| [`logcat-reader`](modules/logcat-reader) | Native log capture |
| [`secure-token`](modules/secure-token) | Encrypted (Android Keystore) storage for the account token |

---

## ⚠️ Disclaimer

**SafeTV is a media player only.** It does not provide, host or distribute any
content, streams or playlists. Users must supply their own legally obtained IPTV
sources. SafeTV is not affiliated with, endorsed by or connected to any content
provider.

---

## 📄 License

Licensed under the [MIT License](LICENSE).

SafeTV is based on [Prysm](https://github.com/dereferencex/prysm), © 2026
dereferencex, also MIT-licensed. The original copyright notice is kept in the
license file as the MIT License requires.

---

<div align="center">

Maintained by [**ali-mpb1377**](https://github.com/ali-mpb1377)

</div>
