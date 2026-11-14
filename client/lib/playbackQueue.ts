import type { Channel } from "@/types/playlist";

/**
 * The channel list the user was browsing when the player was opened (the
 * selected category, search results or favorites, in the order shown). The
 * player's next / previous buttons follow this list instead of the whole
 * playlist. `null` means "the whole playlist".
 *
 * `loop` = true (used for search results): after the last channel, "next" goes
 * back to the first one (and "previous" from the first goes to the last), so
 * the user keeps cycling inside the search result. Without it the player stops
 * at the ends of the list.
 */
let queue: Channel[] | null = null;
let looping = false;

export function setPlaybackQueue(
  channels: Channel[] | null,
  opts?: { loop?: boolean; origin?: string },
) {
  queue = channels;
  looping = !!channels && !!opts?.loop;
  queueOrigin = opts?.origin ?? null;
  lastPlayedId = null;
}

export function getPlaybackQueue(): Channel[] | null {
  return queue;
}

export function isPlaybackQueueLooping(): boolean {
  return looping;
}

/**
 * The channel after / before `currentId` inside `list`. At an end it wraps
 * around when `wrap` is true; otherwise it returns null (stay on the channel).
 * Also returns null if `currentId` is not in the list.
 */
export function stepChannel<T extends { id: string }>(
  list: ReadonlyArray<T>,
  currentId: string,
  direction: "prev" | "next",
  wrap: boolean,
): T | null {
  const i = list.findIndex((ch) => ch.id === currentId);
  if (i === -1) return null;
  if (direction === "prev") {
    if (i > 0) return list[i - 1];
    return wrap ? list[list.length - 1] : null;
  }
  if (i < list.length - 1) return list[i + 1];
  return wrap ? list[0] : null;
}

/**
 * Guard against zapping faster than the player can tear down and build up:
 * every channel change creates a new native player and has to close the old
 * one, which takes a moment (longer while the old channel is still trying to
 * connect). Returns false when the previous switch was less than `minGapMs`
 * ago; the caller should then ignore the key press.
 */
let lastSwitchAt = 0;
export function allowChannelSwitch(
  now: number = Date.now(),
  minGapMs: number = 700,
): boolean {
  if (now - lastSwitchAt < minGapMs) return false;
  lastSwitchAt = now;
  return true;
}

/**
 * Which list opened the player ("live" = the Live TV screen) and the channel the
 * player ended on. The player changes channel with next / previous, so when it
 * is closed the Live TV screen shows THAT channel in its preview, not the one
 * that was opened first.
 */
let queueOrigin: string | null = null;
let lastPlayedId: string | null = null;

export function setLastPlayedChannel(id: string) {
  lastPlayedId = id;
}

/** Returns (and forgets) the last played channel id if `forOrigin` opened the player. */
export function takeLastPlayedChannel(forOrigin: string): string | null {
  const id = lastPlayedId;
  const ok = queueOrigin === forOrigin;
  lastPlayedId = null;
  return ok ? id : null;
}
