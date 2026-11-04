import { Platform } from "react-native";
import * as Device from "expo-device";

import { Channel, Playlist } from "@/types/playlist";
import { getDeviceId } from "@/lib/deviceId";

/** Account server. HTTPS only (cleartext is blocked for this domain). */
export const BASE_URL = "https://it.web-gaming.ir";
const SERVER_HOST = "it.web-gaming.ir";
const REQUEST_TIMEOUT_MS = 20000;
/** The channel list is the biggest answer; give slow links more time. */
const CHANNELS_TIMEOUT_MS = 45000;

export const APP_VERSION = "1.8.2";

export type AccountStatus = "active" | "expired" | "suspended";

export interface AccountInfo {
  status: AccountStatus;
  name: string;
  /** Unix seconds, null = unlimited. */
  expires: number | null;
  daysLeft: number | null;
  serverTime: number;
  devices: { used: number; max: number };
  checkIntervalHours: number;
  maxOfflineHours: number;
}

export class ApiError extends Error {
  code: string;
  httpStatus: number;
  retryAfter?: number;
  max?: number;

  constructor(
    code: string,
    message: string,
    httpStatus = 0,
    extra?: { retryAfter?: number; max?: number },
  ) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.retryAfter = extra?.retryAfter;
    this.max = extra?.max;
  }

  get isNetwork() {
    return this.code === "network";
  }
}

const FALLBACK_MESSAGES: Record<string, string> = {
  bad_request: "درخواست نامعتبر است.",
  invalid_credentials: "نام کاربری یا رمز عبور اشتباه است.",
  suspended: "این اشتراک تعلیق شده است.",
  device_blocked: "این دستگاه مسدود شده است.",
  device_limit:
    "ظرفیت دستگاه‌های این اشتراک پر است؛ با پشتیبانی تماس بگیر.",
  too_many_attempts: "تلاش‌های ناموفق زیاد بود؛ چند دقیقه دیگر دوباره امتحان کن.",
  invalid_token: "نشست شما منقضی شده است؛ دوباره وارد شو.",
  expired: "اشتراک شما تمام شده است.",
  network: "ارتباط با سرور برقرار نشد. اینترنت را بررسی کن.",
};

async function request<T>(
  path: string,
  opts: {
    method?: "GET" | "POST";
    body?: unknown;
    token?: string;
    /** Whole-request limit (connect + download + parse). Default 20 s. */
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? REQUEST_TIMEOUT_MS,
  );
  // The timer stays armed until the body has been read too, so a server that
  // stalls halfway through an answer can never leave the app waiting forever.
  try {
    let res: Response;
    try {
      res = await fetch(BASE_URL + path, {
        method: opts.method ?? "GET",
        headers: {
          Accept: "application/json",
          ...(opts.body ? { "Content-Type": "application/json" } : {}),
          ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });
    } catch {
      throw new ApiError("network", FALLBACK_MESSAGES.network);
    }

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (!res.ok) {
      const code: string = json?.error || `http_${res.status}`;
      throw new ApiError(
        code,
        json?.message || FALLBACK_MESSAGES[code] || "خطای ناشناخته از سرور.",
        res.status,
        { retryAfter: json?.retry_after, max: json?.max },
      );
    }
    // Cut off by the timeout while reading the answer: report it as a network
    // error instead of handing `null` to code that expects an object.
    if (json == null && controller.signal.aborted) {
      throw new ApiError("network", FALLBACK_MESSAGES.network);
    }
    return json as T;
  } finally {
    clearTimeout(timer);
  }
}

function parseAccount(j: any): AccountInfo {
  return {
    status: j.status,
    name: j.name ?? "",
    expires: typeof j.expires === "number" ? j.expires : null,
    daysLeft: typeof j.days_left === "number" ? j.days_left : null,
    serverTime: j.server_time,
    devices: {
      used: j.devices?.used ?? 0,
      max: j.devices?.max ?? 0,
    },
    checkIntervalHours: j.check_interval_hours ?? 12,
    maxOfflineHours: j.max_offline_hours ?? 48,
  };
}

/** True if the server is reachable at all (any HTTP answer counts). */
export async function pingServer(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    await fetch(BASE_URL + "/app/v1/status", {
      method: "GET",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiLogin(
  username: string,
  password: string,
): Promise<{ account: AccountInfo; token: string }> {
  const id = await getDeviceId();
  const model = Device.modelName || Device.modelId || Platform.OS;
  const name = [Device.manufacturer, Device.modelName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const j = await request<any>("/app/v1/login", {
    method: "POST",
    body: {
      username,
      password,
      device: {
        id,
        name: name || String(model),
        model: String(model),
        app_version: APP_VERSION,
      },
    },
  });
  return { account: parseAccount(j), token: j.token };
}

export async function apiStatus(token: string): Promise<AccountInfo> {
  return parseAccount(await request<any>("/app/v1/status", { token }));
}

export async function apiLogout(token: string): Promise<void> {
  await request("/app/v1/logout", { method: "POST", token });
}

interface ServerChannel {
  id: string;
  name: string;
  group?: string;
  url: string;
  via_server?: boolean;
  logo?: string;
  tvg_id?: string;
  headers?: Record<string, string>;
}

/** Fetches the channel list and converts it into the app's Playlist shape. */
export async function apiChannels(token: string): Promise<Playlist> {
  const j = await request<{
    groups?: { name: string; count: number }[];
    channels: ServerChannel[];
  }>("/app/v1/channels", { token, timeoutMs: CHANNELS_TIMEOUT_MS });

  const channels: Channel[] = (j.channels ?? []).map((c) => ({
    id: String(c.id),
    name: c.name,
    url: c.url,
    group: c.group ?? "",
    logo: c.logo || undefined,
    tvgId: c.tvg_id || undefined,
    // Direct streams only: custom headers. Server streams get the account
    // token at play time (see buildStreamHeaders) and never store it here.
    headers: c.via_server ? undefined : c.headers,
    viaServer: c.via_server === true,
    isLive: true,
  }));

  // Order comes from the server; do not sort.
  const categories =
    j.groups?.map((g) => g.name) ??
    Array.from(new Set(channels.map((c) => c.group)));

  return {
    id: "server",
    name: "SafeTV",
    channels,
    categories,
    lastUpdated: Date.now(),
  };
}

function streamHost(url: string): string {
  // Plain regex instead of `new URL()`: React Native's URL class can throw on
  // `.hostname`, which would silently drop the token.
  const m = /^https?:\/\/(?:[^@/]*@)?([^/:?#]+)/i.exec(url);
  return m ? m[1].toLowerCase() : "";
}

/**
 * Address to play. Streams served by the account server carry the device
 * token as `?key=` (the server accepts it there, and rewrites every HLS
 * segment link with it too). That works in every player, including VLC, which
 * cannot send custom request headers. Direct streams are returned unchanged,
 * and the token is never added for any other host.
 */
export function buildStreamUrl(
  channel: Pick<Channel, "url" | "viaServer">,
  token: string | null,
): string {
  if (!channel.viaServer || !token) return channel.url;
  if (streamHost(channel.url) !== SERVER_HOST) return channel.url;
  const sep = channel.url.includes("?") ? "&" : "?";
  return `${channel.url}${sep}key=${encodeURIComponent(token)}`;
}

/**
 * Extra request headers for playing a channel.
 *  - via_server=true  -> none (the token is in the address, see above).
 *  - via_server=false -> only the headers the server listed for that channel.
 */
export function buildStreamHeaders(
  channel: Pick<Channel, "url" | "headers" | "viaServer">,
): Record<string, string> | undefined {
  if (channel.viaServer) return undefined;
  return channel.headers && Object.keys(channel.headers).length > 0
    ? channel.headers
    : undefined;
}
