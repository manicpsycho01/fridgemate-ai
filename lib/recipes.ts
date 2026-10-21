import type { Recipe, RecipeHistoryEntry, RecipeMacros } from "../types";
import { ingredientMatchesAny, normalizeItemName } from "./ingredientMatch";
import { isSupabaseConfigured, supabase } from "./supabase";

/** Full catalog; `getMockRecipes` only returns recipes whose every ingredient exists in the user's set (fridge + counter session). */
const ALL_MOCK_RECIPES: Recipe[] = [
  {
    title: "Cheesy Tomato Eggs",
    time: "8 mins",
    difficulty: "Easy",
    description: "A quick lazy meal using eggs, tomato, and cheese.",
    ingredientsUsed: ["Eggs", "Tomato", "Cheese"],
    steps: [
      "Chop the tomato.",
      "Beat the eggs.",
      "Cook tomato in a pan for 1 minute.",
      "Add eggs and cheese.",
      "Cook until set and serve.",
    ],
    macros: { calories: 310, protein: 20, carbs: 8, fat: 22, fiber: 1 },
  },
  {
    title: "Simple Tomato Egg Skillet",
    time: "10 mins",
    difficulty: "Easy",
    description: "Eggs and tomato only — no extra ingredients.",
    ingredientsUsed: ["Eggs", "Tomato"],
    steps: [
      "Dice tomato and soften in a pan with a little oil.",
      "Pour in beaten eggs and fold gently until just set.",
      "Season with salt and pepper and serve hot.",
    ],
    macros: { calories: 220, protein: 14, carbs: 7, fat: 14, fiber: 1 },
  },
  {
    title: "Soft Scrambled Eggs",
    time: "6 mins",
    difficulty: "Easy",
    description: "Just eggs, cooked gently until creamy.",
    ingredientsUsed: ["Eggs"],
    steps: [
      "Whisk eggs with a pinch of salt.",
      "Cook on low heat, stirring constantly.",
      "Pull off heat while still slightly loose.",
    ],
    macros: { calories: 190, protein: 13, carbs: 1, fat: 14, fiber: 0 },
  },
  {
    title: "Egg in a Basket",
    time: "8 mins",
    difficulty: "Easy",
    description: "Bread with an egg cooked in the center.",
    ingredientsUsed: ["Bread", "Eggs"],
    steps: [
      "Cut a hole in a slice of bread.",
      "Toast bread in butter or oil, flip, crack egg into the hole.",
      "Cook until white is set; yolk jammy or firm to taste.",
    ],
    macros: { calories: 260, protein: 14, carbs: 24, fat: 11, fiber: 1 },
  },
  {
    title: "Tomato Toast",
    time: "5 mins",
    difficulty: "Easy",
    description: "Fresh tomato on toasted bread.",
    ingredientsUsed: ["Bread", "Tomato"],
    steps: [
      "Toast bread until crisp.",
      "Top with sliced tomato and a pinch of salt.",
    ],
    macros: { calories: 155, protein: 5, carbs: 30, fat: 2, fiber: 3 },
  },
  {
    title: "Cheese Toastie",
    time: "7 mins",
    difficulty: "Easy",
    description: "Melted cheese between toasted bread.",
    ingredientsUsed: ["Bread", "Cheese"],
    steps: [
      "Sandwich cheese between two slices of bread.",
      "Toast in a pan until golden and cheese melts.",
    ],
    macros: { calories: 370, protein: 18, carbs: 30, fat: 20, fiber: 1 },
  },
  {
    title: "Plain Toast",
    time: "3 mins",
    difficulty: "Easy",
    description: "Simple toasted bread.",
    ingredientsUsed: ["Bread"],
    steps: ["Toast bread until golden on both sides.", "Serve warm."],
    macros: { calories: 130, protein: 4, carbs: 25, fat: 2, fiber: 1 },
  },
  {
    title: "Tomato & Egg Open Sandwich",
    time: "9 mins",
    difficulty: "Easy",
    description: "Bread topped with tomato and egg.",
    ingredientsUsed: ["Bread", "Eggs", "Tomato"],
    steps: [
      "Toast bread.",
      "Scramble or fry an egg.",
      "Layer tomato and egg on toast; season.",
    ],
    macros: { calories: 285, protein: 16, carbs: 28, fat: 11, fiber: 2 },
  },
  {
    title: "Salted Tomato Slices",
    time: "2 mins",
    difficulty: "Easy",
    description: "Fresh tomato with salt.",
    ingredientsUsed: ["Tomato"],
    steps: ["Slice tomato.", "Sprinkle salt and eat immediately."],
    macros: { calories: 35, protein: 2, carbs: 7, fat: 0, fiber: 2 },
  },
  {
    title: "Yogurt Chicken Bowl",
    time: "12 mins",
    difficulty: "Easy",
    description: "Cool yogurt with warm chicken for a simple bowl.",
    ingredientsUsed: ["Yogurt", "Chicken"],
    steps: [
      "Dice or shred cooked chicken.",
      "Spoon yogurt into a bowl.",
      "Top with chicken, salt, and pepper.",
    ],
    macros: { calories: 340, protein: 38, carbs: 9, fat: 14, fiber: 0 },
  },
  {
    title: "Quick Chicken Lettuce Wrap",
    time: "10 mins",
    difficulty: "Easy",
    description: "Hand-held wraps with chicken and crisp lettuce.",
    ingredientsUsed: ["Chicken", "Lettuce"],
    steps: [
      "Warm chicken in a pan with a little oil.",
      "Wash and dry lettuce leaves.",
      "Spoon chicken into leaves, wrap, and eat.",
    ],
    macros: { calories: 250, protein: 32, carbs: 3, fat: 11, fiber: 1 },
  },
  {
    title: "Spinach Egg Scramble",
    time: "7 mins",
    difficulty: "Easy",
    description: "Eggs and spinach in one pan.",
    ingredientsUsed: ["Eggs", "Spinach"],
    steps: [
      "Saute spinach until wilted.",
      "Pour in beaten eggs and scramble gently.",
      "Season and serve hot.",
    ],
    macros: { calories: 200, protein: 16, carbs: 3, fat: 14, fiber: 1 },
  },
  {
    title: "Cheese Omelette",
    time: "8 mins",
    difficulty: "Easy",
    description: "Eggs folded with melted cheese.",
    ingredientsUsed: ["Eggs", "Cheese"],
    steps: [
      "Beat eggs with salt.",
      "Cook in a nonstick pan until edges set.",
      "Add cheese, fold, finish cooking briefly.",
    ],
    macros: { calories: 330, protein: 22, carbs: 2, fat: 26, fiber: 0 },
  },
  {
    title: "Caprese-style Tomato Cheese",
    time: "5 mins",
    difficulty: "Easy",
    description: "Tomato layered with cheese — no basil required.",
    ingredientsUsed: ["Tomato", "Cheese"],
    steps: [
      "Slice tomato and cheese.",
      "Alternate on a plate, drizzle oil if you have it, salt and pepper.",
    ],
    macros: { calories: 250, protein: 14, carbs: 8, fat: 18, fiber: 1 },
  },
  {
    title: "Buttered Carrot Coins",
    time: "8 mins",
    difficulty: "Easy",
    description: "Soft carrots glossed with butter.",
    ingredientsUsed: ["Carrot", "Butter"],
    steps: ["Slice carrots into coins.", "Simmer in a little water until tender.", "Toss with butter, salt, and pepper."],
    macros: { calories: 175, protein: 1, carbs: 14, fat: 12, fiber: 3 },
  },
  {
    title: "Cucumber Yogurt Raita",
    time: "6 mins",
    difficulty: "Easy",
    description: "Cool cucumber folded through yogurt.",
    ingredientsUsed: ["Cucumber", "Yogurt"],
    steps: ["Grate or finely dice cucumber.", "Stir into yogurt with salt.", "Chill briefly or serve right away."],
    macros: { calories: 110, protein: 7, carbs: 12, fat: 3, fiber: 1 },
  },
  {
    title: "Apple Banana Smoothie Bowl",
    time: "5 mins",
    difficulty: "Easy",
    description: "Fruit-forward bowl — mash or blend if you prefer.",
    ingredientsUsed: ["Apple", "Banana"],
    steps: ["Chop apple and banana.", "Mash together or blend until smooth.", "Top with a pinch of salt or cinnamon if you like."],
    macros: { calories: 185, protein: 2, carbs: 47, fat: 1, fiber: 5 },
  },
  {
    title: "Spinach Mushroom Sauté",
    time: "9 mins",
    difficulty: "Easy",
    description: "Earthy mushrooms with wilted spinach.",
    ingredientsUsed: ["Spinach", "Mushrooms"],
    steps: ["Slice mushrooms.", "Sauté until golden.", "Add spinach, toss until wilted; season."],
    macros: { calories: 90, protein: 6, carbs: 9, fat: 3, fiber: 3 },
  },
  {
    title: "Lettuce Cucumber Side Salad",
    time: "5 mins",
    difficulty: "Easy",
    description: "Crisp greens with cool cucumber.",
    ingredientsUsed: ["Lettuce", "Cucumber"],
    steps: ["Tear lettuce.", "Slice cucumber.", "Toss with salt, pepper, and a splash of juice if handy."],
    macros: { calories: 40, protein: 2, carbs: 7, fat: 0, fiber: 2 },
  },
  {
    title: "Cheesy Mushroom Toast",
    time: "10 mins",
    difficulty: "Easy",
    description: "Savory mushrooms melted with cheese on toast.",
    ingredientsUsed: ["Bread", "Mushrooms", "Cheese"],
    steps: ["Sauté sliced mushrooms.", "Toast bread.", "Top with mushrooms and cheese; broil or cover until cheese melts."],
    macros: { calories: 340, protein: 18, carbs: 28, fat: 17, fiber: 2 },
  },
  {
    title: "Chicken Spinach Skillet",
    time: "14 mins",
    difficulty: "Easy",
    description: "One-pan chicken with spinach.",
    ingredientsUsed: ["Chicken", "Spinach"],
    steps: ["Brown chicken pieces.", "Add spinach in handfuls until wilted.", "Season and finish with a splash of juice or water."],
    macros: { calories: 270, protein: 35, carbs: 4, fat: 12, fiber: 1 },
  },
  {
    title: "Fish with Lemon-style Tomatoes",
    time: "12 mins",
    difficulty: "Easy",
    description: "Light fish with jammy tomatoes.",
    ingredientsUsed: ["Fish", "Tomatoes"],
    steps: ["Soften chopped tomatoes in a pan.", "Nestle fish fillets on top, cover.", "Cook through gently; season."],
    macros: { calories: 220, protein: 28, carbs: 9, fat: 7, fiber: 2 },
  },
  {
    title: "Paneer Tomato Curry-lite",
    time: "16 mins",
    difficulty: "Easy",
    description: "Quick paneer in a tomato base.",
    ingredientsUsed: ["Paneer", "Tomatoes"],
    steps: ["Cube paneer.", "Cook tomatoes to a thick sauce.", "Add paneer, simmer briefly; season."],
    macros: { calories: 320, protein: 18, carbs: 12, fat: 22, fiber: 2 },
  },
  {
    title: "Creamy Mushroom Pasta-style (no pasta)",
    time: "11 mins",
    difficulty: "Easy",
    description: "Rich mushrooms simmered in cream.",
    ingredientsUsed: ["Mushrooms", "Cream"],
    steps: ["Sauté mushrooms until deep brown.", "Pour in cream, simmer to thicken.", "Salt, pepper, serve as a side or dip."],
    macros: { calories: 280, protein: 5, carbs: 9, fat: 25, fiber: 2 },
  },
  {
    title: "Leftover Rice Fried Rice-style",
    time: "12 mins",
    difficulty: "Easy",
    description: "Day-old rice revived in a hot pan.",
    ingredientsUsed: ["Leftover Rice", "Eggs"],
    steps: ["Scramble egg in oil, push aside.", "Add rice, break up clumps.", "Stir-fry together; soy or salt to taste."],
    macros: { calories: 380, protein: 14, carbs: 58, fat: 10, fiber: 1 },
  },
  {
    title: "Leftover Chicken Rice Bowl",
    time: "10 mins",
    difficulty: "Easy",
    description: "Warm chicken over rice with optional veg.",
    ingredientsUsed: ["Leftover Chicken", "Leftover Rice"],
    steps: ["Warm rice and chicken separately or together.", "Season with salt and pepper.", "Top with chopped lettuce or cucumber if you have it."],
    macros: { calories: 420, protein: 32, carbs: 52, fat: 8, fiber: 1 },
  },
  {
    title: "Banana Bread-ish Mash",
    time: "4 mins",
    difficulty: "Easy",
    description: "Comforting banana on toast.",
    ingredientsUsed: ["Banana", "Bread"],
    steps: ["Mash banana on a plate.", "Toast bread.", "Spread mash on toast; optional butter."],
    macros: { calories: 240, protein: 5, carbs: 52, fat: 2, fiber: 4 },
  },
  {
    title: "Juice-poached Apples",
    time: "10 mins",
    difficulty: "Easy",
    description: "Soft apples in a sweet juice bath.",
    ingredientsUsed: ["Apple", "Juice"],
    steps: ["Core and slice apple.", "Simmer gently in juice until tender.", "Serve warm or cold."],
    macros: { calories: 145, protein: 1, carbs: 38, fat: 0, fiber: 3 },
  },
  {
    title: "Milk-soaked Bread (simple)",
    time: "5 mins",
    difficulty: "Easy",
    description: "Soft bread in warm spiced milk — breakfast style.",
    ingredientsUsed: ["Milk", "Bread"],
    steps: ["Warm milk with a pinch of sugar if you like.", "Pour over torn bread in a bowl.", "Let sit 1–2 minutes; eat warm."],
    macros: { calories: 280, protein: 11, carbs: 44, fat: 7, fiber: 1 },
  },
  {
    title: "Carrot Apple Slaw",
    time: "7 mins",
    difficulty: "Easy",
    description: "Crunchy sweet slaw.",
    ingredientsUsed: ["Carrot", "Apple"],
    steps: ["Grate carrot and apple.", "Toss with salt and a squeeze of juice.", "Chill 5 minutes if you have time."],
    macros: { calories: 100, protein: 1, carbs: 25, fat: 0, fiber: 4 },
  },
  {
    title: "Egg Cucumber Sandwich Stack",
    time: "8 mins",
    difficulty: "Easy",
    description: "Cool crunch with egg salad vibes.",
    ingredientsUsed: ["Eggs", "Cucumber", "Bread"],
    steps: ["Boil or scramble eggs, chop.", "Slice cucumber thin.", "Layer egg and cucumber between bread; season."],
    macros: { calories: 295, protein: 18, carbs: 27, fat: 12, fiber: 2 },
  },
  {
    title: "Yogurt Parfait with Banana",
    time: "4 mins",
    difficulty: "Easy",
    description: "Layered yogurt and banana.",
    ingredientsUsed: ["Yogurt", "Banana"],
    steps: ["Slice banana.", "Layer yogurt and banana in a glass or bowl.", "Optional: drizzle juice."],
    macros: { calories: 230, protein: 10, carbs: 40, fat: 4, fiber: 2 },
  },
  {
    title: "Cheese Butter Crackers-style Bites",
    time: "6 mins",
    difficulty: "Easy",
    description: "Melty cheese on buttered bread corners.",
    ingredientsUsed: ["Cheese", "Butter", "Bread"],
    steps: ["Butter bread lightly.", "Top with cheese.", "Toast until bubbly and golden."],
    macros: { calories: 420, protein: 16, carbs: 28, fat: 28, fiber: 1 },
  },
];

const MAX_RECIPES_RETURNED = 500;

function ingredientSetKey(ings: string[]): string {
  return [...ings].map((s) => s.trim()).sort((a, b) => a.localeCompare(b)).join("\u0001");
}

function combinations<T>(arr: T[], k: number): T[][] {
  const out: T[][] = [];
  function dfs(start: number, cur: T[]) {
    if (cur.length === k) {
      out.push([...cur]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      cur.push(arr[i]);
      dfs(i + 1, cur);
      cur.pop();
    }
  }
  dfs(0, []);
  return out;
}

/**
 * Per-ingredient macro lookup (approximate values per one standard serving of that ingredient).
 * Used to estimate macros for synthetic "Quick mix" recipes.
 */
const INGREDIENT_MACROS: Record<string, RecipeMacros> = {
  eggs:            { calories: 78,  protein: 6,  carbs: 1,  fat: 5,  fiber: 0 },
  bread:           { calories: 79,  protein: 3,  carbs: 15, fat: 1,  fiber: 1 },
  cheese:          { calories: 113, protein: 7,  carbs: 0,  fat: 9,  fiber: 0 },
  tomato:          { calories: 22,  protein: 1,  carbs: 5,  fat: 0,  fiber: 1 },
  tomatoes:        { calories: 22,  protein: 1,  carbs: 5,  fat: 0,  fiber: 1 },
  chicken:         { calories: 165, protein: 31, carbs: 0,  fat: 4,  fiber: 0 },
  "leftover chicken": { calories: 140, protein: 26, carbs: 0, fat: 4, fiber: 0 },
  yogurt:          { calories: 61,  protein: 5,  carbs: 8,  fat: 1,  fiber: 0 },
  milk:            { calories: 61,  protein: 3,  carbs: 5,  fat: 3,  fiber: 0 },
  butter:          { calories: 102, protein: 0,  carbs: 0,  fat: 12, fiber: 0 },
  cream:           { calories: 103, protein: 1,  carbs: 2,  fat: 11, fiber: 0 },
  spinach:         { calories: 23,  protein: 3,  carbs: 4,  fat: 0,  fiber: 2 },
  lettuce:         { calories: 15,  protein: 1,  carbs: 3,  fat: 0,  fiber: 1 },
  carrot:          { calories: 41,  protein: 1,  carbs: 10, fat: 0,  fiber: 3 },
  cucumber:        { calories: 16,  protein: 1,  carbs: 4,  fat: 0,  fiber: 1 },
  mushrooms:       { calories: 22,  protein: 3,  carbs: 3,  fat: 0,  fiber: 1 },
  apple:           { calories: 95,  protein: 0,  carbs: 25, fat: 0,  fiber: 4 },
  banana:          { calories: 105, protein: 1,  carbs: 27, fat: 0,  fiber: 3 },
  juice:           { calories: 55,  protein: 1,  carbs: 13, fat: 0,  fiber: 0 },
  fish:            { calories: 136, protein: 27, carbs: 0,  fat: 4,  fiber: 0 },
  paneer:          { calories: 172, protein: 11, carbs: 2,  fat: 14, fiber: 0 },
  "leftover rice": { calories: 206, protein: 4,  carbs: 45, fat: 0,  fiber: 1 },
};

function estimateMacros(ingredients: string[]): RecipeMacros {
  let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0;
  for (const ing of ingredients) {
    const key = normalizeItemName(ing);
    const m = INGREDIENT_MACROS[key];
    if (m) {
      calories += m.calories;
      protein  += m.protein;
      carbs    += m.carbs;
      fat      += m.fat;
      fiber    += m.fiber;
    } else {
      calories += 60; protein += 2; carbs += 8; fat += 2; fiber += 1;
    }
  }
  return {
    calories: Math.round(calories),
    protein:  Math.round(protein),
    carbs:    Math.round(carbs),
    fat:      Math.round(fat),
    fiber:    Math.round(fiber),
  };
}

function makeSyntheticRecipe(ingredients: string[]): Recipe {
  const ings = [...ingredients].map((s) => s.trim()).filter(Boolean);
  const sorted = [...ings].sort((a, b) => a.localeCompare(b));
  const label = sorted.join(", ");
  return {
    title: `Quick mix: ${label}`,
    time: `${Math.min(28, 5 + sorted.length * 2)} mins`,
    difficulty: "Easy",
    description: `Uses only what you selected: ${sorted.join(", ")}.`,
    ingredientsUsed: [...ings],
    steps: [
      "Prep ingredients — wash, chop, or shred as needed.",
      "Combine in a pan, bowl, or plate; season with salt and pepper.",
      "Warm through if cooking, or serve fresh; taste and adjust.",
    ],
    macros: estimateMacros(ings),
  };
}

function recipeUsesOnlyAvailableIngredients(r: Recipe, availableNames: string[]): boolean {
  if (availableNames.length === 0) return false;
  if (r.ingredientsUsed.length === 0) return false;
  return r.ingredientsUsed.every((ing) => ingredientMatchesAny(ing, availableNames));
}

export function getMockRecipes(inventoryItemNames: string[]): Recipe[] {
  const names = inventoryItemNames.map((n) => n.trim()).filter(Boolean);
  if (names.length === 0) return [];

  const catalogMatches = ALL_MOCK_RECIPES.filter((r) => recipeUsesOnlyAvailableIngredients(r, names));
  const coveredKeys = new Set(catalogMatches.map((r) => ingredientSetKey(r.ingredientsUsed)));

  const synthetic: Recipe[] = [];
  const n = names.length;

  function pushSyntheticForSubset(sub: string[]) {
    if (catalogMatches.length + synthetic.length >= MAX_RECIPES_RETURNED) return;
    const key = ingredientSetKey(sub);
    if (coveredKeys.has(key)) return;
    coveredKeys.add(key);
    synthetic.push(makeSyntheticRecipe(sub));
  }

  if (n <= 14) {
    const limit = 1 << n;
    for (let mask = 1; mask < limit; mask++) {
      const sub: string[] = [];
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) sub.push(names[i]);
      }
      if (sub.length === 0 || sub.length > 8) continue;
      pushSyntheticForSubset(sub);
    }
  } else {
    for (let k = 1; k <= Math.min(3, n); k++) {
      for (const sub of combinations(names, k)) {
        pushSyntheticForSubset(sub);
        if (catalogMatches.length + synthetic.length >= MAX_RECIPES_RETURNED) break;
      }
      if (catalogMatches.length + synthetic.length >= MAX_RECIPES_RETURNED) break;
    }
  }

  const combined = [...catalogMatches, ...synthetic];
  combined.sort((a, b) => {
    if (a.ingredientsUsed.length !== b.ingredientsUsed.length) {
      return b.ingredientsUsed.length - a.ingredientsUsed.length;
    }
    return a.title.localeCompare(b.title);
  });
  return combined.slice(0, MAX_RECIPES_RETURNED);
}

export async function saveRecipeToHistory(recipe: Recipe): Promise<void> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) throw new Error("You must be signed in.");

  const { error } = await supabase.from("recipe_history").insert({
    user_id: data.user.id,
    recipe_json: recipe,
  });
  if (error) throw error;
}

export async function getRecipeHistory(): Promise<RecipeHistoryEntry[]> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) throw new Error("You must be signed in.");

  const { data: rows, error } = await supabase
    .from("recipe_history")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (rows ?? []).map((row) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    created_at: String(row.created_at),
    recipe_json: row.recipe_json as Recipe,
  }));
}
