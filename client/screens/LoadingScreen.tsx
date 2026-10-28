import React, { useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { BrandMark } from "@/components/BrandLogo";
import { BootStep } from "@/context/AccountContext";

const STEPS: { key: BootStep; label: string }[] = [
  { key: "connection", label: "بررسی ارتباط با سرور" },
  { key: "account", label: "بررسی اکانت" },
  { key: "channels", label: "دریافت کانال‌ها" },
];

/**
 * Start-up screen: animated logo while the connection is tested, the account
 * is checked and the channel list is downloaded.
 */
export default function LoadingScreen({ step }: { step: BootStep }) {
  const { height } = useWindowDimensions();
  const compact = height < 460;
  const logoSize = compact ? 84 : 120;
  const ringSize = logoSize + 40;

  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const loops = [
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [appear, pulse, shimmer, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });
  const BAR_W = 220;
  const barX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAR_W * 0.45, BAR_W],
  });

  const activeIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <BrandBackdrop>
      <Animated.View style={[styles.center, { opacity: appear }]}>
        <View style={{ width: ringSize, height: ringSize }}>
          {/* soft glow */}
          <Animated.View
            style={[
              styles.glow,
              {
                width: ringSize,
                height: ringSize,
                borderRadius: ringSize / 2,
                opacity: glow,
              },
            ]}
          />
          {/* rotating gradient arc */}
          <Animated.View
            style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}
          >
            <Svg width={ringSize} height={ringSize}>
              <Defs>
                <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#52E0B0" />
                  <Stop offset="0.6" stopColor="#3B82F6" />
                  <Stop offset="1" stopColor="#9333EA" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringSize / 2 - 4}
                stroke="url(#ring)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={`${ringSize * 1.6} ${ringSize * 3}`}
                fill="none"
              />
            </Svg>
          </Animated.View>
          {/* logo */}
          <Animated.View
            style={[styles.logoWrap, { transform: [{ scale }] }]}
          >
            <BrandMark size={logoSize} />
          </Animated.View>
        </View>

        <ThemedText type="h2" style={styles.brand}>
          Safe<ThemedText type="h2" style={styles.brandAccent}>TV</ThemedText>
        </ThemedText>

        {/* indeterminate bar */}
        <View style={[styles.barTrack, { width: BAR_W }]}>
          <Animated.View
            style={[styles.barFill, { transform: [{ translateX: barX }] }]}
          />
        </View>

        {/* steps */}
        <View style={styles.steps}>
          {STEPS.map((s, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;
            return (
              <View key={s.key} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    done && styles.stepDotDone,
                    active && styles.stepDotActive,
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={12} color="#0B0E1A" />
                  ) : null}
                </View>
                <ThemedText
                  type="small"
                  style={[
                    styles.stepText,
                    done && styles.stepTextDone,
                    active && styles.stepTextActive,
                  ]}
                >
                  {s.label}
                  {active ? " …" : ""}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </BrandBackdrop>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  glow: {
    position: "absolute",
    backgroundColor: "#3B82F6",
  },
  logoWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#FFFFFF", fontWeight: "800", marginTop: 14 },
  brandAccent: { color: "#52E0B0", fontWeight: "800" },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    marginTop: 16,
  },
  barFill: {
    width: 100,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#52E0B0",
  },
  steps: { marginTop: 18, gap: 8 },
  stepRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    justifyContent: "flex-start",
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { borderColor: "#52E0B0" },
  stepDotDone: { backgroundColor: "#52E0B0", borderColor: "#52E0B0" },
  stepText: { color: "rgba(255,255,255,0.4)", writingDirection: "rtl" },
  stepTextActive: { color: "#FFFFFF" },
  stepTextDone: { color: "rgba(255,255,255,0.75)" },
});
