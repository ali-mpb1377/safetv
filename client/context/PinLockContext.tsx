import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal, View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { TVFocusablePressable } from "@/components/TVFocusablePressable";
import { usePlaylist } from "@/context/PlaylistContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const isTV = Platform.isTV;
const PIN_LENGTH = 4;

type Mode = "verify" | "set";

interface PinRequest {
  mode: Mode;
  title: string;
  resolve: (result: string | boolean | null) => void;
}

interface PinLockContextType {
  /** True when the channel lock is enabled and a PIN has been set. */
  isLockActive: boolean;
  /** Resolves true if the lock is off or the correct PIN was entered. */
  requestUnlock: (title?: string) => Promise<boolean>;
  /** Asks for a new PIN twice. Resolves the PIN, or null if cancelled. */
  requestNewPin: () => Promise<string | null>;
}

const PinLockContext = createContext<PinLockContextType | undefined>(
  undefined,
);

export function PinLockProvider({ children }: { children: React.ReactNode }) {
  const { settings } = usePlaylist();
  const [request, setRequest] = useState<PinRequest | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const isLockActive =
    settings.channelLockEnabled && settings.channelLockPin.length > 0;

  const requestUnlock = useCallback((title = "Enter PIN") => {
    const s = settingsRef.current;
    if (!s.channelLockEnabled || !s.channelLockPin) {
      return Promise.resolve(true);
    }
    return new Promise<boolean>((resolve) => {
      setRequest({
        mode: "verify",
        title,
        resolve: (r) => resolve(r === true),
      });
    });
  }, []);

  const requestNewPin = useCallback(() => {
    return new Promise<string | null>((resolve) => {
      setRequest({
        mode: "set",
        title: "Choose a new PIN",
        resolve: (r) => resolve(typeof r === "string" ? r : null),
      });
    });
  }, []);

  const finish = useCallback(
    (result: string | boolean | null) => {
      request?.resolve(result);
      setRequest(null);
    },
    [request],
  );

  const value = useMemo(
    () => ({ isLockActive, requestUnlock, requestNewPin }),
    [isLockActive, requestUnlock, requestNewPin],
  );

  return (
    <PinLockContext.Provider value={value}>
      {children}
      {request ? (
        <PinPadModal
          mode={request.mode}
          title={request.title}
          correctPin={settings.channelLockPin}
          onDone={finish}
        />
      ) : null}
    </PinLockContext.Provider>
  );
}

export function usePinLock() {
  const ctx = useContext(PinLockContext);
  if (!ctx) throw new Error("usePinLock must be used within PinLockProvider");
  return ctx;
}

// ─── PIN pad ────────────────────────────────────────────────────────────────

function PinPadModal({
  mode,
  title,
  correctPin,
  onDone,
}: {
  mode: Mode;
  title: string;
  correctPin: string;
  onDone: (result: string | boolean | null) => void;
}) {
  const { theme } = useTheme();
  const [digits, setDigits] = useState("");
  const [firstEntry, setFirstEntry] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const heading =
    mode === "set" && firstEntry ? "Confirm your new PIN" : title;

  const submit = useCallback(
    (pin: string) => {
      if (mode === "verify") {
        if (pin === correctPin) {
          onDone(true);
        } else {
          if (!isTV) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setMessage("Wrong PIN, try again");
          setDigits("");
        }
        return;
      }
      // mode === "set"
      if (!firstEntry) {
        setFirstEntry(pin);
        setDigits("");
        setMessage(null);
      } else if (firstEntry === pin) {
        onDone(pin);
      } else {
        setFirstEntry(null);
        setDigits("");
        setMessage("PINs did not match, start again");
      }
    },
    [mode, correctPin, firstEntry, onDone],
  );

  const digitsRef = useRef("");

  const press = useCallback(
    (d: string) => {
      if (digitsRef.current.length >= PIN_LENGTH) return;
      const next = digitsRef.current + d;
      digitsRef.current = next;
      setDigits(next);
      setMessage(null);
      if (next.length === PIN_LENGTH) {
        // Let the last dot render before evaluating.
        setTimeout(() => {
          submit(next);
          // submit() clears the pad on a wrong / first entry.
          digitsRef.current = "";
        }, 80);
      }
    },
    [submit],
  );

  const backspace = useCallback(() => {
    digitsRef.current = digitsRef.current.slice(0, -1);
    setDigits(digitsRef.current);
    setMessage(null);
  }, []);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => onDone(mode === "verify" ? false : null)}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.backgroundTertiary,
            },
          ]}
        >
          <Ionicons name="lock-closed" size={28} color={theme.primary} />
          <ThemedText type="h4" style={styles.heading}>
            {heading}
          </ThemedText>

          <View style={styles.dotsRow}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    borderColor: theme.primary,
                    backgroundColor:
                      i < digits.length ? theme.primary : "transparent",
                  },
                ]}
              />
            ))}
          </View>

          <ThemedText
            type="caption"
            style={[styles.message, { color: theme.error }]}
          >
            {message ?? " "}
          </ThemedText>

          <View style={styles.grid}>
            {keys.map((k, idx) => (
              <Key
                key={k}
                label={k}
                onPress={() => press(k)}
                preferred={idx === 0}
              />
            ))}
            <Key
              icon="close"
              label="Cancel"
              onPress={() => onDone(mode === "verify" ? false : null)}
            />
            <Key label="0" onPress={() => press("0")} />
            <Key icon="backspace-outline" label="Delete" onPress={backspace} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Key({
  label,
  icon,
  onPress,
  preferred,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  preferred?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <TVFocusablePressable
      onPress={onPress}
      hasTVPreferredFocus={isTV && preferred}
      accessibilityLabel={label}
      baseStyle={[styles.key, { backgroundColor: theme.backgroundSecondary }]}
      focusedStyle={{
        backgroundColor: theme.primary + "55",
        borderColor: theme.primary,
      }}
    >
      {icon ? (
        <Ionicons name={icon} size={22} color={theme.text} />
      ) : (
        <ThemedText type="h3">{label}</ThemedText>
      )}
    </TVFocusablePressable>
  );
}

const KEY_SIZE = isTV ? 64 : 68;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5,7,15,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 3 * KEY_SIZE + 4 * Spacing.md + 2 * Spacing.xl,
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  heading: { marginTop: Spacing.sm, textAlign: "center" },
  dotsRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  message: { marginTop: Spacing.sm, marginBottom: Spacing.sm, minHeight: 16 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE - 12,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
});
