/** Shared canonical matching for inventory items vs recipe ingredients (singular/plural). */

export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase();
}

export function canonicalIngredientName(name: string): string {
  const base = normalizeItemName(name)
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
  if (base.endsWith("ies")) return `${base.slice(0, -3)}y`;
  if (base.endsWith("es")) return base.slice(0, -2);
  if (base.endsWith("s")) return base.slice(0, -1);
  return base;
}

export function ingredientMatchesItem(ingredient: string, itemName: string): boolean {
  const a = canonicalIngredientName(ingredient);
  const b = canonicalIngredientName(itemName);
  return a === b || a.includes(b) || b.includes(a);
}

export function ingredientMatchesAny(ingredient: string, availableNames: string[]): boolean {
  return availableNames.some((n) => ingredientMatchesItem(ingredient, n));
}
