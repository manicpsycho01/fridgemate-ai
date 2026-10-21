import type { InventoryItem, Recipe } from "../types";
import { freshness } from "./freshness";
import { getMockRecipes } from "./recipes";
import { isSupabaseConfigured, supabase } from "./supabase";

export type RecipeSuggestions = { recipes: Recipe[]; source: "ai" | "offline"; note?: string };

type FnResponse = { recipes?: unknown; error?: string };

function isRecipe(r: unknown): r is Recipe {
  if (!r || typeof r !== "object") return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.title === "string" &&
    typeof x.time === "string" &&
    typeof x.difficulty === "string" &&
    typeof x.description === "string" &&
    Array.isArray(x.ingredientsUsed) && x.ingredientsUsed.every((i) => typeof i === "string") &&
    Array.isArray(x.steps) && x.steps.every((s) => typeof s === "string")
  );
}

/**
 * Recipe ideas from what is in the fridge, prioritising items that should be used soon.
 * Uses Gemini through the `suggest-recipes` Edge Function; falls back to the offline catalog
 * so the Cook tab always works (no network, quota, or model errors surface as an empty screen).
 */
export async function suggestRecipes(items: InventoryItem[], extra: string[] = []): Promise<RecipeSuggestions> {
  const names = [...new Set([...items.map((i) => i.name.trim()), ...extra.map((e) => e.trim())].filter(Boolean))];
  const offline = (note?: string): RecipeSuggestions => ({ recipes: getMockRecipes(names), source: "offline", note });
  if (names.length === 0) return { recipes: [], source: "offline" };
  if (!isSupabaseConfigured) return offline();

  const ingredients = names.map((name) => {
    const item = items.find((i) => i.name.trim() === name);
    return { name, daysLeft: item ? freshness(item).daysLeft : null };
  });

  try {
    const { data, error } = await supabase.functions.invoke<FnResponse>("suggest-recipes", { body: { ingredients } });
    if (error) return offline("AI is unavailable right now — showing offline ideas.");
    const recipes = Array.isArray(data?.recipes) ? data.recipes.filter(isRecipe) : [];
    if (recipes.length === 0) return offline(data?.error ? "AI couldn't find ideas — showing offline ideas." : undefined);
    return { recipes, source: "ai" };
  } catch {
    return offline("You're offline — showing offline ideas.");
  }
}
