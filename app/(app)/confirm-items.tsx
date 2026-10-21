import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeInDown, LinearTransition, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Banner } from "../../components/ui/Banner";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { FreoMascot } from "../../components/ui/FreoMascot";
import { IconButton } from "../../components/ui/IconButton";
import { IconTile } from "../../components/ui/IconTile";
import { Text } from "../../components/ui/Text";
import { select, success } from "../../lib/haptics";
import { addManyInventoryItems, normalizeItemName } from "../../lib/inventory";
import { isStringArray, parseJsonParam } from "../../lib/recipeRoute";
import { colors, radius, spacing, typo } from "../../theme/tokens";
import type { ConfirmMode } from "../../types";

export default function ConfirmItemsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const params = useLocalSearchParams<{ items?: string; mode?: string }>();
  const mode: ConfirmMode = params.mode === "counter" || params.mode === "receipt" ? params.mode : "fridge";

  const detected = useMemo(() => [...new Set((parseJsonParam(params.items, isStringArray) ?? []).map((s) => s.trim()).filter(Boolean))], [params.items]);
  const [list, setList] = useState(detected);
  const [selected, setSelected] = useState(() => new Set(detected));
  const [extra, setExtra] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/(app)/(tabs)"));

  function toggle(name: string) {
    select();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function addExtra() {
    const name = extra.trim();
    if (!name) return;
    if (!list.some((n) => normalizeItemName(n) === normalizeItemName(name))) {
      setList((l) => [...l, name]);
    }
    setSelected((s) => new Set(s).add(list.find((n) => normalizeItemName(n) === normalizeItemName(name)) ?? name));
    setExtra("");
  }

  async function onSave() {
    const chosen = list.filter((n) => selected.has(n));
    if (chosen.length === 0) return;
    if (mode === "counter") {
      router.dismissTo({ pathname: "/(app)/(tabs)/cook", params: { sessionIngredients: JSON.stringify(chosen) } });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addManyInventoryItems(chosen, mode === "receipt" ? "receipt_scan" : "fridge_scan");
      success();
      router.dismissTo("/(app)/(tabs)/inventory");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (detected.length === 0) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <EmptyState title="Nothing to confirm" message="Go back to Scan and try another photo.">
          <Button label="Back to Scan" onPress={close} />
        </EmptyState>
      </View>
    );
  }

  const count = selected.size;
  const cta = mode === "counter" ? `Find recipes with ${count} ${count === 1 ? "item" : "items"}` : `Add ${count} ${count === 1 ? "item" : "items"} to fridge`;
  const allOn = count === list.length;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: spacing.md }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.inner}>
          <View style={styles.topBar}>
            <FreoMascot size={64} />
            <IconButton icon="close" label="Close" onPress={close} />
          </View>
          <View style={styles.hero}>
            <Text variant="display" accessibilityRole="header">
              Freo found {detected.length} {detected.length === 1 ? "item" : "items"}
            </Text>
            <Text variant="callout" tone="secondary">
              Untick anything that's wrong, and add what we missed.
            </Text>
          </View>

          {error ? <Banner message={error} /> : null}

          <View>
            <View style={styles.listHead}>
              <Text variant="label" tone="secondary" numeric>
                {count} selected
              </Text>
              <Pressable accessibilityRole="button" hitSlop={8} style={styles.link} onPress={() => setSelected(allOn ? new Set() : new Set(list))}>
                <Text variant="calloutStrong" tone="herb">
                  {allOn ? "Select none" : "Select all"}
                </Text>
              </Pressable>
            </View>

            {list.map((name, idx) => {
              const on = selected.has(name);
              return (
                <Animated.View key={name} entering={reduced ? undefined : FadeInDown.springify().damping(18).delay(Math.min(idx, 12) * 40)} layout={reduced ? undefined : LinearTransition}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={name}
                    onPress={() => toggle(name)}
                    style={({ pressed }) => [styles.row, idx > 0 && styles.hairline, pressed && { opacity: 0.6 }]}
                  >
                    <View style={!on && styles.off}>
                      <IconTile name={name} />
                    </View>
                    <Text variant="bodyStrong" tone={on ? "primary" : "tertiary"} style={styles.flex}>
                      {name}
                    </Text>
                    <View style={[styles.check, on && styles.checkOn]}>{on ? <Ionicons name="checkmark" size={18} color={colors.onDark} /> : null}</View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          <View style={styles.addField}>
            <Ionicons name="add" size={20} color={colors.ink3} />
            <TextInput
              value={extra}
              onChangeText={setExtra}
              placeholder="Add something we missed"
              placeholderTextColor={colors.ink3}
              selectionColor={colors.herb}
              style={styles.addInput}
              returnKeyType="done"
              onSubmitEditing={addExtra}
              accessibilityLabel="Add an item we missed"
            />
            {extra.trim() ? <Button label="Add" size="md" variant="secondary" onPress={addExtra} /> : null}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button variant="hero" label={cta} onPress={() => void onSave()} loading={saving} disabled={count === 0} icon={mode === "counter" ? "restaurant-outline" : "checkmark"} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  center: { justifyContent: "center", padding: spacing.lg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  inner: { width: "100%", maxWidth: 560, alignSelf: "center", gap: spacing.lg },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hero: { gap: spacing.xs },
  listHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { minHeight: 44, justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 64, paddingVertical: spacing.xs },
  hairline: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  off: { opacity: 0.4 },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: colors.herb, borderColor: colors.herb },
  addField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 56,
    paddingLeft: spacing.md,
    paddingRight: spacing.xxs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderStyle: "dashed",
  },
  addInput: { flex: 1, ...typo.body, color: colors.ink, paddingVertical: spacing.sm, outlineStyle: "none" } as object,
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
});
