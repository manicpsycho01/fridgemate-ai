import type { useRouter } from "expo-router";
import type { Recipe } from "../types";

type Router = ReturnType<typeof useRouter>;

/** Opens the recipe detail screen for a recipe (passed as an encoded JSON param). */
export function openRecipe(router: Router, recipe: Recipe): void {
  router.push({ pathname: "/(app)/recipe-detail", params: { recipe: JSON.stringify(recipe) } });
}

/** Opens Cook with a fixed set of ingredients (from a counter scan or "Use first"). */
export function openCookWith(router: Router, ingredients: string[]): void {
  router.push({ pathname: "/(app)/(tabs)/cook", params: { sessionIngredients: JSON.stringify(ingredients) } });
}

/** Parses a JSON route param (string or string[]) safely. */
export function parseJsonParam<T>(raw: string | string[] | undefined, guard: (v: unknown) => v is T): T | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s) return null;
  for (const candidate of [s, safeDecode(s)]) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (guard(parsed)) return parsed;
    } catch {
      // try next
    }
  }
  return null;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}
