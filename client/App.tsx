import React, { useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  I18nManager,
} from "react-native";
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
import { persianFontMap } from "@/lib/persianFont";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { PlaylistProvider } from "@/context/PlaylistContext";
import { EpgProvider } from "@/context/EpgContext";
import { PinLockProvider } from "@/context/PinLockContext";
import { AccountProvider, useAccount } from "@/context/AccountContext";
import LoadingScreen from "@/screens/LoadingScreen";
import LoginScreen from "@/screens/LoginScreen";
import AccountStatusScreen from "@/screens/AccountStatusScreen";
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
          <AccountProvider>
            <EpgProvider>
              <PinLockProvider>
                <AccountGate
                  navigationRef={navigationRef}
                  navigationTheme={navigationTheme}
                  onNavigationChange={configureOrientation}
                />
              </PinLockProvider>
            </EpgProvider>
          </AccountProvider>
        </PlaylistProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

/**
 * The app is only reachable with a valid account: loading -> login (no
 * token) -> blocked / offline screens -> the real navigation tree.
 */
function AccountGate({
  navigationRef,
  navigationTheme,
  onNavigationChange,
}: {
  navigationRef: ReturnType<typeof useNavigationContainerRef<RootStackParamList>>;
  navigationTheme: typeof DarkTheme;
  onNavigationChange: () => void;
}) {
  const { phase, bootStep } = useAccount();

  useEffect(() => {
    onNavigationChange();
  }, [phase, onNavigationChange]);

  if (phase === "boot") return <LoadingScreen step={bootStep} />;
  if (phase === "login") return <LoginScreen />;
  if (phase === "blocked" || phase === "offline") {
    return <AccountStatusScreen />;
  }
  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      linking={linking}
      onReady={onNavigationChange}
      onStateChange={onNavigationChange}
    >
      <RootStackNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
    ...persianFontMap,
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

// The whole UI is left-to-right on every device. On a TV set to Persian or
// Arabic, React Native mirrors rows, which put "previous" on the right of
// "play" and made the remote's left / right move the focus the wrong way.
// (Persian text still reads right-to-left by itself.) The stored preference
// takes effect from the next launch; the root `direction` below applies now.
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

const styles = StyleSheet.create({
  root: {
    direction: "ltr",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
    justifyContent: "center",
    alignItems: "center",
  },
});
