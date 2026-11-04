import type { Channel } from "@/types/playlist";

/**
 * Text normalisation for channel search. Lower-cases and unifies the Arabic /
 * Persian letter variants, digits and diacritics, so "کیهان", "كيهان" and
 * "کیـهان" all match, and "می‌خواهم" matches "میخواهم".
 */
export function normalizeSearchText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // harakat, dagger alef, tatweel
    .replace(/[\u200c\u200d]/g, "") // ZWNJ / ZWJ
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .replace(/[أإٱ]/g, "ا")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\s+/g, " ");
}

/**
 * One normalised "name\ngroup" string per channel, built once per playlist so
 * a keystroke does not have to lower-case thousands of names again.
 */
export function buildSearchIndex(
  channels: ReadonlyArray<Pick<Channel, "name" | "group">>,
): string[] {
  return channels.map((c) =>
    normalizeSearchText(`${c.name}\n${c.group ?? ""}`),
  );
}

/**
 * Every channel whose name or group contains ALL the words of the query
 * (any order), in playlist order. Not capped: the caller decides how many to
 * render, and the player's next / previous follow the full list.
 */
export function searchIndexed<T>(
  channels: ReadonlyArray<T>,
  index: ReadonlyArray<string>,
  query: string,
): T[] {
  const q = normalizeSearchText(query).trim();
  if (!q) return [];
  const terms = q.split(" ");
  const out: T[] = [];
  for (let i = 0; i < channels.length; i++) {
    const hay = index[i];
    if (hay === undefined) continue;
    let ok = true;
    for (let t = 0; t < terms.length; t++) {
      if (!hay.includes(terms[t])) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(channels[i]);
  }
  return out;
}
