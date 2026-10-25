import { Platform } from "react-native";

// SafeTV brand accent (teal-green from the logo). Variable names kept so the
// rest of the file and any imports stay untouched.
const primaryCyan = "#52E0B0";
const primaryCyanLight = "#8BF0CF";

export const Colors = {
  light: {
    text: "#1F2937",
    textSecondary: "#6B7280",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#0E9F77",
    link: "#0E9F77",
    primary: "#0E9F77",
    primaryLight: "#34C79B",
    backgroundRoot: "#F9FAFB",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F3F4F6",
    backgroundTertiary: "#E5E7EB",
    success: "#10B981",
    error: "#EF4444",
    overlay: "rgba(0,0,0,0.4)",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#9AA3C0",
    buttonText: "#0B0E1A",
    tabIconDefault: "#6B7280",
    tabIconSelected: primaryCyan,
    link: primaryCyan,
    primary: primaryCyan,
    primaryLight: primaryCyanLight,
    backgroundRoot: "#0B0E1A",
    backgroundDefault: "#121730",
    backgroundSecondary: "#1A2040",
    backgroundTertiary: "#262D55",
    success: "#10B981",
    error: "#EF4444",
    overlay: "rgba(0,0,0,0.6)",
  },
  pitchblack: {
    text: "#FFFFFF",
    textSecondary: "#8A8F98",
    buttonText: "#0B0E1A",
    tabIconDefault: "#5B6068",
    tabIconSelected: primaryCyan,
    link: primaryCyan,
    primary: primaryCyan,
    primaryLight: primaryCyanLight,
    backgroundRoot: "#000000",
    backgroundDefault: "#050507",
    backgroundSecondary: "#0E1226",
    backgroundTertiary: "#1A2040",
    success: "#10B981",
    error: "#EF4444",
    overlay: "rgba(0,0,0,0.75)",
  },
};

/** Convert a #RRGGBB hex color to an rgba() string with the given opacity. */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    fontFamily: "Rubik_700Bold",
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700" as const,
    fontFamily: "Rubik_700Bold",
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600" as const,
    fontFamily: "Rubik_600SemiBold",
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600" as const,
    fontFamily: "Rubik_600SemiBold",
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    fontFamily: "Rubik_400Regular",
  },
  small: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500" as const,
    fontFamily: "Rubik_500Medium",
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    fontFamily: "Rubik_400Regular",
    letterSpacing: 0.35,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    fontFamily: "Rubik_400Regular",
  },
};

/** Map a UI "weight role" to the exact bundled Rubik family so every weight
 * actually renders (Rubik ships as separate per-weight files — never rely on
 * the synthetic fontWeight fallback, it silently renders 400). */
export const RubikFamilies = {
  regular: "Rubik_400Regular",
  medium: "Rubik_500Medium",
  semibold: "Rubik_600SemiBold",
  bold: "Rubik_700Bold",
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

/** SafeTV home-screen tile gradients (start → end), matching the brand look. */
export const BrandGradients = {
  live: ["#52B8A0", "#3A4BAE", "#2A1AAA"],
  movies: ["#C2255C", "#D9694A", "#DDA73C"],
  series: ["#7B2C9E", "#5560BD", "#3B87D0"],
  utility: ["#1F6B53", "#1B5A47"],
} as const;
