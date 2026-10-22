import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActionSheetIOS, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from "react-native-reanimated";
import { AppHeader } from "../../../components/ui/AppHeader";
import { Banner } from "../../../components/ui/Banner";
import { Button } from "../../../components/ui/Button";
import { Chip } from "../../../components/ui/Chip";
import { EmptyState } from "../../../components/ui/EmptyState";
import { FreshnessBadge } from "../../../components/ui/FreshnessBadge";
import { IconButton } from "../../../components/ui/IconButton";
import { IconTile } from "../../../components/ui/IconTile";
import { ScrollScreen } from "../../../components/ui/Screen";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Stepper } from "../../../components/ui/Stepper";
import { Text } from "../../../components/ui/Text";
import { FRIDGE_ITEM_CHIPS } from "../../../constants/chips";
import { useInventory } from "../../../hooks/useInventory";
import { confirm } from "../../../lib/confirm";
import { freshness, type Freshness } from "../../../lib/freshness";
import { success, tap } from "../../../lib/haptics";
import { addInventoryItem, isSingleUnitInventoryItem, normalizeItemName, removeInventoryItem, updateInventoryQuantity } from "../../../lib/inventory";
import { colors, radius, spacing, typo } from "../../../theme/tokens";
import type { InventoryItem } from "../../../types";

type Row = { item: InventoryItem; fresh: Freshness };

export default function InventoryScreen() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const params = useLocalSearchParams<{ add?: string }>();
  const { items, setItems, loading, refreshing, error, setError, reload, refresh } = useInventory();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<TextInput>(null);

  // "Add item" from Home focuses the search/add field.
  useFocusEffect(
    useCallback(() => {
      if (params.add !== "1") return;
      const t = setTimeout(() => searchRef.current?.focus(), 350);
      router.setParams({ add: undefined });
      return () => clearTimeout(t);
    }, [params.add, router])
  );

  const q = normalizeItemName(query);
  const rows = useMemo(
    () =>
      items
        .filter((i) => !q || normalizeItemName(i.name).includes(q))
        .map((i) => ({ item: i, fresh: freshness(i) }))
        .sort((a, b) => a.fresh.daysLeft - b.fresh.daysLeft),
    [items, q]
  );
  const sections = useMemo(
    () =>
      [
        { key: "soon", title: "Use soon", rows: rows.filter((r) => r.fresh.status !== "fresh") },
        { key: "fresh", title: "Fresh", rows: rows.filter((r) => r.fresh.status === "fresh") },
      ].filter((s) => s.rows.length > 0),
    [rows]
  );
  const inStock = useMemo(() => new Set(items.map((i) => normalizeItemName(i.name))), [items]);
  const suggestions = useMemo(() => FRIDGE_ITEM_CHIPS.filter((l) => !inStock.has(normalizeItemName(l)) && (!q || normalizeItemName(l).includes(q))), [inStock, q]);
  const canAddQuery = q.length > 0 && !inStock.has(q);

  async function addItem(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setAdding(trimmed);
    try {
      await addInventoryItem(trimmed, "manual", 1);
      success();
      await reload();
      if (normalizeItemName(trimmed) === q) setQuery("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add that item.");
    } finally {
      setAdding(null);
    }
  }

  async function mutate(optimistic: InventoryItem[], action: () => Promise<void>) {
    const prev = items;
    setItems(optimistic);
    try {
      await action();
    } catch (e) {
      setItems(prev);
      setError(e instanceof Error ? e.message : "Could not update your fridge.");
    }
  }

  const removeNow = (item: InventoryItem) => mutate(items.filter((i) => i.id !== item.id), () => removeInventoryItem(item.id));

  async function remove(item: InventoryItem) {
    const ok = await confirm({ title: `Remove ${item.name}?`, message: "It will be taken out of your fridge list.", confirmLabel: "Remove", destructive: true });
    if (ok) await removeNow(item);
  }

  /** Long-press or "…": an iOS action sheet (itself the confirmation), a confirm dialog elsewhere. */
  function openRowMenu(item: InventoryItem) {
    tap();
    if (Platform.OS !== "ios") return void remove(item);
    ActionSheetIOS.showActionSheetWithOptions(
      { title: item.name, options: ["Remove from fridge", "Cancel"], destructiveButtonIndex: 0, cancelButtonIndex: 1 },
      (i) => {
        if (i === 0) void removeNow(item);
      }
    );
  }

  function setQuantity(item: InventoryItem, next: number) {
    if (next < 1) return void remove(item);
    void mutate(items.map((i) => (i.id === item.id ? { ...i, quantity: next } : i)), () => updateInventoryQuantity(item.id, next));
  }

  const subtitle = loading ? undefined : items.length === 0 ? "Nothing here yet" : `${items.length} ${items.length === 1 ? "item" : "items"}, most urgent first`;

  const searchBar = (
    <View style={styles.searchWrap}>
      <View style={[styles.search, focused && styles.searchFocused]}>
        <Ionicons name="search" size={18} color={focused ? colors.herb : colors.ink3} />
        <TextInput
          ref={searchRef}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search or add an item"
          placeholderTextColor={colors.ink3}
          selectionColor={colors.herb}
          style={styles.searchInput}
          returnKeyType="done"
          autoCorrect={false}
          onSubmitEditing={() => canAddQuery && void addItem(query)}
          accessibilityLabel="Search or add an item"
        />
        {query ? <IconButton icon="close-circle" label="Clear search" tone="plain" size={18} onPress={() => setQuery("")} /> : null}
      </View>
      {canAddQuery ? (
        <Pressable accessibilityRole="button" onPress={() => void addItem(query)} disabled={!!adding} style={({ pressed }) => [styles.addRow, pressed && { opacity: 0.6 }]}>
          <IconTile name={query} size={32} />
          <Text variant="bodyStrong" tone="herb" numberOfLines={1} style={styles.flex}>
            {adding ? "Adding…" : `Add “${query.trim()}”`}
          </Text>
          <Ionicons name="add-circle" size={24} color={colors.herb} />
        </Pressable>
      ) : null}
      {!loading && suggestions.length > 0 && !canAddQuery ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.quickScroll} contentContainerStyle={styles.quick}>
          {suggestions.map((s) => (
            <Chip key={s} food={s} label={s} trailingIcon="add" accessibilityLabel={`Add ${s}`} disabled={adding === s} onPress={() => void addItem(s)} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  return (
    <ScrollScreen refreshing={refreshing} onRefresh={() => void refresh()} header={<AppHeader title="Your fridge" subtitle={subtitle} />} sticky={searchBar}>
      {error ? <Banner message={error} action="Retry" onAction={() => void reload()} /> : null}

      {loading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map((k) => (
            <View key={k} style={styles.skelRow}>
              <Skeleton width={44} height={44} rounded={14} />
              <View style={styles.skelText}>
                <Skeleton width="50%" />
                <Skeleton width="30%" height={12} />
              </View>
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState title="No items yet" message="Scan your fridge, or tap a suggestion above.">
          <Button variant="hero" label="Scan fridge" icon="camera" onPress={() => router.push("/(app)/(tabs)/scan")} />
        </EmptyState>
      ) : rows.length === 0 ? (
        canAddQuery ? null : <Text variant="callout" tone="secondary" center>
          No items match “{query.trim()}”.
        </Text>
      ) : (
        sections.map((s) => (
          <Animated.View key={s.key} layout={reduced ? undefined : LinearTransition.springify().damping(20)}>
            <SectionHeader title={s.title} />
            {s.rows.map((r, idx) => (
              <ItemRow
                key={r.item.id}
                row={r}
                first={idx === 0}
                reduced={reduced}
                onQuantity={(n) => setQuantity(r.item, n)}
                onMenu={() => openRowMenu(r.item)}
              />
            ))}
          </Animated.View>
        ))
      )}
    </ScrollScreen>
  );
}

function ItemRow({ row, first, reduced, onQuantity, onMenu }: { row: Row; first: boolean; reduced: boolean; onQuantity: (n: number) => void; onMenu: () => void }) {
  const { item, fresh } = row;
  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(220)}
      exiting={reduced ? undefined : FadeOut.duration(180)}
      layout={reduced ? undefined : LinearTransition.springify().damping(20)}
    >
      <Pressable
        onLongPress={onMenu}
        delayLongPress={350}
        accessibilityHint="Long press for options"
        style={({ pressed }) => [styles.row, !first && styles.hairline, pressed && { opacity: 0.7 }]}
      >
        <IconTile name={item.name} />
        <View style={styles.rowText}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {item.name}
          </Text>
          <FreshnessBadge freshness={fresh} />
        </View>
        {isSingleUnitInventoryItem(item.name) ? null : <Stepper value={item.quantity} label={item.name} onChange={onQuantity} />}
        <IconButton icon="ellipsis-horizontal" label={`Options for ${item.name}`} tone="plain" size={18} onPress={onMenu} style={styles.more} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchWrap: { gap: spacing.sm },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 52,
    paddingLeft: spacing.md,
    paddingRight: spacing.xxs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  searchFocused: { borderColor: colors.herb },
  searchInput: { flex: 1, ...typo.body, color: colors.ink, paddingVertical: spacing.sm, outlineStyle: "none" } as object,
  addRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 48 },
  quickScroll: { marginHorizontal: -spacing.lg },
  quick: { gap: spacing.xs, paddingHorizontal: spacing.lg },
  list: { gap: spacing.md },
  skelRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  skelText: { flex: 1, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, minHeight: 72 },
  hairline: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  rowText: { flex: 1, minWidth: 0, gap: 6 },
  more: { marginRight: -spacing.sm },
});
