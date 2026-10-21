import type { InventoryItem } from "../types";
import { normalizeItemName } from "./ingredientMatch";

/**
 * Typical fridge shelf life in days, by keyword. Used to estimate "use soon" without asking the user
 * for expiry dates. Conservative values from common food-safety guidance; first match wins.
 */
const SHELF_LIFE: [keyword: string, days: number][] = [
  ["fish", 2], ["salmon", 2], ["shrimp", 2], ["prawn", 2], ["mince", 2], ["ground", 2],
  ["chicken", 2], ["meat", 3], ["beef", 3], ["pork", 3], ["lamb", 3], ["mutton", 3],
  ["spinach", 4], ["lettuce", 5], ["herb", 5], ["coriander", 4], ["cilantro", 4], ["mint", 5], ["berries", 4], ["strawberr", 4],
  ["mushroom", 5], ["avocado", 4], ["banana", 5], ["bread", 5],
  ["milk", 6], ["paneer", 7], ["tofu", 5], ["cream", 7], ["curd", 7], ["yogurt", 10], ["yoghurt", 10],
  ["tomato", 7], ["cucumber", 7], ["capsicum", 10], ["pepper", 10], ["broccoli", 5], ["cauliflower", 7], ["zucchini", 6],
  ["leftover", 3], ["cooked", 3], ["rice", 4],
  ["egg", 21], ["cheese", 21], ["butter", 30], ["ham", 5], ["bacon", 7], ["sausage", 7],
  ["apple", 30], ["orange", 21], ["lemon", 21], ["lime", 21], ["grape", 7],
  ["carrot", 21], ["cabbage", 14], ["beetroot", 14], ["onion", 30], ["garlic", 60], ["ginger", 21], ["potato", 30],
  ["jam", 90], ["sauce", 60], ["ketchup", 120], ["mayonnaise", 60], ["pickle", 120], ["mustard", 120],
];
const DEFAULT_DAYS = 7;
const DAY_MS = 86_400_000;

export type FreshnessStatus = "fresh" | "soon" | "expired";
export type Freshness = { daysIn: number; daysLeft: number; status: FreshnessStatus };

export function shelfLifeDays(name: string): number {
  const n = normalizeItemName(name);
  return SHELF_LIFE.find(([k]) => n.includes(k))?.[1] ?? DEFAULT_DAYS;
}

/** Estimated freshness from when the item was added. "soon" = 2 days or fewer left. */
export function freshness(item: Pick<InventoryItem, "name" | "created_at">, now: Date = new Date()): Freshness {
  const added = new Date(item.created_at).getTime();
  const daysIn = Math.max(0, Math.floor((now.getTime() - added) / DAY_MS));
  const daysLeft = shelfLifeDays(item.name) - daysIn;
  const status: FreshnessStatus = daysLeft < 0 ? "expired" : daysLeft <= 2 ? "soon" : "fresh";
  return { daysIn, daysLeft, status };
}

/** Items to use first: expired or expiring soon, most urgent first. */
export function useFirst(items: InventoryItem[], now: Date = new Date()): (InventoryItem & Freshness)[] {
  return items
    .map((i) => ({ ...i, ...freshness(i, now) }))
    .filter((i) => i.status !== "fresh")
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
