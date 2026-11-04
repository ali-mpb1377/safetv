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
  opts?: { loop?: boolean },
) {
  queue = channels;
  looping = !!channels && !!opts?.loop;
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
