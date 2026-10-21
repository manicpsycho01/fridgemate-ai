import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { Recipe } from "../types";
import { normalizeItemName } from "./ingredientMatch";

export type FoodGlyph = ComponentProps<typeof MaterialCommunityIcons>["name"];
export type FoodCategory = "produce" | "fruit" | "dairy" | "protein" | "grain" | "drink" | "pantry" | "other";

/** Category palette: `tint` for icon tiles, `ink` for the glyph, `block` for recipe colour blocks. */
export const CATEGORY: Record<FoodCategory, { tint: string; ink: string; block: readonly [string, string] }> = {
  produce: { tint: "#E3EFDD", ink: "#3D7838", block: ["#D6E9CC", "#B3D6A3"] },
  fruit: { tint: "#FFE4D9", ink: "#C94626", block: ["#FFD8C8", "#FFB59D"] },
  dairy: { tint: "#FDF0CF", ink: "#9C6C0B", block: ["#FCEBC0", "#F4D489"] },
  protein: { tint: "#FAE1DC", ink: "#A6423A", block: ["#F7D3C9", "#EEAE9E"] },
  grain: { tint: "#F4E7D2", ink: "#87602E", block: ["#F2E2C8", "#E4C89D"] },
  drink: { tint: "#DFEBF0", ink: "#376780", block: ["#D6E7EE", "#B3D2DF"] },
  pantry: { tint: "#EDE4F0", ink: "#6F4C86", block: ["#E7DCEE", "#D0BBDD"] },
  other: { tint: "#ECE6DA", ink: "#1F4D3F", block: ["#E2EBE4", "#C5D8CB"] },
};

/** First keyword match wins, so specific phrases come before generic ones. */
const FOOD: [keyword: string, glyph: FoodGlyph, category: FoodCategory][] = [
  ["leftover chicken", "food-drumstick-outline", "protein"],
  ["leftover rice", "rice", "grain"],
  ["leftover", "food-takeout-box-outline", "other"],
  ["ice cream", "ice-cream", "dairy"],
  ["cream cheese", "cheese", "dairy"],
  ["milk", "cup", "dairy"],
  ["cream", "cup", "dairy"],
  ["yogurt", "bowl-mix-outline", "dairy"],
  ["yoghurt", "bowl-mix-outline", "dairy"],
  ["curd", "bowl-mix-outline", "dairy"],
  ["cheese", "cheese", "dairy"],
  ["paneer", "cheese", "dairy"],
  ["butter", "cube-outline", "dairy"],
  ["egg", "egg-outline", "protein"],
  ["chicken", "food-drumstick-outline", "protein"],
  ["turkey", "food-turkey", "protein"],
  ["fish", "fish", "protein"],
  ["salmon", "fish", "protein"],
  ["tuna", "fish", "protein"],
  ["shrimp", "fish", "protein"],
  ["prawn", "fish", "protein"],
  ["sausage", "sausage", "protein"],
  ["hot dog", "food-hot-dog", "protein"],
  ["beef", "food-steak", "protein"],
  ["steak", "food-steak", "protein"],
  ["mince", "food-steak", "protein"],
  ["lamb", "food-steak", "protein"],
  ["mutton", "food-steak", "protein"],
  ["pork", "food-steak", "protein"],
  ["bacon", "food-steak", "protein"],
  ["ham", "food-steak", "protein"],
  ["meat", "food-steak", "protein"],
  ["tofu", "cube-outline", "protein"],
  ["peanut", "peanut-outline", "pantry"],
  ["baguette", "baguette", "grain"],
  ["croissant", "food-croissant", "grain"],
  ["bread", "bread-slice-outline", "grain"],
  ["toast", "bread-slice-outline", "grain"],
  ["tortilla", "taco", "grain"],
  ["rice", "rice", "grain"],
  ["pasta", "pasta", "grain"],
  ["spaghetti", "pasta", "grain"],
  ["noodle", "noodles", "grain"],
  ["oat", "grain", "grain"],
  ["flour", "grain", "grain"],
  ["pineapple", "fruit-pineapple", "fruit"],
  ["watermelon", "fruit-watermelon", "fruit"],
  ["melon", "fruit-watermelon", "fruit"],
  ["grape", "fruit-grapes-outline", "fruit"],
  ["pear", "fruit-pear", "fruit"],
  ["avocado", "fruit-pear", "produce"],
  ["lemon", "fruit-citrus", "fruit"],
  ["lime", "fruit-citrus", "fruit"],
  ["orange", "fruit-citrus", "fruit"],
  ["berr", "fruit-cherries", "fruit"],
  ["cherr", "fruit-cherries", "fruit"],
  ["tomato", "food-apple-outline", "fruit"],
  ["apple", "food-apple-outline", "fruit"],
  ["banana", "food-apple-outline", "fruit"],
  ["carrot", "carrot", "produce"],
  ["corn", "corn", "produce"],
  ["mushroom", "mushroom-outline", "produce"],
  ["capsicum", "chili-mild-outline", "produce"],
  ["pepper", "chili-mild-outline", "produce"],
  ["chili", "chili-mild-outline", "produce"],
  ["chilli", "chili-mild-outline", "produce"],
  ["juice", "cup-water", "drink"],
  ["water", "cup-water", "drink"],
  ["soda", "bottle-soda-outline", "drink"],
  ["cola", "bottle-soda-outline", "drink"],
  ["wine", "bottle-wine-outline", "drink"],
  ["beer", "glass-mug-variant", "drink"],
  ["tea", "tea-outline", "drink"],
  ["sauce", "soy-sauce", "pantry"],
  ["ketchup", "soy-sauce", "pantry"],
  ["mayo", "soy-sauce", "pantry"],
  ["mustard", "soy-sauce", "pantry"],
  ["jam", "bottle-tonic-outline", "pantry"],
  ["honey", "bottle-tonic-outline", "pantry"],
  ["pickle", "bottle-tonic-outline", "pantry"],
  ["broccoli", "sprout-outline", "produce"],
  ["cauliflower", "sprout-outline", "produce"],
  ["onion", "seed-outline", "produce"],
  ["garlic", "seed-outline", "produce"],
  ["ginger", "seed-outline", "produce"],
  ["potato", "seed-outline", "produce"],
  ["beet", "seed-outline", "produce"],
  ["cucumber", "leaf", "produce"],
  ["zucchini", "leaf", "produce"],
  ["lettuce", "leaf", "produce"],
  ["spinach", "leaf", "produce"],
  ["cabbage", "leaf", "produce"],
  ["kale", "leaf", "produce"],
  ["herb", "leaf", "produce"],
  ["coriander", "leaf", "produce"],
  ["cilantro", "leaf", "produce"],
  ["mint", "leaf", "produce"],
  ["basil", "leaf", "produce"],
];

export type FoodVisual = { glyph: FoodGlyph; category: FoodCategory };

/** Icon + category for a fridge item or ingredient name. */
export function foodVisual(name: string): FoodVisual {
  const n = normalizeItemName(name);
  const hit = FOOD.find(([k]) => n.includes(k));
  return hit ? { glyph: hit[1], category: hit[2] } : { glyph: "food-variant", category: "other" };
}

const DISH: [keyword: string, glyph: FoodGlyph][] = [
  ["omelette", "egg-fried"],
  ["egg", "egg-fried"],
  ["salad", "leaf"],
  ["soup", "pot-steam-outline"],
  ["curry", "pot-steam-outline"],
  ["stew", "pot-steam-outline"],
  ["pasta", "pasta"],
  ["noodle", "noodles"],
  ["rice", "rice"],
  ["toast", "bread-slice-outline"],
  ["sandwich", "bread-slice-outline"],
  ["smoothie", "cup"],
  ["shake", "cup"],
  ["parfait", "bowl-mix-outline"],
  ["bowl", "bowl-mix-outline"],
  ["wrap", "taco"],
  ["taco", "taco"],
  ["pizza", "pizza"],
];

/** Colour block + glyph for a recipe: colour from its main ingredient's category, glyph from the dish. */
export function recipeVisual(recipe: Pick<Recipe, "title" | "ingredientsUsed">): FoodVisual {
  const t = recipe.title.toLowerCase();
  const main = recipe.ingredientsUsed[0];
  const category = main ? foodVisual(main).category : "other";
  const glyph = DISH.find(([k]) => t.includes(k))?.[1] ?? (main ? foodVisual(main).glyph : "silverware-fork-knife");
  return { glyph, category };
}
