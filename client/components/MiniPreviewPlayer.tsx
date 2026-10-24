import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { usePlaylist } from "@/context/PlaylistContext";
import { useTheme } from "@/hooks/useTheme";
import { Channel } from "@/types/playlist";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  TvPlayerView,
  TvPlayerCommands,
} from "../../modules/tv-player/src/index";

const placeholderImage = require("../../assets/images/placeholder-channel.png");

interface MiniPreviewPlayerProps {
  channel: Channel | null;
  /** Tap on the preview surface (mobile) — used to go fullscreen. */
  onPress?: () => void;
  hint?: string;
}

/**
 * Small live preview used next to the channel list. Reuses the same native
 * player view as the fullscreen player, but without its controls. It only
 * exists while the hosting screen is focused so it never plays underneath
 * the fullscreen player.
 */
export function MiniPreviewPlayer({
  channel,
  onPress,
  hint,
}: MiniPreviewPlayerProps) {
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const { settings } = usePlaylist();
  const viewRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelKey = channel
    ? `${channel.id}|${channel.url}|${settings.playerEngine}`
    : null;

  useEffect(() => {
    if (!channel || !isFocused) return;
    setLoading(true);
    setError(null);
    // The native view needs a moment after mount before it accepts commands.
    const t = setTimeout(() => {
      if (!viewRef.current) return;
      TvPlayerCommands.setPlayerEngine(viewRef, settings.playerEngine);
      TvPlayerCommands.loadSource(viewRef, {
        url: channel.url,
        headers:
          channel.headers && Object.keys(channel.headers).length > 0
            ? channel.headers
            : undefined,
        drmType: channel.drm?.type,
        drmLicenseUrl: channel.drm?.licenseServer,
        drmLicenseKey: channel.drm?.licenseKey,
        drmHeaders: channel.drm?.headers,
        drmPssh: channel.drm?.pssh,
        autoPlay: true,
      });
    }, 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelKey, isFocused]);

  // Free the decoder when the preview goes away.
  useEffect(() => {
    return () => {
      TvPlayerCommands.release(viewRef);
    };
  }, []);

  const handleReady = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback(
    (e: { nativeEvent: { message: string } }) => {
      setLoading(false);
      setError(e.nativeEvent.message || "Stream failed to load");
    },
    [],
  );

  const showPlayer = Boolean(channel) && isFocused;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || !channel}
      focusable={false}
      accessibilityLabel={channel ? `Preview of ${channel.name}` : "Preview"}
      style={[
        styles.box,
        {
          backgroundColor: "#000",
          borderColor: theme.backgroundTertiary,
        },
      ]}
    >
      {showPlayer ? (
        <TvPlayerView
          ref={viewRef}
          style={StyleSheet.absoluteFill as any}
          onReady={handleReady}
          onError={handleError}
          onBufferingChange={(e) => {
            if (e.nativeEvent.isBuffering) setLoading(true);
            else setLoading(false);
          }}
        />
      ) : null}

      {!channel ? (
        <View style={styles.center}>
          <Image
            source={placeholderImage}
            style={styles.placeholder}
            contentFit="contain"
          />
          <ThemedText
            type="caption"
            style={[styles.hint, { color: theme.textSecondary }]}
          >
            {hint ?? "Select a channel to preview"}
          </ThemedText>
        </View>
      ) : null}

      {channel && loading && !error ? (
        <View style={styles.center} pointerEvents="none">
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : null}

      {channel && error ? (
        <View style={styles.center} pointerEvents="none">
          <Ionicons name="alert-circle" size={28} color={theme.error} />
          <ThemedText
            type="caption"
            numberOfLines={2}
            style={[styles.hint, { color: theme.textSecondary }]}
          >
            {error}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    borderWidth: 1,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
  },
  placeholder: { width: 56, height: 56, opacity: 0.4 },
  hint: { marginTop: Spacing.sm, textAlign: "center" },
});
