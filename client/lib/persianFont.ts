/**
 * Optional bundled Persian font (Vazirmatn). The two TTF files live in
 * assets/fonts/. If they are not there, nothing breaks: Persian text just
 * uses the system font.
 */
const ctx = (require as any).context(
  "../../assets/fonts",
  false,
  /^\.\/Vazirmatn-(Regular|Bold)\.ttf$/,
);

export const PERSIAN_REGULAR = "Vazirmatn_400Regular";
export const PERSIAN_BOLD = "Vazirmatn_700Bold";

/** Fonts to register with expo-font (empty when the files are missing). */
export const persianFontMap: Record<string, any> = {};
for (const key of ctx.keys() as string[]) {
  if (/Bold/.test(key)) persianFontMap[PERSIAN_BOLD] = ctx(key);
  else if (/Regular/.test(key)) persianFontMap[PERSIAN_REGULAR] = ctx(key);
}

export const PERSIAN_FONT_AVAILABLE =
  PERSIAN_REGULAR in persianFontMap && PERSIAN_BOLD in persianFontMap;

const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function hasPersian(node: unknown): boolean {
  if (typeof node === "string") return ARABIC_SCRIPT.test(node);
  if (Array.isArray(node)) return node.some(hasPersian);
  // Nested <Text> children (e.g. brand names) are checked by their own props.
  return false;
}
