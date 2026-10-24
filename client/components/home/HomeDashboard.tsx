import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { BrandLogo } from "@/components/BrandLogo";
import { TVFocusablePressable } from "@/components/TVFocusablePressable";
import { getDeviceId } from "@/lib/deviceId";
import { BrandGradients } from "@/constants/theme";

const isTV = Platform.isTV;

type IconName = keyof typeof Ionicons.glyphMap;

export interface HomeDashboardProps {
  onLiveTv: () => void;
  onMovies?: () => void;
  onSeries?: () => void;
  onFavorites: () => void;
  onSearch: () => void;
  onGuide: () => void;
  onPlaylists: () => void;
  onSettings: () => void;
  onRefresh: () => void;
  /** Hide the Guide tile when the app has no EPG feature on this layout. */
  showGuide?: boolean;
}

const MOVIE_RE = /movie|cinema|film|vod/i;
const SERIES_RE = /series|serie|show|season|tv show/i;

/** Categories that look like Movies / Series (same rules the TV tabs use). */
export function findMediaCategories(categories: string[]) {
  return {
    movies: categories.filter((c) => MOVIE_RE.test(c)),
    series: categories.filter((c) => SERIES_RE.test(c)),
  };
}

// Soft floating squares in the background (static, like the reference design).
const SQUARES = [
  { x: 0.02, y: 0.02, s: 150, o: 0.1, c: "#3A2A8C" },
  { x: 0.4, y: 0.1, s: 56, o: 0.07, c: "#FFFFFF" },
  { x: 0.55, y: 0.18, s: 38, o: 0.06, c: "#FFFFFF" },
  { x: 0.72, y: 0.3, s: 60, o: 0.06, c: "#FFFFFF" },
  { x: 0.92, y: 0.5, s: 52, o: 0.07, c: "#FFFFFF" },
  { x: 0.16, y: 0.78, s: 44, o: 0.06, c: "#FFFFFF" },
  { x: 0.5, y: 0.82, s: 62, o: 0.07, c: "#FFFFFF" },
  { x: 0.64, y: 0.9, s: 36, o: 0.05, c: "#FFFFFF" },
];

function Gradient({ id, colors }: { id: string; colors: readonly string[] }) {
  return (
    <Svg
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <LinearGradient id={id} x1="0.15" y1="0" x2="0.85" y2="1">
          {colors.map((c, i) => (
            <Stop
              key={i}
              offset={colors.length === 1 ? 0 : i / (colors.length - 1)}
              stopColor={c}
            />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

interface TileProps {
  id: string;
  label: string;
  icon: IconName;
  colors: readonly string[];
  onPress: () => void;
  /** Big tiles: icon centered, label at the bottom. Wide tiles: icon + label in a row. */
  variant: "big" | "wide";
  style?: object;
  preferred?: boolean;
  /** Short screens (phone in landscape): smaller icon and label. */
  compact?: boolean;
}

function Tile({
  id,
  label,
  icon,
  colors,
  onPress,
  variant,
  style,
  preferred,
  compact,
}: TileProps) {
  return (
    <TVFocusablePressable
      onPress={onPress}
      hasTVPreferredFocus={isTV && preferred}
      accessibilityLabel={label}
      baseStyle={[styles.tile, style]}
      focusedStyle={styles.tileFocused}
    >
      <Gradient id={`tile-${id}`} colors={colors} />
      {variant === "big" ? (
        <View style={styles.bigContent}>
          <View style={styles.bigIconWrap}>
            <Ionicons
              name={icon}
              size={compact ? 38 : 64}
              color="rgba(255,255,255,0.92)"
            />
          </View>
          <ThemedText
            type={compact ? "small" : "h4"}
            style={styles.tileLabel}
          >
            {label}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.wideContent}>
          <Ionicons
            name={icon}
            size={compact ? 22 : 30}
            color="rgba(255,255,255,0.92)"
          />
          <ThemedText
            type={compact ? "small" : "h4"}
            style={[styles.tileLabel, styles.wideLabel]}
          >
            {label}
          </ThemedText>
        </View>
      )}
    </TVFocusablePressable>
  );
}

function RoundButton({
  icon,
  color,
  label,
  onPress,
  compact,
}: {
  icon: IconName;
  color: string;
  label: string;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <TVFocusablePressable
      onPress={onPress}
      accessibilityLabel={label}
      baseStyle={[
        styles.roundBtn,
        compact && styles.roundBtnCompact,
        { backgroundColor: color },
      ]}
      focusedStyle={styles.roundBtnFocused}
    >
      <Ionicons name={icon} size={compact ? 20 : 24} color="#FFFFFF" />
    </TVFocusablePressable>
  );
}

export function HomeDashboard({
  onLiveTv,
  onMovies,
  onSeries,
  onFavorites,
  onSearch,
  onGuide,
  onPlaylists,
  onSettings,
  onRefresh,
  showGuide = true,
}: HomeDashboardProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const compact = height < 460;

  const [now, setNow] = useState(() => new Date());
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    getDeviceId().then((id) => {
      if (alive) setDeviceId(id);
    });
    return () => {
      alive = false;
    };
  }, []);

  const weekday = now.toLocaleDateString("en-GB", { weekday: "long" });
  const dayMonth = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
  const clock = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Slots B and C show Movies / Series when the playlist has them, otherwise
  // Favorites / Search so the layout stays full with features that exist.
  const slotB = useMemo(
    () =>
      onMovies
        ? { id: "movies", label: "Movies", icon: "film" as IconName, fn: onMovies }
        : { id: "fav", label: "Favorites", icon: "star" as IconName, fn: onFavorites },
    [onMovies, onFavorites],
  );
  const slotC = useMemo(
    () =>
      onSeries
        ? { id: "series", label: "Series", icon: "albums" as IconName, fn: onSeries }
        : { id: "search", label: "Search", icon: "search" as IconName, fn: onSearch },
    [onSeries, onSearch],
  );

  const header = (
    <View
      style={[
        styles.header,
        { paddingTop: Math.max(insets.top, 12), paddingHorizontal: 28 },
      ]}
    >
      <BrandLogo size={compact ? 32 : landscape ? 44 : 38} />
      <View style={styles.headerRight}>
        <View style={styles.dateBlock}>
          <View style={styles.dateText}>
            <ThemedText type="caption" style={styles.dateLine}>
              {weekday}
            </ThemedText>
            <ThemedText type="caption" style={styles.dateLine}>
              {dayMonth}
            </ThemedText>
          </View>
          <View style={styles.dateDivider} />
          <ThemedText type={compact ? "h3" : "h2"} style={styles.clock}>
            {clock}
          </ThemedText>
        </View>
        <View style={styles.roundRow}>
          <RoundButton
            compact={compact}
            icon="star"
            color="#7C3AED"
            label="Favorites"
            onPress={onFavorites}
          />
          <RoundButton
            compact={compact}
            icon="refresh"
            color="#2563EB"
            label="Refresh playlist"
            onPress={onRefresh}
          />
          <RoundButton
            compact={compact}
            icon="settings"
            color="#EA580C"
            label="Settings"
            onPress={onSettings}
          />
        </View>
      </View>
    </View>
  );

  const idPanel = (
    <View style={styles.macPanel}>
      <Ionicons name="finger-print-outline" size={20} color="#9AA3C0" />
      <ThemedText type="caption" style={styles.macLabel}>
        ID
      </ThemedText>
      <ThemedText type="h4" style={styles.macValue}>
        {deviceId || "----"}
      </ThemedText>
    </View>
  );

  const wideTiles = (
    <>
      {showGuide ? (
        <Tile
          id="guide"
          label="EPG Catch-up"
          icon="calendar-outline"
          colors={BrandGradients.utility}
          onPress={onGuide}
          variant="wide"
          compact={compact}
          style={styles.wideTile}
        />
      ) : null}
      <Tile
        id="playlists"
        label="Playlists"
        icon="albums-outline"
        colors={BrandGradients.utility}
        onPress={onPlaylists}
        variant="wide"
        compact={compact}
        style={styles.wideTile}
      />
    </>
  );

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {SQUARES.map((q, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: q.x * width,
              top: q.y * height,
              width: q.s,
              height: q.s,
              borderRadius: 6,
              backgroundColor: q.c,
              opacity: q.o,
            }}
          />
        ))}
      </View>

      {header}

      {landscape ? (
        <View
          style={[styles.landscapeBody, compact && styles.landscapeBodyCompact]}
        >
          <View style={styles.landscapeGrid}>
            <Tile
              id="live"
              label="Live TV"
              icon="tv-outline"
              colors={BrandGradients.live}
              onPress={onLiveTv}
              variant="big"
              compact={compact}
              preferred
              style={styles.liveTile}
            />
            <View style={styles.rightCol}>
              <View style={styles.rightTop}>
                <Tile
                  id={slotB.id}
                  label={slotB.label}
                  icon={slotB.icon}
                  colors={BrandGradients.movies}
                  onPress={slotB.fn}
                  variant="big"
                  compact={compact}
                  style={styles.topTile}
                />
                <Tile
                  id={slotC.id}
                  label={slotC.label}
                  icon={slotC.icon}
                  colors={BrandGradients.series}
                  onPress={slotC.fn}
                  variant="big"
                  compact={compact}
                  style={styles.topTile}
                />
              </View>
              <View style={styles.rightBottom}>{wideTiles}</View>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.portraitBody}
          showsVerticalScrollIndicator={false}
        >
          <Tile
            id="live"
            label="Live TV"
            icon="tv-outline"
            colors={BrandGradients.live}
            onPress={onLiveTv}
            variant="big"
            compact={compact}
            preferred
            style={styles.livePortrait}
          />
          <View style={styles.portraitRow}>
            <Tile
              id={slotB.id}
              label={slotB.label}
              icon={slotB.icon}
              colors={BrandGradients.movies}
              onPress={slotB.fn}
              variant="big"
              compact={compact}
              style={styles.portraitTile}
            />
            <Tile
              id={slotC.id}
              label={slotC.label}
              icon={slotC.icon}
              colors={BrandGradients.series}
              onPress={slotC.fn}
              variant="big"
              compact={compact}
              style={styles.portraitTile}
            />
          </View>
          <View style={styles.portraitRow}>{wideTiles}</View>
        </ScrollView>
      )}

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 14), paddingRight: 28 },
        ]}
        pointerEvents="none"
      >
        {idPanel}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0E1A" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 20 },
  dateBlock: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateText: { alignItems: "flex-end" },
  dateLine: { color: "#E5E9FF", lineHeight: 15, fontSize: 12 },
  dateDivider: { width: 1, height: 28, backgroundColor: "#4B5275" },
  clock: { color: "#FFFFFF", fontWeight: "800" },
  roundRow: { flexDirection: "row", gap: 14 },
  roundBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  roundBtnCompact: { width: 38, height: 38, borderRadius: 19 },
  roundBtnFocused: { borderColor: "#FFFFFF", transform: [{ scale: 1.08 }] },

  landscapeBody: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 56,
  },
  landscapeBodyCompact: { paddingBottom: 40, paddingHorizontal: 20 },
  landscapeGrid: {
    flexDirection: "row",
    gap: 14,
    maxHeight: 440,
    flex: 1,
  },
  liveTile: { flex: 0.86 },
  rightCol: { flex: 2, gap: 14 },
  rightTop: { flex: 3.4, flexDirection: "row", gap: 14 },
  rightBottom: { flex: 1, flexDirection: "row", gap: 14, minHeight: 48 },
  topTile: { flex: 1 },
  wideTile: { flex: 1 },

  portraitBody: { padding: 20, gap: 12, paddingBottom: 90 },
  livePortrait: { height: 200 },
  portraitRow: { flexDirection: "row", gap: 12 },
  portraitTile: { flex: 1, height: 150 },

  tile: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
  },
  tileFocused: { borderColor: "rgba(255,255,255,0.85)" },
  bigContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  bigIconWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  wideContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 12,
  },
  tileLabel: { color: "#FFFFFF", fontWeight: "700" },
  wideLabel: { flex: 1, textAlign: "center", marginRight: 30 },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "flex-end",
  },
  macPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#262D55",
    backgroundColor: "rgba(18,23,48,0.85)",
  },
  macLabel: { color: "#9AA3C0", fontSize: 11 },
  macValue: { color: "#E5E9FF", letterSpacing: 2, fontWeight: "600" },
});
