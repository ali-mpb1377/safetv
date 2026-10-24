import { useCallback, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { usePinLock } from "@/context/PinLockContext";
import { Channel } from "@/types/playlist";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Press behaviour for the two-pane channel screens:
 *   - first press on a channel  → plays it in the small preview
 *   - press again (double tap / OK twice) → opens it fullscreen
 * With the channel lock on, the PIN is asked when a channel is first opened
 * for preview; going fullscreen on that same channel does not ask again.
 */
export function useChannelPressFlow() {
  const navigation = useNavigation<NavigationProp>();
  const { isLockActive, requestUnlock } = usePinLock();
  const [previewChannel, setPreviewChannel] = useState<Channel | null>(null);
  const unlockedIdRef = useRef<string | null>(null);
  const busyRef = useRef(false);

  const ensureUnlocked = useCallback(
    async (ch: Channel): Promise<boolean> => {
      if (!isLockActive) return true;
      if (unlockedIdRef.current === ch.id) return true;
      const ok = await requestUnlock("Enter PIN to watch");
      if (ok) unlockedIdRef.current = ch.id;
      return ok;
    },
    [isLockActive, requestUnlock],
  );

  const openFullscreen = useCallback(
    async (ch: Channel) => {
      if (!(await ensureUnlocked(ch))) return;
      if (!Platform.isTV) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate("Player", { channelId: ch.id, pinOk: true });
    },
    [ensureUnlocked, navigation],
  );

  const onChannelPress = useCallback(
    async (ch: Channel) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        if (previewChannel?.id === ch.id) {
          await openFullscreen(ch);
          return;
        }
        if (!(await ensureUnlocked(ch))) return;
        if (!Platform.isTV)
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPreviewChannel(ch);
      } finally {
        busyRef.current = false;
      }
    },
    [previewChannel, openFullscreen, ensureUnlocked],
  );

  const openPreviewFullscreen = useCallback(() => {
    if (previewChannel) openFullscreen(previewChannel);
  }, [previewChannel, openFullscreen]);

  const clearPreview = useCallback(() => setPreviewChannel(null), []);

  return {
    previewChannel,
    onChannelPress,
    openPreviewFullscreen,
    clearPreview,
  };
}
