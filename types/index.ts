export type InventoryItem = {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  source?: string | null;
  created_at: string;
};

/** Estimated per-serving macronutrients. All values are rounded integers. */
export type RecipeMacros = {
  calories: number;
  protein: number;   // grams
  carbs: number;     // grams
  fat: number;       // grams
  fiber: number;     // grams
};

export type Recipe = {
  title: string;
  time: string;
  difficulty: string;
  description: string;
  ingredientsUsed: string[];
  steps: string[];
  /** Optional – present on all catalog recipes and estimated for synthetic ones. */
  macros?: RecipeMacros;
};

export type RecipeHistoryEntry = {
  id: string;
  user_id: string;
  recipe_json: Recipe;
  created_at: string;
};

export type ConfirmMode = "fridge" | "counter" | "receipt";

/** Per recipe ingredient after cooking (inventory update). */
export type PerIngredientUsage = "used_some" | "used_all" | "didnt_use";

export type IngredientUsageEntry = {
  recipeIngredient: string;
  action: PerIngredientUsage;
};
