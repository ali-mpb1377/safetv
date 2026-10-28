import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";

/** SafeTV navy background with soft purple / warm glows (matches the home screen). */
export function BrandBackdrop({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <Svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="bb-left" cx="0.04" cy="0.02" rx="0.65" ry="0.75">
            <Stop offset="0" stopColor="#3B2A9A" stopOpacity="0.5" />
            <Stop offset="1" stopColor="#3B2A9A" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="bb-right" cx="0.97" cy="0.04" rx="0.5" ry="0.6">
            <Stop offset="0" stopColor="#8A5A3A" stopOpacity="0.28" />
            <Stop offset="1" stopColor="#8A5A3A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bb-left)" />
        <Rect width="100%" height="100%" fill="url(#bb-right)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0E1A" },
});
