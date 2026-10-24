import React, { useCallback } from "react";

import { SettingsRow } from "@/components/SettingsRow";
import { usePlaylist } from "@/context/PlaylistContext";
import { usePinLock } from "@/context/PinLockContext";

/** Settings rows for the channel lock (PIN asked every time a channel opens). */
export function ChannelLockSettings() {
  const { settings, updateSettings } = usePlaylist();
  const { requestUnlock, requestNewPin } = usePinLock();

  const enabled = settings.channelLockEnabled && settings.channelLockPin !== "";

  const handleToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        const pin = await requestNewPin();
        if (pin) {
          await updateSettings({ channelLockEnabled: true, channelLockPin: pin });
        }
      } else {
        const ok = await requestUnlock("Enter PIN to turn off the lock");
        if (ok) {
          await updateSettings({ channelLockEnabled: false, channelLockPin: "" });
        }
      }
    },
    [requestNewPin, requestUnlock, updateSettings],
  );

  const handleChangePin = useCallback(async () => {
    const ok = await requestUnlock("Enter current PIN");
    if (!ok) return;
    const pin = await requestNewPin();
    if (pin) await updateSettings({ channelLockPin: pin });
  }, [requestNewPin, requestUnlock, updateSettings]);

  return (
    <>
      <SettingsRow
        icon="lock-closed"
        title="Channel Lock"
        subtitle="Ask for a PIN every time a channel is opened"
        isToggle
        toggleValue={enabled}
        onToggle={handleToggle}
      />
      {enabled ? (
        <SettingsRow
          icon="key"
          title="Change PIN"
          subtitle="Set a new 4-digit PIN"
          onPress={handleChangePin}
          showChevron
        />
      ) : null}
    </>
  );
}
