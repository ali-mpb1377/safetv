import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
} from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";

interface BrandMarkProps {
  size?: number;
}

/** SafeTV shield + play mark (same artwork as the app icon). */
export function BrandMark({ size = 40 }: BrandMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="bm-g" x1="0.1" y1="0" x2="0.9" y2="1">
          <Stop offset="0" stopColor="#52E0B0" />
          <Stop offset="0.5" stopColor="#3B82F6" />
          <Stop offset="1" stopColor="#9333EA" />
        </LinearGradient>
        <LinearGradient id="bm-g2" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#C9D8FF" />
        </LinearGradient>
      </Defs>
      <Path
        d="M256 28 L452 98 V248 C452 364 372 448 256 492 C140 448 60 364 60 248 V98 Z"
        fill="url(#bm-g)"
      />
      <Path
        d="M256 62 L420 120 V246 C420 342 354 412 256 450 C158 412 92 342 92 246 V120 Z"
        fill="#0B0E1A"
      />
      <Path
        d="M190 168 L190 328 L314 248 Z"
        fill="url(#bm-g2)"
        stroke="url(#bm-g2)"
        strokeWidth={22}
        strokeLinejoin="round"
      />
      <Path
        d="M338 212 A50 50 0 0 1 338 284"
        fill="none"
        stroke="#52E0B0"
        strokeWidth={14}
        strokeLinecap="round"
      />
      <Path
        d="M362 184 A86 86 0 0 1 362 312"
        fill="none"
        stroke="#52E0B0"
        strokeOpacity={0.55}
        strokeWidth={14}
        strokeLinecap="round"
      />
    </Svg>
  );
}

interface BrandLogoProps {
  size?: number;
  showName?: boolean;
}

/** Mark + "SafeTV" wordmark, used in headers. */
export function BrandLogo({ size = 40, showName = true }: BrandLogoProps) {
  return (
    <View style={styles.row}>
      <BrandMark size={size} />
      {showName ? (
        <ThemedText
          type="h3"
          style={[styles.name, { fontSize: Math.round(size * 0.6) }]}
        >
          Safe<ThemedText type="h3" style={[styles.name, styles.nameAccent, { fontSize: Math.round(size * 0.6) }]}>TV</ThemedText>
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontWeight: "800", letterSpacing: -0.3, color: "#FFFFFF" },
  nameAccent: { color: "#52E0B0" },
});
