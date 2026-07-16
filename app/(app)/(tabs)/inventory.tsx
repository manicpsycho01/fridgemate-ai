import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Chip } from "../../../components/ui/Chip";
import { ScrollScreen } from "../../../components/ui/Screen";
import { TabScreenHeader } from "../../../components/ui/TabScreenHeader";
import { FRIDGE_ITEM_CHIPS } from "../../../constants/chips";
import {
  addInventoryItem,
  getInventory,
  isSingleUnitInventoryItem,
  normalizeItemName,
  removeInventoryItem,
  updateInventoryQuantity,
} from "../../../lib/inventory";
import { colors, radius, spacing } from "../../../theme/tokens";
import type { InventoryItem } from "../../../types";

function emojiForItem(name: string): string {
  const k = normalizeItemName(name);
  const map: Record<string, string> = {
    milk: "🥛",
    eggs: "🥚",
    bread: "🍞",
    cheese: "🧀",
    yogurt: "🥣",
    chicken: "🍗",
    fish: "🐟",
    butter: "🧈",
    tomatoes: "🍅",
    tomato: "🍅",
    cucumber: "🥒",
    lettuce: "🥬",
    carrot: "🥕",
    apple: "🍎",
    banana: "🍌",
    juice: "🧃",
    cream: "🥛",
    paneer: "🧀",
    spinach: "🥬",
    mushrooms: "🍄",
    "leftover chicken": "🍗",
    "leftover rice": "🍚",
  };
  return map[k] ?? "🧊";
}

function pruneQtyDraftForItems(
  setQtyDraft: Dispatch<SetStateAction<Record<string, string>>>,
  next: InventoryItem[]
) {
  const ids = new Set(next.map((i) => i.id));
  setQtyDraft((d) => {
    const out = { ...d };
    for (const k of Object.keys(out)) {
      if (!ids.has(k)) delete out[k];
    }
    return out;
  });
}

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});
  /** Avoid full-screen spinner on every tab refocus; only first load shows it. */
  const initialInventoryLoadDone = useRef(false);

  const inStock = useMemo(() => new Set(items.map((i) => normalizeItemName(i.name))), [items]);

  const fetchItems = useCallback(async (mode: "initial" | "silent") => {
    if (mode === "initial") setLoading(true);
    setError(null);
    try {
      const next = await getInventory();
      setItems(next);
      if (mode === "silent") {
        pruneQtyDraftForItems(setQtyDraft, next);
      }
      if (mode === "initial") {
        initialInventoryLoadDone.current = true;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load inventory");
    } finally {
      if (mode === "initial") setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const mode = initialInventoryLoadDone.current ? "silent" : "initial";
      void fetchItems(mode);
    }, [fetchItems])
  );

  const q = query.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    if (!q) return items;
    return items.filter((i) => normalizeItemName(i.name).includes(q));
  }, [items, q]);

  const manualSuggestions = useMemo(() => {
    return FRIDGE_ITEM_CHIPS.filter((label) => {
      if (inStock.has(normalizeItemName(label))) return false;
      if (!q) return true;
      return normalizeItemName(label).includes(q);
    });
  }, [inStock, q]);

  async function addFromChip(name: string) {
    setBusy(name);
    setError(null);
    try {
      await addInventoryItem(name, "manual", 1);
      await fetchItems("silent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add item");
    } finally {
      setBusy(null);
    }
  }

  async function increment(item: InventoryItem) {
    if (isSingleUnitInventoryItem(item.name)) return;
    const prev = items;
    const nextQty = item.quantity + 1;
    setItems((s) => s.map((i) => (i.id === item.id ? { ...i, quantity: nextQty } : i)));
    try {
      await updateInventoryQuantity(item.id, nextQty);
    } catch (e) {
      setItems(prev);
      setError(e instanceof Error ? e.message : "Could not update");
    }
  }

  async function decrement(item: InventoryItem) {
    if (isSingleUnitInventoryItem(item.name)) return;
    const prev = items;
    if (item.quantity <= 1) {
      setItems((s) => s.filter((i) => i.id !== item.id));
      setQtyDraft((d) => {
        const n = { ...d };
        delete n[item.id];
        return n;
      });
    } else {
      setItems((s) =>
        s.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
      );
    }
    try {
      await updateInventoryQuantity(item.id, item.quantity - 1);
    } catch (e) {
      setItems(prev);
      setError(e instanceof Error ? e.message : "Could not update");
    }
  }

  async function commitQuantity(item: InventoryItem) {
    if (isSingleUnitInventoryItem(item.name)) return;
    const raw = qtyDraft[item.id];
    if (raw === undefined) return;
    const digits = raw.replace(/\D/g, "");
    const n = parseInt(digits, 10);
    if (!Number.isFinite(n) || n < 1) {
      setQtyDraft((d) => {
        const x = { ...d };
        delete x[item.id];
        return x;
      });
      return;
    }
    const prev = items;
    if (n === item.quantity) {
      setQtyDraft((d) => {
        const x = { ...d };
        delete x[item.id];
        return x;
      });
      return;
    }
    setItems((s) => s.map((i) => (i.id === item.id ? { ...i, quantity: n } : i)));
    setQtyDraft((d) => {
      const x = { ...d };
      delete x[item.id];
      return x;
    });
    try {
      await updateInventoryQuantity(item.id, n);
    } catch (e) {
      setItems(prev);
      setError(e instanceof Error ? e.message : "Could not update");
    }
  }

  async function removeItem(item: InventoryItem) {
    const prev = items;
    setItems((s) => s.filter((i) => i.id !== item.id));
    setQtyDraft((d) => {
      const x = { ...d };
      delete x[item.id];
      return x;
    });
    try {
      await removeInventoryItem(item.id);
    } catch (e) {
      setItems(prev);
      setError(e instanceof Error ? e.message : "Could not remove");
    }
  }

  function qtyDisplay(item: InventoryItem): string {
    return qtyDraft[item.id] !== undefined ? qtyDraft[item.id]! : String(item.quantity);
  }

  return (
    <ScrollScreen>
      <TabScreenHeader title="Inventory" subtitle="Manage your fridge quickly." />

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder="Search inventory…"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.section}>In your fridge</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.md }} color={colors.primary} />
      ) : filteredItems.length === 0 ? (
        <Text style={styles.muted}>{items.length === 0 ? "No items yet. Add below or scan." : "No matches."}</Text>
      ) : (
        <View style={styles.grid}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.gridCard}>
              <View style={styles.gridTop}>
                <Text style={styles.emoji}>{emojiForItem(item.name)}</Text>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
              </View>
              {isSingleUnitInventoryItem(item.name) ? null : (
                <View style={styles.qtyRow}>
                  <TextInput
                    style={styles.qtyInput}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    value={qtyDisplay(item)}
                    onChangeText={(t) => setQtyDraft((d) => ({ ...d, [item.id]: t }))}
                    onBlur={() => void commitQuantity(item)}
                    onSubmitEditing={() => void commitQuantity(item)}
                    accessibilityLabel={`Quantity for ${item.name}`}
                  />
                  <Chip label="-" onPress={() => void decrement(item)} />
                  <Chip label="+" onPress={() => void increment(item)} />
                </View>
              )}
              <Pressable onPress={() => void removeItem(item)} style={styles.removeHit}>
                <Text style={styles.removeTxt}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.section}>Manual add</Text>
      <Text style={styles.muted}>Tap + to add a suggestion to your fridge.</Text>
      <View style={styles.manualList}>
        {manualSuggestions.length === 0 ? (
          <Text style={styles.muted}>All suggestions are already in your fridge.</Text>
        ) : (
          manualSuggestions.map((label) => {
            const isBusy = busy === label;
            return (
              <View key={label} style={styles.manualRow}>
                <Text style={styles.manualEmoji}>{emojiForItem(label)}</Text>
                <Text style={styles.manualLabel}>{label}</Text>
                <Pressable
                  onPress={() => void addFromChip(label)}
                  disabled={isBusy}
                  style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }, isBusy && { opacity: 0.5 }]}
                >
                  <Text style={styles.addBtnTxt}>{isBusy ? "…" : "+"}</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  searchIcon: { marginRight: spacing.xs },
  search: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.textPrimary,
  },
  section: { marginTop: spacing.lg, fontSize: 17, fontWeight: "800", color: colors.textPrimary },
  muted: { marginTop: spacing.sm, color: colors.textSecondary, lineHeight: 20 },
  error: { marginTop: spacing.sm, color: colors.error },
  grid: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
  gridCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    minHeight: 118,
    justifyContent: "space-between",
  },
  gridTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xs },
  emoji: { fontSize: 22, lineHeight: 26 },
  itemName: { flex: 1, fontWeight: "700", color: colors.textPrimary, fontSize: 15 },
  qtyRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  qtyInput: {
    minWidth: 44,
    maxWidth: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textAlign: "center",
    fontWeight: "700",
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  removeHit: { marginTop: spacing.xs, alignSelf: "flex-start", paddingVertical: 4 },
  removeTxt: { color: colors.error, fontWeight: "700", fontSize: 13 },
  manualList: { marginTop: spacing.sm, gap: 0 },
  manualRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  manualEmoji: { fontSize: 20 },
  manualLabel: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  addBtnTxt: { color: colors.textOnPrimary, fontSize: 22, fontWeight: "800", marginTop: -2 },
});
