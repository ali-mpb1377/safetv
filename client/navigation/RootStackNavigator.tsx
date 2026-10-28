import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import PlayerScreen from "@/screens/PlayerScreen";
import { usePlaylist } from "@/context/PlaylistContext";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  Player: { channelId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
});

export default function RootStackNavigator() {
  const { isLoading } = usePlaylist();
  const screenOptions = useScreenOptions();

  if (isLoading) {
    // Cold start — show a branded loader instead of a black screen while the
    // playlist/storage hydrates.
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4DD0E1" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "fade",
          autoHideHomeIndicator: true,
          navigationBarHidden: true,
        }}
      />
    </Stack.Navigator>
  );
}
