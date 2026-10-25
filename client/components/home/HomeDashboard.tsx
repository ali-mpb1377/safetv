import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  Modal,
  useWindowDimensions,
} from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { BrandLogo } from "@/components/BrandLogo";
import { TVFocusablePressable } from "@/components/TVFocusablePressable";
import { useTheme } from "@/hooks/useTheme";
import { getDeviceId } from "@/lib/deviceId";
import { BrandGradients, withAlpha } from "@/constants/theme";

const isTV = Platform.isTV;

type IconName = keyof typeof Ionicons.glyphMap;

export interface HomeDashboardProps {
  onLiveTv: () => void;
  onSeries?: () => void;
  onFavorites: () => void;
  onSearch: () => void;
  onGuide: () => void;
  /** "Add Playlist" tile. */
  onAddPlaylist: () => void;
  onSettings: () => void;
  onRefresh: () => void;
  /** Hide the Guide tile when there is no EPG available. */
  showGuide?: boolean;
}

const SERIES_RE = /series|serie|show|season|tv show/i;

/** Series categories (same rule the TV Series tab uses). */
export function findSeriesCategories(categories: string[]) {
  return categories.filter((c) => SERIES_RE.test(c));
}

// Soft floating squares in the background (static, like the reference design).
const SQUARES = [
  { x: 0.02, y: 0.02, s: 150, o: 0.1, accent: true },
  { x: 0.4, y: 0.1, s: 56, o: 0.05 },
  { x: 0.55, y: 0.18, s: 38, o: 0.05 },
  { x: 0.72, y: 0.3, s: 60, o: 0.05 },
  { x: 0.92, y: 0.5, s: 52, o: 0.05 },
  { x: 0.16, y: 0.78, s: 44, o: 0.05 },
  { x: 0.5, y: 0.82, s: 62, o: 0.05 },
  { x: 0.64, y: 0.9, s: 36, o: 0.04 },
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
            numberOfLines={1}
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
            numberOfLines={1}
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

/** Placeholder for the account / subscription details (filled in later). */
function AccountModal({
  visible,
  deviceId,
  onClose,
}: {
  visible: boolean;
  deviceId: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.accountCard,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.backgroundTertiary,
            },
          ]}
        >
          <Ionicons name="person-circle" size={48} color={theme.primary} />
          <ThemedText type="h4" style={styles.accountTitle}>
            Account
          </ThemedText>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary, textAlign: "center" }}
          >
            Account and subscription details will appear here.
          </ThemedText>
          <View
            style={[styles.accountRow, { borderColor: theme.backgroundTertiary }]}
          >
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Device ID
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: "700", letterSpacing: 1.5 }}>
              {deviceId || "----"}
            </ThemedText>
          </View>
          <TVFocusablePressable
            onPress={onClose}
            hasTVPreferredFocus={isTV}
            accessibilityLabel="Close"
            baseStyle={[styles.closeBtn, { backgroundColor: theme.primary }]}
            focusedStyle={{ transform: [{ scale: 1.04 }] }}
          >
            <ThemedText
              type="body"
              style={{ color: theme.buttonText, fontWeight: "700" }}
            >
              Close
            </ThemedText>
          </TVFocusablePressable>
        </View>
      </View>
    </Modal>
  );
}

export function HomeDashboard({
  onLiveTv,
  onSeries,
  onFavorites,
  onSearch,
  onGuide,
  onAddPlaylist,
  onSettings,
  onRefresh,
  showGuide = true,
}: HomeDashboardProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const compact = height < 460;

  const [now, setNow] = useState(() => new Date());
  const [deviceId, setDeviceId] = useState("");
  const [showAccount, setShowAccount] = useState(false);

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

  // Slot C shows Series when the playlist has it, otherwise Search.
  const slotC = useMemo(
    () =>
      onSeries
        ? { id: "series", label: "Series", icon: "albums" as IconName, fn: onSeries }
        : { id: "search", label: "Search", icon: "search" as IconName, fn: onSearch },
    [onSeries, onSearch],
  );

  const secondary = theme.textSecondary;

  const dateClock = (
    <View style={styles.dateBlock}>
      <View style={styles.dateText}>
        <ThemedText
          type="caption"
          style={[styles.dateLine, { color: secondary }]}
        >
          {weekday}
        </ThemedText>
        <ThemedText
          type="caption"
          style={[styles.dateLine, { color: secondary }]}
        >
          {dayMonth}
        </ThemedText>
      </View>
      <View style={[styles.dateDivider, { backgroundColor: theme.backgroundTertiary }]} />
      <ThemedText type={compact ? "h3" : "h2"} style={styles.clock}>
        {clock}
      </ThemedText>
    </View>
  );

  // Settings is a header icon in landscape/TV and a tile under "Add Playlist"
  // in portrait, so it is never cut off on narrow screens.
  const buttons = (
    <View style={styles.roundRow}>
      <RoundButton
        compact={compact}
        icon="person"
        color="#7C3AED"
        label="Account"
        onPress={() => setShowAccount(true)}
      />
      <RoundButton
        compact={compact}
        icon="refresh"
        color="#2563EB"
        label="Refresh playlist"
        onPress={onRefresh}
      />
      {landscape ? (
        <RoundButton
          compact={compact}
          icon="settings"
          color="#EA580C"
          label="Settings"
          onPress={onSettings}
        />
      ) : null}
    </View>
  );

  const header = landscape ? (
    <View
      style={[
        styles.header,
        { paddingTop: Math.max(insets.top, 12), paddingHorizontal: 28 },
      ]}
    >
      <BrandLogo size={compact ? 32 : 44} />
      <View style={styles.headerRight}>
        {dateClock}
        {buttons}
      </View>
    </View>
  ) : (
    <View
      style={[
        styles.headerPortrait,
        { paddingTop: Math.max(insets.top, 12) + 4, paddingHorizontal: 20 },
      ]}
    >
      <View style={styles.headerPortraitTop}>
        <BrandLogo size={36} />
        {buttons}
      </View>
      <View style={styles.headerPortraitDate}>{dateClock}</View>
    </View>
  );

  const idPanel = (
    <View
      style={[
        styles.idPanel,
        {
          borderColor: theme.backgroundTertiary,
          backgroundColor: withAlpha(theme.backgroundDefault, 0.9),
        },
      ]}
    >
      <Ionicons name="finger-print-outline" size={18} color={secondary} />
      <ThemedText type="caption" style={{ color: secondary, fontSize: 11 }}>
        ID
      </ThemedText>
      <ThemedText type="body" style={styles.idValue}>
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
        id="addplaylist"
        label="Add Playlist"
        icon="add-circle-outline"
        colors={BrandGradients.utility}
        onPress={onAddPlaylist}
        variant="wide"
        compact={compact}
        style={styles.wideTile}
      />
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.backgroundRoot }]}>
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
              backgroundColor: q.accent ? theme.primary : theme.text,
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
                  id="fav"
                  label="Favorites"
                  icon="star"
                  colors={BrandGradients.movies}
                  onPress={onFavorites}
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
          contentContainerStyle={[
            styles.portraitBody,
            { paddingBottom: Math.max(insets.bottom, 12) + 72 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Tile
            id="live"
            label="Live TV"
            icon="tv-outline"
            colors={BrandGradients.live}
            onPress={onLiveTv}
            variant="big"
            preferred
            style={styles.livePortrait}
          />
          <View style={styles.portraitRow}>
            <Tile
              id="fav"
              label="Favorites"
              icon="star"
              colors={BrandGradients.movies}
              onPress={onFavorites}
              variant="big"
              style={styles.portraitTile}
            />
            <Tile
              id={slotC.id}
              label={slotC.label}
              icon={slotC.icon}
              colors={BrandGradients.series}
              onPress={slotC.fn}
              variant="big"
              style={styles.portraitTile}
            />
          </View>
          <View style={styles.portraitRow}>{wideTiles}</View>
          <View style={styles.portraitRow}>
            <Tile
              id="settings"
              label="Settings"
              icon="settings-outline"
              colors={BrandGradients.utility}
              onPress={onSettings}
              variant="wide"
              style={styles.wideTile}
            />
          </View>
        </ScrollView>
      )}

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 12), paddingRight: 20 },
        ]}
        pointerEvents="none"
      >
        {idPanel}
      </View>

      <AccountModal
        visible={showAccount}
        deviceId={deviceId}
        onClose={() => setShowAccount(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 20 },
  headerPortrait: { paddingBottom: 4, gap: 10 },
  headerPortraitTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerPortraitDate: { alignItems: "flex-start" },
  dateBlock: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateText: { alignItems: "flex-end" },
  dateLine: { lineHeight: 15, fontSize: 12 },
  dateDivider: { width: 1, height: 28 },
  clock: { fontWeight: "800" },
  roundRow: { flexDirection: "row", gap: 12 },
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
  wideTile: { flex: 1, minHeight: 56 },

  portraitBody: { padding: 20, gap: 12 },
  livePortrait: { height: 190 },
  portraitRow: { flexDirection: "row", gap: 12 },
  portraitTile: { flex: 1, height: 140 },

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
    paddingHorizontal: 8,
  },
  bigIconWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  wideContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  tileLabel: { color: "#FFFFFF", fontWeight: "700" },
  wideLabel: { flex: 1, textAlign: "center", marginRight: 26 },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "flex-end",
  },
  idPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  idValue: { letterSpacing: 2, fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(5,7,15,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  accountCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  accountTitle: { marginTop: 4 },
  accountRow: {
    alignSelf: "stretch",
    marginTop: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    alignSelf: "stretch",
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
});
