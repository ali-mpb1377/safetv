import React, { useMemo, useState } from "react";
import { Modal, View, ScrollView, StyleSheet, Platform } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { SettingsRow } from "@/components/SettingsRow";
import { TVFocusablePressable } from "@/components/TVFocusablePressable";
import { usePlaylist } from "@/context/PlaylistContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const isTV = Platform.isTV;

/**
 * "Visible Categories" row + modal. Categories are detected from the active
 * playlist; all are visible by default. Turning one off removes it (and its
 * channels) from every channel list in the app.
 */
export function CategoryVisibility() {
  const { theme } = useTheme();
  const {
    fullPlaylist,
    hiddenCategories,
    setCategoryHidden,
    setAllCategoriesHidden,
  } = usePlaylist();
  const [open, setOpen] = useState(false);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ch of fullPlaylist?.channels ?? []) {
      map[ch.group] = (map[ch.group] || 0) + 1;
    }
    return map;
  }, [fullPlaylist]);

  const categories = fullPlaylist?.categories ?? [];
  const hidden = new Set(hiddenCategories);
  const visibleCount = categories.length - hiddenCategories.length;

  return (
    <>
      <SettingsRow
        icon="eye"
        title="Visible Categories"
        subtitle={
          categories.length === 0
            ? "No playlist loaded"
            : `${visibleCount} of ${categories.length} categories shown`
        }
        onPress={() => setOpen(true)}
        disabled={categories.length === 0}
        showChevron
      />

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
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
            <ThemedText type="h4">Visible Categories</ThemedText>
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary, marginTop: 2 }}
            >
              Turn a category off to hide it from the channels section.
            </ThemedText>

            <View style={styles.actions}>
              <TVFocusablePressable
                onPress={() => setAllCategoriesHidden(false)}
                hasTVPreferredFocus={isTV}
                accessibilityLabel="Show all categories"
                baseStyle={[
                  styles.actionBtn,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                focusedStyle={{ backgroundColor: theme.primary + "55" }}
              >
                <ThemedText type="small">Show all</ThemedText>
              </TVFocusablePressable>
              <TVFocusablePressable
                onPress={() => setAllCategoriesHidden(true)}
                accessibilityLabel="Hide all categories"
                baseStyle={[
                  styles.actionBtn,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                focusedStyle={{ backgroundColor: theme.primary + "55" }}
              >
                <ThemedText type="small">Hide all</ThemedText>
              </TVFocusablePressable>
            </View>

            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {categories.map((cat) => (
                <SettingsRow
                  key={cat}
                  icon="folder-open"
                  title={cat}
                  subtitle={`${counts[cat] || 0} channels`}
                  isToggle
                  toggleValue={!hidden.has(cat)}
                  onToggle={(value) => setCategoryHidden(cat, !value)}
                />
              ))}
            </ScrollView>

            <TVFocusablePressable
              onPress={() => setOpen(false)}
              accessibilityLabel="Done"
              baseStyle={[styles.doneBtn, { backgroundColor: theme.primary }]}
              focusedStyle={{ transform: [{ scale: 1.03 }] }}
            >
              <ThemedText type="body" style={{ color: theme.buttonText, fontWeight: "700" }}>
                Done
              </ThemedText>
            </TVFocusablePressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5,7,15,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "88%",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  actions: { flexDirection: "row", gap: Spacing.sm, marginVertical: Spacing.md },
  actionBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  list: { flexGrow: 0 },
  doneBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
});
