import { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Channel } from "@/types/playlist";
import { setPlaybackQueue } from "@/lib/playbackQueue";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Press behaviour for the two-pane channel screens:
 *   - first press on a channel  -> plays it in the small preview
 *   - press the same channel again (double tap / OK twice) -> fullscreen
 */
export function useChannelPressFlow(
  /** Optional: the list being shown, so the player's next / previous follow it. */
  getQueue?: () => { channels: Channel[]; loop?: boolean } | null,
) {
  const navigation = useNavigation<NavigationProp>();
  const [previewChannel, setPreviewChannel] = useState<Channel | null>(null);

  const openFullscreen = useCallback(
    (ch: Channel) => {
      if (getQueue) {
        const q = getQueue();
        setPlaybackQueue(q ? q.channels : null, { loop: q?.loop });
      }
      navigation.navigate("Player", { channelId: ch.id });
    },
    [navigation, getQueue],
  );

  const onChannelPress = useCallback(
    (ch: Channel) => {
      if (previewChannel?.id === ch.id) {
        openFullscreen(ch);
        return;
      }
      setPreviewChannel(ch);
    },
    [previewChannel, openFullscreen],
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
