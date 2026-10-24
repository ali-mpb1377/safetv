import { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Channel } from "@/types/playlist";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Press behaviour for the two-pane channel screens:
 *   - first press on a channel  -> plays it in the small preview
 *   - press the same channel again (double tap / OK twice) -> fullscreen
 */
export function useChannelPressFlow() {
  const navigation = useNavigation<NavigationProp>();
  const [previewChannel, setPreviewChannel] = useState<Channel | null>(null);

  const openFullscreen = useCallback(
    (ch: Channel) => {
      navigation.navigate("Player", { channelId: ch.id });
    },
    [navigation],
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
