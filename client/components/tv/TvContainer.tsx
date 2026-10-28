import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Platform,
  StatusBar,
  TVFocusGuideView,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { TvTopNav, TvTabName } from "./TvTopNav";
import { TvLiveTvScreen } from "./TvLiveTvScreen";
import {
  HomeDashboard,
  findSeriesCategories,
} from "@/components/home/HomeDashboard";
import { TvSearchScreen } from "./TvSearchScreen";
import { TvFavoritesScreen } from "./TvFavoritesScreen";
import { EpgGuideView } from "@/components/EpgGuideView";
import SettingsScreen from "@/screens/SettingsScreen";
import { usePlaylist } from "@/context/PlaylistContext";
import { useAccount } from "@/context/AccountContext";
import { useEpg } from "@/context/EpgContext";
import { useTheme } from "@/hooks/useTheme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function TvContainer() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { playlist, settings } = usePlaylist();
  const { refreshChannels } = useAccount();
  const epg = useEpg();

  const [activeTab, setActiveTab] = useState<TvTabName>("Home");

  const handleSelectTab = useCallback((tab: TvTabName) => {
    setActiveTab(tab);
  }, []);

  const hasSeries = useMemo(
    () => findSeriesCategories(playlist?.categories ?? []).length > 0,
    [playlist],
  );
  const guideAvailable = settings.showEpg && Boolean(epg.effectiveUrl);

  // Back from any tab returns to the SafeTV home screen first.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (activeTab !== "Home") {
          setActiveTab("Home");
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [activeTab]),
  );

  const renderActiveContent = () => {
    switch (activeTab) {
      case "Home":
        return (
          <HomeDashboard
            onLiveTv={() => handleSelectTab("Live TV")}
            onSeries={hasSeries ? () => handleSelectTab("Series") : undefined}
            onFavorites={() => handleSelectTab("Favorites")}
            onSearch={() => handleSelectTab("Search")}
            onGuide={() => handleSelectTab("Guide")}
            onSettings={() => handleSelectTab("Settings")}
            onRefresh={() => {
              refreshChannels();
            }}
            showGuide={guideAvailable}
          />
        );
      case "Live TV":
        return <TvLiveTvScreen categoryTypeFilter="all" />;
      case "Favorites":
        return <TvFavoritesScreen />;
      case "Movies":
        return <TvLiveTvScreen categoryTypeFilter="movies" />;
      case "Series":
        return <TvLiveTvScreen categoryTypeFilter="series" />;
      case "Guide":
        return (
          <View style={styles.guideContainer}>
            <EpgGuideView
              channels={playlist?.channels || []}
              getProgramsForChannel={epg.getProgramsForChannel}
              onSelectChannel={(id) =>
                navigation.navigate("Player", { channelId: id })
              }
            />
          </View>
        );
      case "Search":
        return <TvSearchScreen />;
      case "Settings":
        return (
          <View style={styles.settingsContainer}>
            <SettingsScreen embedded />
          </View>
        );
      default:
        return <TvLiveTvScreen categoryTypeFilter="all" />;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.backgroundRoot }]}>
      <StatusBar hidden={Platform.isTV} barStyle="light-content" />

      {/* Top navigation — its own focus row. Left/right moves between tabs;
          down crosses into the content area. */}
      {activeTab !== "Home" ? (
        <TvTopNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          brandTitle="SafeTV"
          theme={theme}
        />
      ) : null}

      {/* Active Tab Screen Content */}
      <View
        style={[
          styles.contentWrapper,
          {
            paddingBottom: activeTab === "Home" ? 0 : Math.max(insets.bottom, 8),
            paddingLeft: Math.max(insets.left, 0),
            paddingRight: Math.max(insets.right, 0),
          },
        ]}
      >
        {/* TVFocusGuide restores focus to the last focused element when a
            player/child screen closes and focus returns to this tab. Keyed by
            tab so autoFocus re-runs on every tab switch — without this, D-pad
            focus can be lost after switching to a freshly mounted screen
            (hasTVPreferredFocus races inside the guide). */}
        <TVFocusGuideView
          key={activeTab}
          autoFocus={Platform.isTV}
          style={styles.focusGuide}
        >
          {renderActiveContent()}
        </TVFocusGuideView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  focusGuide: {
    flex: 1,
  },
  guideContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  settingsContainer: {
    flex: 1,
  },
});
