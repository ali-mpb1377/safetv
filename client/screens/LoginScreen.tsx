import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  BackHandler,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { BrandLogo } from "@/components/BrandLogo";
import { TVFocusablePressable } from "@/components/TVFocusablePressable";
import { useAccount } from "@/context/AccountContext";
import { PERSIAN_FONT_AVAILABLE, PERSIAN_REGULAR } from "@/lib/persianFont";


/**
 * Full-screen login. It is a gate: the app cannot be used until a valid
 * account is logged in. The X (top corner) closes the app, since there is
 * nothing to go back to.
 */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = height < 460;
  const { login, loginNotice, lockUntil } = useAccount();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const passwordRef = useRef<TextInput>(null);
  const [focusedField, setFocusedField] = useState<"u" | "p" | null>(null);

  const lockLeft = Math.max(0, Math.ceil((lockUntil - now) / 1000));
  const locked = lockLeft > 0;

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [locked]);

  const submit = async () => {
    if (busy || locked) return;
    if (!username.trim() || !password) {
      setError("نام کاربری و رمز عبور را وارد کن.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await login(username.trim(), password);
    if (!res.ok) {
      setError(res.error ?? "ورود ناموفق بود.");
      setNow(Date.now());
      setBusy(false);
    }
    // On success the gate switches screens, so nothing else to do here.
  };

  const mmss = `${String(Math.floor(lockLeft / 60)).padStart(2, "0")}:${String(
    lockLeft % 60,
  ).padStart(2, "0")}`;

  const cardWidth = Math.min(460, width - 48);

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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { width: cardWidth }]}>
          <View style={styles.logoRow}>
            <BrandLogo size={compact ? 34 : 44} />
          </View>

          <ThemedText type="h4" style={styles.title}>
            ورود به حساب
          </ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            نام کاربری و رمز عبور اشتراک خود را وارد کن
          </ThemedText>

          {loginNotice ? (
            <View style={[styles.banner, styles.bannerInfo]}>
              <Ionicons name="information-circle" size={18} color="#FBBF24" />
              <ThemedText type="small" style={styles.bannerText}>
                {loginNotice}
              </ThemedText>
            </View>
          ) : null}

          <View
            style={[
              styles.field,
              focusedField === "u" && styles.fieldFocused,
            ]}
          >
            <Ionicons name="person-outline" size={20} color="#9AA3C0" />
            <TextInput
              style={styles.input}
              placeholder="نام کاربری"
              placeholderTextColor="#6B7494"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              returnKeyType="next"
              editable={!busy}
              onFocus={() => setFocusedField("u")}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          <View
            style={[
              styles.field,
              focusedField === "p" && styles.fieldFocused,
            ]}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#9AA3C0" />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="رمز عبور"
              placeholderTextColor="#6B7494"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              returnKeyType="go"
              editable={!busy}
              onFocus={() => setFocusedField("p")}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={submit}
            />
            <TVFocusablePressable
              onPress={() => setShowPassword((v) => !v)}
              accessibilityLabel={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
              baseStyle={styles.eyeBtn}
              focusedStyle={styles.eyeBtnFocused}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#9AA3C0"
              />
            </TVFocusablePressable>
          </View>

          {error ? (
            <View style={[styles.banner, styles.bannerError]}>
              <Ionicons name="alert-circle" size={18} color="#F87171" />
              <ThemedText type="small" style={styles.bannerText}>
                {error}
              </ThemedText>
            </View>
          ) : null}

          {locked ? (
            <ThemedText type="small" style={styles.lockText}>
              ورود موقتاً غیرفعال است. زمان باقی‌مانده: {mmss}
            </ThemedText>
          ) : null}

          <TVFocusablePressable
            onPress={submit}
            disabled={busy || locked}
            accessibilityLabel="ورود"
            baseStyle={[
              styles.loginBtn,
              (busy || locked) && styles.loginBtnDisabled,
            ]}
            focusedStyle={styles.loginBtnFocused}
          >
            {busy ? (
              <ActivityIndicator color="#0B0E1A" />
            ) : (
              <ThemedText type="body" style={styles.loginBtnText}>
                ورود
              </ThemedText>
            )}
          </TVFocusablePressable>
        </View>
      </ScrollView>

      {/* X: closes the app (the login cannot be skipped). */}
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
          focusedStyle={styles.closeBtnFocused}
        >
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </TVFocusablePressable>
      </View>
    </BrandBackdrop>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "rgba(18,23,48,0.88)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#262D55",
    padding: 22,
    gap: 10,
  },
  logoRow: { alignItems: "center", marginBottom: 2 },
  title: { color: "#FFFFFF", textAlign: "center", fontWeight: "700" },
  subtitle: {
    color: "#9AA3C0",
    textAlign: "center",
    writingDirection: "rtl",
    marginBottom: 4,
  },
  field: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0F1430",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#262D55",
    paddingHorizontal: 12,
    height: 50,
  },
  fieldFocused: { borderColor: "#52E0B0" },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    ...(PERSIAN_FONT_AVAILABLE ? { fontFamily: PERSIAN_REGULAR } : null),
    textAlign: "right",
    writingDirection: "rtl",
    paddingVertical: 0,
  },
  eyeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  eyeBtnFocused: { borderColor: "#52E0B0" },
  banner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  bannerInfo: { backgroundColor: "rgba(251,191,36,0.12)" },
  bannerError: { backgroundColor: "rgba(248,113,113,0.12)" },
  bannerText: {
    flex: 1,
    color: "#E5E9FF",
    textAlign: "right",
    writingDirection: "rtl",
  },
  lockText: {
    color: "#FBBF24",
    textAlign: "center",
    writingDirection: "rtl",
  },
  loginBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#52E0B0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
    marginTop: 4,
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnFocused: { borderColor: "#FFFFFF" },
  loginBtnText: { color: "#0B0E1A", fontWeight: "800" },
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
  closeBtnFocused: { borderColor: "#FFFFFF" },
});
