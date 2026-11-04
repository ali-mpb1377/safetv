import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { TVFocusablePressable } from "@/components/TVFocusablePressable";
import { usePlaylist } from "@/context/PlaylistContext";
import { setPlaybackQueue } from "@/lib/playbackQueue";
import { useTheme } from "@/hooks/useTheme";
import { useFocusScroll } from "@/hooks/useFocusScroll";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Colors, Spacing } from "@/constants/theme";
import { createTvPalette } from "./tvPalette";
import { Channel } from "@/types/playlist";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const placeholderImage = require("../../../assets/images/placeholder-channel.png");

/** Result cards drawn per page; more are added as the user scrolls / focuses near the end. */
const PAGE_SIZE = 40;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function TvSearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { searchChannels } = usePlaylist();
  const [searchQuery, setSearchQuery] = useState("");
  // Search while the user pauses typing, not on every key press.
  const query = useDebouncedValue(searchQuery, 250);
  const pending = searchQuery.trim() !== query.trim();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const resultsScroll = useFocusScroll<string>({ axis: "vertical" });
  const styles = useMemo(() => createStyles(theme), [theme]);
  const c = useMemo(() => createTvPalette(theme), [theme]);

  // ALL matches (the player's next / previous cycle through this whole list)...
  const matches = useMemo(() => searchChannels(query), [searchChannels, query]);
  // ...but only a page of them is drawn at a time: rendering thousands of
  // cards (each with a logo) is what freezes weak TV boxes.
  const results = useMemo(
    () => matches.slice(0, visibleCount),
    [matches, visibleCount],
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  const showMore = useCallback(() => {
    setVisibleCount((n) =>
      n >= matches.length ? n : Math.min(matches.length, n + PAGE_SIZE),
    );
  }, [matches.length]);

  const handleResultsScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      resultsScroll.onScroll(e);
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      if (
        contentOffset.y + layoutMeasurement.height >=
        contentSize.height - 600
      ) {
        showMore();
      }
    },
    [resultsScroll, showMore],
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBarContainer}>
        <Ionicons
          name="search"
          size={22}
          color={c.accent}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search all channels, movies, sports, or genres..."
          placeholderTextColor={c.text40}
          autoFocus={Platform.isTV}
        />
        {searchQuery ? (
          <TVFocusablePressable
            onPress={() => setSearchQuery("")}
            accessibilityLabel="Clear search"
            baseStyle={styles.clearButton}
            focusedStyle={styles.clearButtonFocused}
          >
            <Ionicons name="close-circle" size={20} color={c.text60} />
          </TVFocusablePressable>
        ) : null}
      </View>

      {/* Results */}
      <ScrollView
        ref={resultsScroll.scrollRef}
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsGrid}
        showsVerticalScrollIndicator={false}
        onLayout={resultsScroll.onScrollViewLayout}
        onScroll={handleResultsScroll}
        scrollEventThrottle={64}
      >
        {searchQuery.trim() === "" ? (
          <View style={styles.emptyContainer}>
            <ThemedText type="body" style={styles.emptyText}>
              Type on the keyboard to search channels
            </ThemedText>
          </View>
        ) : matches.length === 0 ? (
          pending ? null : (
            <View style={styles.emptyContainer}>
              <ThemedText type="body" style={styles.emptyText}>
                {`No channels found matching "${searchQuery}"`}
              </ThemedText>
            </View>
          )
        ) : (
          <>
            <View style={styles.countRow}>
              <ThemedText type="caption" style={styles.countText}>
                {`${matches.length} results`}
              </ThemedText>
            </View>
            {results.map((channel, index) => (
              <ChannelResultCard
                key={channel.id}
                channel={channel}
                onPress={() => {
                  // Next / previous in the player cycle through ALL results.
                  setPlaybackQueue(matches, { loop: true });
                  navigation.navigate("Player", { channelId: channel.id });
                }}
                onLayoutItem={(e) => resultsScroll.registerItem(channel.id, e)}
                onFocused={() => {
                  resultsScroll.focusOn(channel.id);
                  if (index >= results.length - 8) showMore();
                }}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ChannelResultCard({
  channel,
  onPress,
  onLayoutItem,
  onFocused,
}: {
  channel: Channel;
  onPress: () => void;
  onLayoutItem: (e: LayoutChangeEvent) => void;
  onFocused: () => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TVFocusablePressable
      onPress={onPress}
      onLayout={onLayoutItem}
      onFocusChange={(f) => {
        if (f) onFocused();
      }}
      accessibilityLabel={channel.name}
      baseStyle={styles.resultCard}
      focusedStyle={styles.resultCardFocused}
    >
      <View style={styles.resultLogoBox}>
        <Image
          source={channel.logo ? { uri: channel.logo } : placeholderImage}
          style={styles.resultLogo}
          contentFit="contain"
          recyclingKey={channel.id}
          cachePolicy="memory-disk"
          transition={0}
        />
      </View>
      <View style={styles.resultInfo}>
        <ThemedText type="body" numberOfLines={1} style={styles.resultName}>
          {channel.name}
        </ThemedText>
        <ThemedText type="caption" numberOfLines={1} style={styles.resultGroup}>
          {channel.group || "All Channels"}
        </ThemedText>
      </View>
    </TVFocusablePressable>
  );
}

function createStyles(theme: typeof Colors.dark) {
  const c = createTvPalette(theme);
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xs,
    },
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.panel,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.border,
      paddingHorizontal: Spacing.md,
      height: 52,
      marginBottom: Spacing.lg,
    },
    searchIcon: {
      marginRight: Spacing.sm,
    },
    searchInput: {
      flex: 1,
      color: c.text,
      fontSize: 16,
      fontWeight: "500",
    },
    clearButton: {
      padding: Spacing.xs,
      borderRadius: 999,
    },
    clearButtonFocused: {
      backgroundColor: c.focusFillStrong,
    },
    resultsScroll: {
      flex: 1,
    },
    resultsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.md,
      paddingBottom: Spacing["3xl"],
    },
    resultCard: {
      width: "23%",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.panel,
      padding: Spacing.sm,
    },
    resultCardFocused: {
      backgroundColor: c.focusFillStrong,
    },
    resultLogoBox: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: c.inset,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.sm,
      padding: 3,
    },
    resultLogo: {
      width: "100%",
      height: "100%",
    },
    resultInfo: {
      flex: 1,
    },
    resultName: {
      color: c.text,
      fontWeight: "700",
    },
    resultGroup: {
      color: c.text50,
      marginTop: 2,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing["3xl"],
      width: "100%",
    },
    emptyText: {
      color: c.text50,
    },
    countRow: {
      width: "100%",
    },
    countText: {
      color: c.text50,
    },
  });
}
