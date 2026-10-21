import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Banner } from "../../components/ui/Banner";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { FreoMascot } from "../../components/ui/FreoMascot";
import { IconButton } from "../../components/ui/IconButton";
import { select, success } from "../../lib/haptics";
import { addManyInventoryItems, normalizeItemName } from "../../lib/inventory";
import { itemEmoji } from "../../lib/itemEmoji";
import { animateNextLayout } from "../../lib/layoutAnim";
import { isStringArray, parseJsonParam } from "../../lib/recipeRoute";
import { colors, radius, spacing, type } from "../../theme/tokens";
import type { ConfirmMode } from "../../types";

export default function ConfirmItemsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      animateNextLayout();
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
            <IconButton icon="close" label="Close" onPress={close} />
          </View>
          <View style={styles.hero}>
            <FreoMascot size={88} />
            <Text style={styles.title} accessibilityRole="header">
              Freo found {detected.length} {detected.length === 1 ? "item" : "items"}
            </Text>
            <Text style={styles.subtitle}>Untick anything that's wrong, and add what we missed.</Text>
          </View>

          {error ? <Banner message={error} /> : null}

          <View style={styles.listHead}>
            <Text style={styles.listCount}>{count} selected</Text>
            <Pressable accessibilityRole="button" hitSlop={10} onPress={() => setSelected(allOn ? new Set() : new Set(list))}>
              <Text style={styles.link}>{allOn ? "Select none" : "Select all"}</Text>
            </Pressable>
          </View>

          <View style={styles.list}>
            {list.map((name, idx) => {
              const on = selected.has(name);
              return (
                <Pressable
                  key={name}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={name}
                  onPress={() => toggle(name)}
                  style={({ pressed }) => [styles.row, idx > 0 && styles.divider, pressed && { backgroundColor: colors.surfaceAlt }]}
                >
                  <Text style={styles.emoji}>{itemEmoji(name)}</Text>
                  <Text style={[styles.name, !on && styles.nameOff]}>{name}</Text>
                  <Ionicons name={on ? "checkmark-circle" : "ellipse-outline"} size={26} color={on ? colors.primary : colors.textTertiary} />
                </Pressable>
              );
            })}
          </View>

          <View style={styles.addField}>
            <Ionicons name="add" size={20} color={colors.textTertiary} />
            <TextInput
              value={extra}
              onChangeText={setExtra}
              placeholder="Add something we missed"
              placeholderTextColor={colors.textTertiary}
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
        <Button label={cta} onPress={() => void onSave()} loading={saving} disabled={count === 0} icon={mode === "counter" ? "restaurant-outline" : "checkmark"} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: "center", padding: spacing.lg },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  inner: { width: "100%", maxWidth: 560, alignSelf: "center", gap: spacing.md },
  topBar: { flexDirection: "row", justifyContent: "flex-end" },
  hero: { alignItems: "center", marginTop: -spacing.lg },
  title: { ...type.title1, color: colors.textPrimary, textAlign: "center", marginTop: spacing.xs },
  subtitle: { ...type.subhead, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xxs },
  listHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xs },
  listCount: { ...type.footnote, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.4 },
  link: { ...type.subhead, fontWeight: "600", color: colors.primary },
  list: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 54, paddingHorizontal: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  emoji: { fontSize: 22 },
  name: { ...type.body, fontWeight: "500", color: colors.textPrimary, flex: 1 },
  nameOff: { color: colors.textTertiary },
  addField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 52,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xxs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  addInput: { flex: 1, ...type.body, color: colors.textPrimary, paddingVertical: spacing.sm, outlineStyle: "none" } as object,
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
