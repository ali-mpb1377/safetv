# Changelog

All notable changes to SafeTV are documented here.
SafeTV is a fork of [Prysm](https://github.com/dereferencex/prysm) by dereferencex;
entries before 1.6.0 are the upstream Prysm history.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

---

## [1.8.0] — 2026-11-04

Performance and stability release for weak TV boxes.

### Improved
- **Search** — Persian / Arabic letter variants and digits are matched as the
  same (ی/ي، ک/ك، ۱/١...), several words can be typed in any order, results
  appear after you pause typing, and only 40 cards are drawn at a time (more
  load as you scroll). The player's next / previous cycle through the whole
  result list.
- **Memory** — more Java heap for the app (`largeHeap`), ExoPlayer read-ahead
  limited to 15–30 s / 32 MB, and ExoPlayer falls back to another decoder if a
  hardware decoder fails to start.
- **Logs** — only warnings, errors and player events are captured, so a weak
  box no longer pushes thousands of log lines per minute through the app.
- **Server requests** — the channel list gets 45 s, and the time limit now also
  covers reading the answer, so a stalled connection can never hang the app.
- **Build** — the GitHub workflow frees disk space and cleans the npm cache
  before installing.

---

## [1.7.5] — 2026-10-29

### Fixed
- Next / previous channel in the player now follows the list you opened it
  from (selected category, search results or favorites) instead of the whole
  playlist. At the first or last channel of a category it stays on that
  channel instead of jumping into another category.

---

## [1.7.4] — 2026-10-29

### Fixed
- Server streams now play in VLC: the device token is sent as `?key=` in the
  stream address (the server accepts it there and carries it into every HLS
  segment link) instead of a request header, which VLC cannot send.

---

## [1.7.3] — 2026-10-28

### Fixed
- ExoPlayer: a stream address without a file extension (for example
  `/s/<id>`) that returned "container unsupported" is now retried as HLS.

---

## [1.7.2] — 2026-10-28

### Fixed
- Playback errors now show the real reason (HTTP status, SSL or network
  problem) instead of just "Source error".

---

## [1.7.1] — 2026-10-28

### Fixed
- Streams served by the account server did not play: the account token was
  not attached because the host could not be read from the stream address.

---

## [1.7.0] — 2026-10-27

SafeTV now works with an account instead of playlists.

### Added
- **Account login** — username + password screen; the app cannot be used until
  a valid account is logged in. The X in the corner closes the app.
- **Account server** — channels, groups and logos are downloaded from the
  server after login. The token is stored encrypted (Android Keystore,
  AES-256-GCM) and the password is never stored.
- **Animated loading screen** with the logo: tests the connection, checks the
  account, then loads the channels.
- **Account section** (home screen) — name, status, end date, days left and
  device count; logout.
- **Subscription control** — the server decides: expired / suspended accounts
  and blocked devices see only a warning screen with "check again"; no channel
  list is kept. The subscription is re-checked when the app opens, when it
  returns to the foreground and every `check_interval_hours` while it stays
  open. A rejected stream (401/403) triggers an immediate re-check.
- Server streams are played with the account token (only on the server's own
  host); direct streams only use the headers the server lists for them.

- **Persian font** — Persian text uses a bundled Vazirmatn font (drop
  `Vazirmatn-Regular.ttf` / `Vazirmatn-Bold.ttf` into `assets/fonts/`), so it
  looks the same on every device.

### Removed
- Adding M3U / playlist links, local playlist files, the network stream player
  and the log viewer. Playlists saved by older versions are deleted on start.

### Notes
- The server host is HTTPS-only (cleartext is blocked for it in the network
  security config); direct http:// channel streams still work.
- The channel list is kept in memory only (never written to disk).

---

## [1.6.0] — 2026-10-26

First SafeTV release, by [ali-mpb1377](https://github.com/ali-mpb1377).

### Added
- **SafeTV branding** — new name, shield-and-play logo, app icon, adaptive icon,
  Android TV banner and splash screen.
- **New home screen** — navy dashboard with the SafeTV logo, date and clock, and
  gradient tiles: Live TV, Favorites, Series (or Search), EPG Catch-up,
  Add Playlist and Settings. Account button (placeholder for future account
  details) and refresh button in the header.
- **Device ID** shown on the home screen (derived from the Android ID, kept
  across restarts) — intended for server-side subscription control later.
- **Live TV preview** — small live monitor next to the channel list. Press a
  channel once to preview it, press it again for fullscreen.
- **Category visibility** — Settings → Visible Categories: categories are
  detected from the playlist; turn any off to hide it everywhere.
- **Category Lock** — optional 4-digit PIN; with the lock on, showing a hidden
  category again needs the PIN.

### Changed
- **Landscape only** on every device (phones included); the screen still rotates
  between the two landscape directions.
- **TV interface is always used**; the interface-mode option was removed from
  Settings.
- **Fixed themes** — Light, Dark and Pitch Black only; Material You and seed
  colors removed. Phone and TV share the same palette.
- Default player engine is now **VLC**; default auto-refresh is **every day**
  (applies to fresh installs).
- Vibration feedback removed.
- "Check for updates" hidden in Settings for now (`SHOW_UPDATE_CHECK` flag).
- Release APKs are published as `safetv-<version>-<abi>.apk`.

### Fixed
- TV: channel list froze the app and logos/names did not appear on large
  playlists — only the rows near the screen are rendered now.
- TV: the info card kept showing the first channel; it now follows the channel
  being previewed.
- TV: the "Recent channels" panel in the player could get stuck in the middle
  of the screen.
- Adding a playlist on older devices (e.g. Android 7) now retries with
  compatible TLS settings and shows the real network error.
- Search on TV limited to the first 80 matches to avoid freezes.

---

## [1.5.0] — 2026-10-15

### Added
- **Android TV 3-column interface** — home, channels, favorites, search and Live TV
  layouts with a live *Now Showing* panel and a persistent top navigation bar.
- **TV remote UX overhaul** — flat square focus indicators with a traveling solid
  fill, correct D-pad focus routing between control rows, and focus restoration
  when panels open and close.
- **Home tab on launch** — TV now opens on the Home screen instead of the last tab.
- **EPG / XMLTV program guide** — auto-detected from M3U (`tvg-id`, `x-tvg-url`),
  with a full guide view (grid on TV, list on mobile), *Now / Next* badges on
  channel cards, and *Now / Next* inside the player. On by default.
- **Material You dynamic color** — wallpaper-synthesized palettes on Android 12+
  via a new native module, plus a **manual seed color** picker and a true
  **Pitch Black** AMOLED theme.
- **System media controls** — play/pause, skip and metadata exposed through the
  Android media session for all playback.
- **In-app log viewer** — live native logcat, native crash traces, and copy /
  share / export, backed by `logcat-reader` and `crash-handler` modules.
- **Manual rotate control in the player** — toggle the screen between landscape
  and portrait without relying on system auto-rotate.
- **KODIPROP / EXTHTTP parsing** — `#KODIPROP stream_headers` and `#EXTHTTP`
  header blocks are now honoured when building stream requests.
- **x86 and x86_64 release APKs** — CI now publishes per-ABI builds for
  `arm64-v8a`, `armeabi-v7a`, `x86` and `x86_64`, plus a universal APK.

### Changed
- **Orientation policy** — non-player screens are portrait-locked, player screens
  rotate freely, and backing out of a landscape video restores portrait.
- **Seed color menu** on TV is now a compact 4-column swatch grid instead of a
  long vertical list.
- **Playlist import** on TV got larger inputs with visible D-pad focus rings, a
  preferred focus on *Choose File*, and scaled-up buttons and dialogs.
- TV typography now binds Rubik weight-specific families; palette is theme-aware
  with pitch-black dynamic accents.
- Expo packages bumped to the SDK 54 expected patch versions.

---

## [1.4.2] — 2026-07-02

- F-Droid build gating (`PRYSM_FDROID`) and `app.config.js` resolution fix.
- HLS AES-128 DRM fix.
- Added `android.versionCode` (F-Droid requires a real integer).
- Settings now reads the app version dynamically via `expo-application`.

---

## [1.4.1] / [1.4.0]

- Playlist management: multiple saved playlists, edit, delete, auto-refresh.
- Network stream player with custom headers, User-Agent presets and DRM config.
- In-app APK updater.

---

## [1.3.x] and earlier

- Initial public releases: M3U loading from URL/file, categories, search,
  favorites, adaptive streaming (HLS/DASH/MSS), quality selection, and the
  Android TV remote experience.

[1.8.0]: https://github.com/ali-mpb1377/safetv/releases/tag/v1.8.0
[1.7.5]: https://github.com/ali-mpb1377/safetv/releases/tag/v1.7.5
[1.7.4]: https://github.com/ali-mpb1377/safetv/releases/tag/v1.7.4
[1.7.3]: https://github.com/ali-mpb1377/safetv/releases/tag/v1.7.3
[1.7.2]: https://github.com/ali-mpb1377/safetv/releases/tag/v1.7.2
[1.7.1]: https://github.com/ali-mpb1377/safetv/releases/tag/v1.7.1
[1.7.0]: https://github.com/ali-mpb1377/safetv/releases/tag/v1.7.0
[1.6.0]: https://github.com/ali-mpb1377/safetv/releases/tag/v1.6.0
[1.5.0]: https://github.com/dereferencex/prysm/compare/v1.4.2...v1.5.0
[1.4.2]: https://github.com/dereferencex/prysm/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/dereferencex/prysm/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/dereferencex/prysm/compare/v1.3.1...v1.4.0
