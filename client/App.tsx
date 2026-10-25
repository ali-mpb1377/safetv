import React, { useCallback, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
  LinkingOptions,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as ScreenOrientation from "expo-screen-orientation";
import {
  useFonts,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { PlaylistProvider } from "@/context/PlaylistContext";
import { EpgProvider } from "@/context/EpgContext";
import { PinLockProvider } from "@/context/PinLockContext";
import { ThemeProvider, useThemeContext } from "@/context/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LogCapture } from "@/components/LogCapture";
import { Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

// Deep link config — handles prysmplayer://play?channelId=<id> from the
// Android TV launcher home row tiles.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["prysmplayer://"],
  config: {
    screens: {
      Main: {
        // prysmplayer://favourites → open channels tab
        path: "favourites",
      },
      Player: {
        // prysmplayer://play?channelId=<id> → open player
        path: "play",
        parse: {
          channelId: (id: string) => id,
        },
      },
    },
  },
};

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDark, theme } = useThemeContext();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  // Orientation policy: landscape only on every device. The screen still
  // rotates between the two landscape directions but never goes portrait.
  const configureOrientation = useCallback(async () => {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE,
      );
    } catch (error) {
      console.log("Orientation lock not supported:", error);
    }
  }, []);

  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.backgroundRoot,
          card: theme.backgroundDefault,
          primary: theme.primary,
          text: theme.text,
          border: theme.backgroundSecondary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.backgroundRoot,
          card: theme.backgroundDefault,
          primary: theme.primary,
          text: theme.text,
          border: theme.backgroundSecondary,
        },
      };

  return (
    <GestureHandlerRootView
      style={[styles.root, { backgroundColor: theme.backgroundRoot }]}
    >
      <KeyboardProvider>
        <PlaylistProvider>
          <EpgProvider>
            <PinLockProvider>
              <NavigationContainer
                ref={navigationRef}
                theme={navigationTheme}
                linking={linking}
                onReady={configureOrientation}
                onStateChange={configureOrientation}
              >
                <RootStackNavigator />
              </NavigationContainer>
            </PinLockProvider>
          </EpgProvider>
        </PlaylistProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <LogCapture />
            <AppContent />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
    justifyContent: "center",
    alignItems: "center",
  },
});
