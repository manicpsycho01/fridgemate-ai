import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance } from "react-native";
import { AppHeader } from "../../../components/ui/AppHeader";
import { Banner } from "../../../components/ui/Banner";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Chip } from "../../../components/ui/Chip";
import { EmptyState } from "../../../components/ui/EmptyState";
import { FreshnessBadge } from "../../../components/ui/FreshnessBadge";
import { IconButton } from "../../../components/ui/IconButton";
import { ScrollScreen } from "../../../components/ui/Screen";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Stepper } from "../../../components/ui/Stepper";
import { FRIDGE_ITEM_CHIPS } from "../../../constants/chips";
import { useInventory } from "../../../hooks/useInventory";
import { confirm } from "../../../lib/confirm";
import { freshness } from "../../../lib/freshness";
import { success } from "../../../lib/haptics";
import { addInventoryItem, isSingleUnitInventoryItem, normalizeItemName, removeInventoryItem, updateInventoryQuantity } from "../../../lib/inventory";
import { itemEmoji } from "../../../lib/itemEmoji";
import { animateNextLayout } from "../../../lib/layoutAnim";
import { colors, radius, spacing, type } from "../../../theme/tokens";
import type { InventoryItem } from "../../../types";

export default function InventoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ add?: string }>();
  const { items, setItems, loading, refreshing, error, setError, reload, refresh } = useInventory();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const searchRef = useRef<TextInputInstance>(null);

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
      animateNextLayout();
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
    animateNextLayout();
    setItems(optimistic);
    try {
      await action();
    } catch (e) {
      setItems(prev);
      setError(e instanceof Error ? e.message : "Could not update your fridge.");
    }
  }

  async function remove(item: InventoryItem) {
    const ok = await confirm({ title: `Remove ${item.name}?`, message: "It will be taken out of your fridge list.", confirmLabel: "Remove", destructive: true });
    if (ok) await mutate(items.filter((i) => i.id !== item.id), () => removeInventoryItem(item.id));
  }

  function setQuantity(item: InventoryItem, next: number) {
    if (next < 1) return void remove(item);
    void mutate(items.map((i) => (i.id === item.id ? { ...i, quantity: next } : i)), () => updateInventoryQuantity(item.id, next));
  }

  const subtitle = loading ? undefined : items.length === 0 ? "Nothing here yet" : `${items.length} ${items.length === 1 ? "item" : "items"} · sorted by what to use first`;

  return (
    <ScrollScreen refreshing={refreshing} onRefresh={() => void refresh()}>
      <AppHeader title="Your fridge" subtitle={subtitle} />

      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            ref={searchRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search or add an item"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            returnKeyType="done"
            autoCorrect={false}
            onSubmitEditing={() => canAddQuery && void addItem(query)}
            accessibilityLabel="Search or add an item"
          />
          {query ? <IconButton icon="close-circle" label="Clear search" tone="plain" size={18} onPress={() => setQuery("")} style={styles.clear} /> : null}
        </View>
        {canAddQuery ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void addItem(query)}
            disabled={!!adding}
            style={({ pressed }) => [styles.addRow, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="add-circle" size={22} color={colors.primary} />
            <Text style={styles.addRowText} numberOfLines={1}>
              {adding ? "Adding…" : `Add “${query.trim()}” to your fridge`}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Banner message={error} action="Retry" onAction={() => void reload()} /> : null}

      {loading ? (
        <Card style={{ gap: spacing.md }}>
          {[0, 1, 2, 3].map((k) => (
            <View key={k} style={styles.skelRow}>
              <Skeleton width={44} height={44} rounded={22} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="50%" />
                <Skeleton width="30%" height={12} />
              </View>
            </View>
          ))}
        </Card>
      ) : items.length === 0 ? (
        <EmptyState title="No items yet" message="Scan your fridge or tap a suggestion below to start tracking what you have.">
          <Button label="Scan my fridge" icon="scan-outline" onPress={() => router.push("/(app)/(tabs)/scan")} />
        </EmptyState>
      ) : rows.length === 0 ? (
        <Text style={styles.noMatch}>No items match “{query.trim()}”.</Text>
      ) : (
        <Card padded={false}>
          {rows.map(({ item, fresh }, idx) => (
            <View key={item.id} style={[styles.row, idx > 0 && styles.divider]}>
              <View style={styles.emojiWrap}>
                <Text style={styles.emoji}>{itemEmoji(item.name)}</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <FreshnessBadge freshness={fresh} />
              </View>
              {isSingleUnitInventoryItem(item.name) ? null : <Stepper value={item.quantity} label={item.name} onChange={(n) => setQuantity(item, n)} />}
              <IconButton icon="trash-outline" label={`Remove ${item.name}`} tone="plain" size={19} onPress={() => void remove(item)} />
            </View>
          ))}
        </Card>
      )}

      {!loading && suggestions.length > 0 ? (
        <View>
          <SectionHeader title="Quick add" />
          <View style={styles.chips}>
            {suggestions.map((s) => (
              <Chip key={s} leading={itemEmoji(s)} label={s} trailingIcon="add" disabled={adding === s} onPress={() => void addItem(s)} />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { gap: spacing.xs },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 48,
    paddingLeft: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, ...type.body, color: colors.textPrimary, paddingVertical: spacing.sm, outlineStyle: "none" } as object,
  clear: { width: 40, height: 40 },
  addRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: 44, paddingHorizontal: spacing.xxs },
  addRowText: { ...type.body, fontWeight: "600", color: colors.primary, flex: 1 },
  noMatch: { ...type.subhead, color: colors.textSecondary, textAlign: "center" },
  skelRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.xxs, paddingVertical: spacing.sm, minHeight: 68 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  emojiWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 22 },
  rowText: { flex: 1, minWidth: 0, gap: 4 },
  name: { ...type.headline, color: colors.textPrimary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});
