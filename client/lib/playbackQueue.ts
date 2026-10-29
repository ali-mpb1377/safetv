import { Channel } from "@/types/playlist";

/**
 * The channel list the user was browsing when the player was opened (the
 * selected category, search results or favorites, in the order shown). The
 * player's next / previous buttons follow this list instead of the whole
 * playlist. `null` means "the whole playlist".
 */
let queue: Channel[] | null = null;

export function setPlaybackQueue(channels: Channel[] | null) {
  queue = channels;
}

export function getPlaybackQueue(): Channel[] | null {
  return queue;
}
