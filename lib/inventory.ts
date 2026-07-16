import type { IngredientUsageEntry, InventoryItem } from "../types";
import { ingredientMatchesItem, normalizeItemName } from "./ingredientMatch";
import { isSupabaseConfigured, supabase } from "./supabase";

export { normalizeItemName } from "./ingredientMatch";

/**
 * Staples we treat as one “unit” in the UI (no +/- or qty field). Stock is stored as quantity 1 in the DB.
 * Matches manual chip labels and common scan names (normalized, trimmed, lowercased).
 */
const SINGLE_UNIT_NAMES_NORMALIZED = new Set([
  "milk",
  "paneer",
  "cream",
  "chicken",
  "leftover rice",
  "leftover chicken",
  "bread",
  "yogurt",
]);

export function isSingleUnitInventoryItem(name: string): boolean {
  return SINGLE_UNIT_NAMES_NORMALIZED.has(normalizeItemName(name));
}

/** How much an inventory row contributes to “how many you have” for essentials / shopping. */
export function stockCountContribution(item: InventoryItem): number {
  if (isSingleUnitInventoryItem(item.name)) return Math.min(1, Math.max(0, item.quantity));
  return item.quantity;
}

async function requireUserId(): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env");
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("You must be signed in.");
  return data.user.id;
}

function toInventoryItem(row: Partial<InventoryItem> & { [k: string]: unknown }): InventoryItem {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    quantity: typeof row.quantity === "number" && row.quantity > 0 ? row.quantity : 1,
    source: typeof row.source === "string" ? row.source : null,
    created_at: String(row.created_at),
  };
}

export async function getInventory(): Promise<InventoryItem[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  let items = (data ?? []).map((r) => toInventoryItem(r as Record<string, unknown>));
  const fixQty = items.filter((i) => isSingleUnitInventoryItem(i.name) && i.quantity > 1);
  if (fixQty.length) {
    await Promise.all(fixQty.map((i) => updateInventoryQuantity(i.id, 1)));
    items = items.map((i) => (isSingleUnitInventoryItem(i.name) ? { ...i, quantity: 1 } : i));
  }
  return items;
}

export async function addInventoryItem(name: string, source?: string | null, quantity = 1): Promise<void> {
  const userId = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return;

  const existing = await getInventory();
  const norm = normalizeItemName(trimmed);
  const existingItem = existing.find((i) => normalizeItemName(i.name) === norm);

  if (existingItem) {
    if (isSingleUnitInventoryItem(existingItem.name)) return;
    await updateInventoryQuantity(existingItem.id, existingItem.quantity + quantity);
    return;
  }

  const insertQty = isSingleUnitInventoryItem(trimmed) ? 1 : Math.max(1, quantity);
  const { error } = await supabase.from("inventory_items").insert({
    user_id: userId,
    name: trimmed,
    quantity: insertQty,
    source: source ?? "manual",
  });
  if (error) throw error;
}

export async function updateInventoryQuantity(id: string, quantity: number): Promise<void> {
  const userId = await requireUserId();
  if (quantity <= 0) return removeInventoryItem(id);
  const { error } = await supabase
    .from("inventory_items")
    .update({ quantity })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function removeInventoryItem(id: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from("inventory_items").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function clearInventory(): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from("inventory_items").delete().eq("user_id", userId);
  if (error) throw error;
}

export async function addManyInventoryItems(names: string[], source: string): Promise<void> {
  const existing = await getInventory();
  const byNorm = new Map(existing.map((i) => [normalizeItemName(i.name), i]));

  for (const raw of names) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const norm = normalizeItemName(trimmed);
    const existingItem = byNorm.get(norm);

    if (existingItem) {
      if (!isSingleUnitInventoryItem(existingItem.name)) {
        await updateInventoryQuantity(existingItem.id, existingItem.quantity + 1);
        byNorm.set(norm, { ...existingItem, quantity: existingItem.quantity + 1 });
      }
    } else {
      await addInventoryItem(trimmed, source, 1);
      const latest = await getInventory();
      const inserted = latest.find((x) => normalizeItemName(x.name) === norm);
      if (inserted) byNorm.set(norm, inserted);
    }
  }
}

/**
 * Apply inventory changes for each recipe ingredient the user reported.
 * Refetches inventory between steps so duplicate lines (e.g. two "Eggs" rows) can hit the same row twice.
 */
export async function applyPerIngredientRecipeUsage(entries: IngredientUsageEntry[]): Promise<void> {
  for (const { recipeIngredient, action } of entries) {
    if (action === "didnt_use") continue;

    const inventory = await getInventory();
    const match = inventory.find((i) => ingredientMatchesItem(recipeIngredient, i.name));
    if (!match) continue;

    if (action === "used_all") {
      await removeInventoryItem(match.id);
    } else {
      await updateInventoryQuantity(match.id, match.quantity - 1);
    }
  }
}
