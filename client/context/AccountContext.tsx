import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";

import { usePlaylist } from "@/context/PlaylistContext";
import {
  AccountInfo,
  ApiError,
  apiChannels,
  apiLogin,
  apiLogout,
  apiStatus,
  pingServer,
} from "@/lib/api";
import { secureGet, secureRemove, secureSet } from "@/lib/secureToken";

/**
 * App flow (everything is decided by the server):
 *   boot    - loading screen: connection test, account check, channel list
 *   login   - no (valid) token: username / password screen
 *   blocked - subscription expired / suspended / device blocked: no content
 *   offline - server unreachable (or offline grace used up)
 *   ready   - active account, channels loaded: the normal app
 */
export type Phase = "boot" | "login" | "blocked" | "offline" | "ready";
export type BootStep = "connection" | "account" | "channels";
export type BlockReason = "expired" | "suspended" | "device_blocked";

const TOKEN_KEY = "account_token";
const META_KEY = "safetv_account_meta";
const MIN_BOOT_MS = 1100;
const FOREGROUND_RECHECK_MS = 60 * 1000;
const CHANNELS_REFRESH_MS = 6 * 60 * 60 * 1000;

interface OkMeta {
  serverTime: number;
  wall: number;
  uptime: number | null;
}

interface LoginResult {
  ok: boolean;
  error?: string;
  code?: string;
  retryAfter?: number;
}

interface AccountContextType {
  phase: Phase;
  bootStep: BootStep;
  account: AccountInfo | null;
  blockReason: BlockReason | null;
  /** Message shown on the login screen (e.g. session ended). */
  loginNotice: string | null;
  offlineMessage: string | null;
  /** Epoch ms until which login is disabled (too many attempts). */
  lockUntil: number;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  /** "Check again" button / manual re-check. */
  recheck: () => Promise<void>;
  /** Re-download the channel list from the server. */
  refreshChannels: () => Promise<void>;
  /** The account token, for authenticated stream requests. Never display it. */
  getToken: () => string | null;
  /** Call when playback was rejected (403): re-checks the subscription. */
  reportPlaybackForbidden: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function currentUptime(): Promise<number | null> {
  try {
    return await Device.getUptimeAsync();
  } catch {
    return null;
  }
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { isLoading: storageLoading, setServerPlaylist } = usePlaylist();

  const [phase, setPhase] = useState<Phase>("boot");
  const [bootStep, setBootStep] = useState<BootStep>("connection");
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [blockReason, setBlockReason] = useState<BlockReason | null>(null);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
  const [lockUntil, setLockUntil] = useState(0);

  const tokenRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("boot");
  const accountRef = useRef<AccountInfo | null>(null);
  const lastCheckRef = useRef(0);
  const lastChannelsRef = useRef(0);
  const checkingRef = useRef(false);
  const setServerPlaylistRef = useRef(setServerPlaylist);
  setServerPlaylistRef.current = setServerPlaylist;

  const go = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const setAcc = useCallback((a: AccountInfo | null) => {
    accountRef.current = a;
    setAccount(a);
  }, []);

  // ── offline grace ────────────────────────────────────────────────────────
  const saveOk = useCallback(async (acc: AccountInfo) => {
    const meta: OkMeta = {
      serverTime: acc.serverTime,
      wall: Date.now(),
      uptime: await currentUptime(),
    };
    try {
      await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch {}
  }, []);

  /** May we keep working without a fresh /status? Only within the grace
   *  period, and only if the elapsed time can be trusted (clock not moved
   *  back, device not rebooted since the last good check). */
  const offlineAllowed = useCallback(async (maxHours: number) => {
    try {
      const raw = await AsyncStorage.getItem(META_KEY);
      if (!raw) return false;
      const meta: OkMeta = JSON.parse(raw);
      const wallDelta = Date.now() - meta.wall;
      const uptimeNow = await currentUptime();
      if (wallDelta < 0) return false; // clock moved back
      let elapsed = wallDelta;
      if (meta.uptime !== null && uptimeNow !== null) {
        if (uptimeNow < meta.uptime) return false; // rebooted: unknown
        elapsed = Math.max(wallDelta, uptimeNow - meta.uptime);
      }
      return elapsed < maxHours * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }, []);

  // ── state helpers ────────────────────────────────────────────────────────
  const wipeContent = useCallback(() => {
    setServerPlaylistRef.current(null);
  }, []);

  const clearSession = useCallback(async () => {
    tokenRef.current = null;
    await secureRemove(TOKEN_KEY);
    try {
      await AsyncStorage.removeItem(META_KEY);
    } catch {}
    wipeContent();
    setAcc(null);
    setBlockReason(null);
  }, [setAcc, wipeContent]);

  const applyInactive = useCallback(
    (reason: BlockReason, acc?: AccountInfo | null) => {
      wipeContent();
      if (acc) setAcc(acc);
      setBlockReason(reason);
      go("blocked");
    },
    [go, setAcc, wipeContent],
  );

  const loadChannels = useCallback(
    async (token: string) => {
      const pl = await apiChannels(token);
      setServerPlaylistRef.current(pl);
      lastChannelsRef.current = Date.now();
    },
    [],
  );

  /** Maps an API error to the right screen. Returns true when handled. */
  const handleApiError = useCallback(
    async (e: unknown, mode: "boot" | "foreground" | "manual") => {
      const err =
        e instanceof ApiError
          ? e
          : new ApiError("network", "ارتباط با سرور برقرار نشد.");

      if (err.code === "invalid_token") {
        await clearSession();
        setLoginNotice(err.message);
        go("login");
        return;
      }
      if (err.code === "device_blocked") {
        applyInactive("device_blocked");
        return;
      }
      if (err.code === "expired" || err.code === "suspended") {
        applyInactive(err.code);
        return;
      }
      if (err.isNetwork || err.httpStatus >= 500) {
        const maxHours = accountRef.current?.maxOfflineHours ?? 48;
        if (mode === "foreground" && phaseRef.current === "ready") {
          if (await offlineAllowed(maxHours)) return; // still inside grace
        }
        wipeContent();
        setOfflineMessage(
          mode === "foreground"
            ? "برای ادامه به اینترنت وصل شو."
            : "ارتباط با سرور برقرار نشد. اینترنت را بررسی کن و دوباره امتحان کن.",
        );
        go("offline");
        return;
      }
      // Unknown server error: show it on the offline/retry screen.
      wipeContent();
      setOfflineMessage(err.message);
      go("offline");
    },
    [applyInactive, clearSession, go, offlineAllowed, wipeContent],
  );

  /**
   * The one check routine.
   *  boot       - first launch of the app (loading screen steps)
   *  foreground - app came back / periodic timer (silent)
   *  manual     - user pressed "check again"
   */
  const runCheck = useCallback(
    async (mode: "boot" | "foreground" | "manual") => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const token = tokenRef.current;
        if (!token) {
          go("login");
          return;
        }
        if (mode === "boot") setBootStep("account");

        let acc: AccountInfo;
        try {
          acc = await apiStatus(token);
        } catch (e) {
          await handleApiError(e, mode);
          return;
        }
        lastCheckRef.current = Date.now();
        setAcc(acc);

        if (acc.status !== "active") {
          applyInactive(acc.status, acc);
          return;
        }

        await saveOk(acc);

        const needChannels =
          mode !== "foreground" ||
          phaseRef.current !== "ready" ||
          Date.now() - lastChannelsRef.current > CHANNELS_REFRESH_MS;
        if (needChannels) {
          if (mode === "boot") setBootStep("channels");
          try {
            await loadChannels(token);
          } catch (e) {
            await handleApiError(e, mode);
            return;
          }
        }
        setBlockReason(null);
        setOfflineMessage(null);
        go("ready");
      } finally {
        checkingRef.current = false;
      }
    },
    [applyInactive, go, handleApiError, loadChannels, saveOk, setAcc],
  );

  // ── boot ─────────────────────────────────────────────────────────────────
  const boot = useCallback(async () => {
    go("boot");
    setBootStep("connection");
    const started = Date.now();

    const reachable = await pingServer();
    const wait = async () => {
      const left = MIN_BOOT_MS - (Date.now() - started);
      if (left > 0) await sleep(left);
    };

    if (!reachable) {
      await wait();
      wipeContent();
      setOfflineMessage(
        "ارتباط با سرور برقرار نشد. اینترنت را بررسی کن و دوباره امتحان کن.",
      );
      go("offline");
      return;
    }

    tokenRef.current = await secureGet(TOKEN_KEY);
    if (!tokenRef.current) {
      await wait();
      go("login");
      return;
    }
    await runCheck("boot");
    // Keep the loading screen on for a moment so it never just flashes.
    const left = MIN_BOOT_MS - (Date.now() - started);
    if (left > 0) await sleep(left);
  }, [go, runCheck, wipeContent]);

  useEffect(() => {
    if (storageLoading) return;
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageLoading]);

  // Back to foreground: re-check (the status decides everything).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s !== "active") return;
      const p = phaseRef.current;
      if (p === "boot" || p === "login") return;
      if (Date.now() - lastCheckRef.current < FOREGROUND_RECHECK_MS) return;
      runCheck("foreground");
    });
    return () => sub.remove();
  }, [runCheck]);

  // Periodic re-check while the app stays open (server decides the interval).
  const intervalHours = account?.checkIntervalHours ?? 12;
  useEffect(() => {
    if (phase !== "ready") return;
    const ms = Math.max(1, intervalHours) * 60 * 60 * 1000;
    const t = setInterval(() => runCheck("foreground"), ms);
    return () => clearInterval(t);
  }, [phase, intervalHours, runCheck]);

  // ── public actions ───────────────────────────────────────────────────────
  const login = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      try {
        const { account: acc, token } = await apiLogin(username, password);
        await secureSet(TOKEN_KEY, token);
        tokenRef.current = token;
        setLoginNotice(null);
        setAcc(acc);
        lastCheckRef.current = Date.now();

        if (acc.status !== "active") {
          // Login works for expired accounts: keep the token, show the notice.
          applyInactive(acc.status, acc);
          return { ok: true };
        }
        await saveOk(acc);
        try {
          await loadChannels(token);
        } catch (e) {
          await handleApiError(e, "manual");
          return { ok: true };
        }
        setOfflineMessage(null);
        go("ready");
        return { ok: true };
      } catch (e) {
        const err =
          e instanceof ApiError
            ? e
            : new ApiError("network", "ارتباط با سرور برقرار نشد.");
        if (err.code === "too_many_attempts") {
          const secs = err.retryAfter && err.retryAfter > 0 ? err.retryAfter : 300;
          setLockUntil(Date.now() + secs * 1000);
        }
        return {
          ok: false,
          error: err.message,
          code: err.code,
          retryAfter: err.retryAfter,
        };
      }
    },
    [applyInactive, go, handleApiError, loadChannels, saveOk, setAcc],
  );

  const logout = useCallback(async () => {
    const token = tokenRef.current;
    if (token) {
      try {
        await apiLogout(token);
      } catch {
        // Best effort: local data is wiped either way.
      }
    }
    await clearSession();
    setLoginNotice(null);
    go("login");
  }, [clearSession, go]);

  const recheck = useCallback(async () => {
    if (!tokenRef.current) {
      await boot();
      return;
    }
    go("boot");
    setBootStep("account");
    const started = Date.now();
    await runCheck("manual");
    const left = 700 - (Date.now() - started);
    if (left > 0) await sleep(left);
  }, [boot, go, runCheck]);

  const refreshChannels = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    try {
      const acc = await apiStatus(token);
      setAcc(acc);
      if (acc.status !== "active") {
        applyInactive(acc.status, acc);
        return;
      }
      await saveOk(acc);
      await loadChannels(token);
    } catch (e) {
      await handleApiError(e, "foreground");
    }
  }, [applyInactive, handleApiError, loadChannels, saveOk, setAcc]);

  const getToken = useCallback(() => tokenRef.current, []);

  const reportPlaybackForbidden = useCallback(() => {
    runCheck("foreground");
  }, [runCheck]);

  const value = useMemo(
    () => ({
      phase,
      bootStep,
      account,
      blockReason,
      loginNotice,
      offlineMessage,
      lockUntil,
      login,
      logout,
      recheck,
      refreshChannels,
      getToken,
      reportPlaybackForbidden,
    }),
    [
      phase,
      bootStep,
      account,
      blockReason,
      loginNotice,
      offlineMessage,
      lockUntil,
      login,
      logout,
      recheck,
      refreshChannels,
      getToken,
      reportPlaybackForbidden,
    ],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
