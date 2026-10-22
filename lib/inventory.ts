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
  // Local session read (no network round trip); row-level security still enforces ownership on the server.
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("You must be signed in.");
  return id;
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
  const userId = await requireUserId();
  const existing = await getInventory();
  const byNorm = new Map(existing.map((i) => [normalizeItemName(i.name), i]));
  const nextQty = new Map<string, number>(); // existing row id -> new quantity
  const inserts = new Map<string, { name: string; quantity: number }>();

  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const norm = normalizeItemName(name);
    const found = byNorm.get(norm);
    if (found) {
      if (!isSingleUnitInventoryItem(found.name)) nextQty.set(found.id, (nextQty.get(found.id) ?? found.quantity) + 1);
      continue;
    }
    const pending = inserts.get(norm);
    if (!pending) inserts.set(norm, { name, quantity: 1 });
    else if (!isSingleUnitInventoryItem(name)) pending.quantity += 1;
  }

  // One insert for all new items + parallel quantity updates (was 3 round trips per item).
  const tasks: Promise<void>[] = [...nextQty].map(([id, quantity]) => updateInventoryQuantity(id, quantity));
  if (inserts.size) {
    tasks.push(
      (async () => {
        const rows = [...inserts.values()].map((i) => ({ user_id: userId, name: i.name, quantity: i.quantity, source }));
        const { error } = await supabase.from("inventory_items").insert(rows);
        if (error) throw error;
      })()
    );
  }
  await Promise.all(tasks);
}

/**
 * Apply inventory changes for each recipe ingredient the user reported.
 * Reads the fridge once, works out every change in memory (so two recipe lines can hit the same row),
 * then writes all changes in parallel — instead of a refetch + write per ingredient.
 */
export async function applyPerIngredientRecipeUsage(entries: IngredientUsageEntry[]): Promise<void> {
  const inventory = await getInventory();
  const qty = new Map(inventory.map((i) => [i.id, i.quantity]));
  for (const { recipeIngredient, action } of entries) {
    if (action === "didnt_use") continue;
    const match = inventory.find((i) => (qty.get(i.id) ?? 0) > 0 && ingredientMatchesItem(recipeIngredient, i.name));
    if (!match) continue;
    qty.set(match.id, action === "used_all" ? 0 : (qty.get(match.id) ?? 0) - 1);
  }
  await Promise.all(
    inventory
      .filter((i) => qty.get(i.id) !== i.quantity)
      .map((i) => {
        const q = qty.get(i.id) ?? 0;
        return q <= 0 ? removeInventoryItem(i.id) : updateInventoryQuantity(i.id, q);
      })
  );
}
