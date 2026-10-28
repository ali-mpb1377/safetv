import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  BackHandler,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { BrandMark } from "@/components/BrandLogo";
import { TVFocusablePressable } from "@/components/TVFocusablePressable";
import { useAccount } from "@/context/AccountContext";

const isTV = Platform.isTV;

function formatDate(unix: number | null | undefined): string | null {
  if (!unix) return null;
  const d = new Date(unix * 1000);
  try {
    return d.toLocaleDateString("fa-IR");
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/**
 * Shown instead of the app when the subscription ended, the account or the
 * device is blocked, or the server cannot be reached. No channels, no links.
 */
export default function AccountStatusScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < 460;
  const { phase, blockReason, account, offlineMessage, recheck, logout } =
    useAccount();

  const offline = phase === "offline";

  let icon: keyof typeof Ionicons.glyphMap = "time-outline";
  let color = "#FBBF24";
  let title = "اشتراک شما تمام شده است";
  let detail: string | null = null;

  if (offline) {
    icon = "cloud-offline-outline";
    color = "#60A5FA";
    title = "ارتباط برقرار نیست";
    detail =
      offlineMessage ??
      "ارتباط با سرور برقرار نشد. اینترنت را بررسی کن و دوباره امتحان کن.";
  } else if (blockReason === "suspended") {
    icon = "pause-circle-outline";
    title = "اشتراک شما تعلیق شده است";
    detail = "برای رفع تعلیق با پشتیبانی تماس بگیر.";
  } else if (blockReason === "device_blocked") {
    icon = "ban-outline";
    color = "#F87171";
    title = "این دستگاه مسدود شده است";
    detail = "برای اطلاعات بیشتر با پشتیبانی تماس بگیر.";
  } else {
    const end = formatDate(account?.expires);
    detail = end ? `تاریخ پایان اشتراک: ${end}` : null;
  }

  return (
    <BrandBackdrop>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Math.max(insets.top, 12) + 8,
            paddingBottom: Math.max(insets.bottom, 12) + 8,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <BrandMark size={compact ? 40 : 52} />
          <View style={[styles.iconWrap, { backgroundColor: color + "22" }]}>
            <Ionicons name={icon} size={compact ? 34 : 44} color={color} />
          </View>

          <ThemedText type="h3" style={styles.title}>
            {title}
          </ThemedText>
          {detail ? (
            <ThemedText type="body" style={styles.detail}>
              {detail}
            </ThemedText>
          ) : null}

          <View style={styles.actions}>
            <TVFocusablePressable
              onPress={() => recheck()}
              hasTVPreferredFocus={isTV}
              accessibilityLabel={offline ? "تلاش دوباره" : "بررسی دوباره"}
              baseStyle={styles.primaryBtn}
              focusedStyle={styles.btnFocused}
            >
              <Ionicons name="refresh" size={18} color="#0B0E1A" />
              <ThemedText type="body" style={styles.primaryText}>
                {offline ? "تلاش دوباره" : "بررسی دوباره"}
              </ThemedText>
            </TVFocusablePressable>

            {!offline ? (
              <TVFocusablePressable
                onPress={() => logout()}
                accessibilityLabel="خروج از حساب"
                baseStyle={styles.secondaryBtn}
                focusedStyle={styles.btnFocused}
              >
                <ThemedText type="body" style={styles.secondaryText}>
                  خروج از حساب
                </ThemedText>
              </TVFocusablePressable>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.closeWrap,
          { top: Math.max(insets.top, 12) + 4, right: Math.max(insets.right, 12) + 8 },
        ]}
      >
        <TVFocusablePressable
          onPress={() => BackHandler.exitApp()}
          accessibilityLabel="بستن برنامه"
          baseStyle={styles.closeBtn}
          focusedStyle={styles.btnFocused}
        >
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </TVFocusablePressable>
      </View>
    </BrandBackdrop>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  card: {
    width: 420,
    maxWidth: "92%",
    backgroundColor: "rgba(18,23,48,0.88)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#262D55",
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#FFFFFF", textAlign: "center", fontWeight: "700" },
  detail: {
    color: "#C7CCE6",
    textAlign: "center",
    writingDirection: "rtl",
  },
  actions: { alignSelf: "stretch", gap: 10, marginTop: 8 },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#52E0B0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 3,
    borderColor: "transparent",
  },
  primaryText: { color: "#0B0E1A", fontWeight: "800" },
  secondaryBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  secondaryText: { color: "#E5E9FF" },
  btnFocused: { borderColor: "#FFFFFF" },
  closeWrap: { position: "absolute" },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
});
