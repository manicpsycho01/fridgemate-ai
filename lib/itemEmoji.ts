import { normalizeItemName } from "./ingredientMatch";

const EMOJI: [keyword: string, emoji: string][] = [
  ["leftover rice", "🍚"], ["rice", "🍚"], ["milk", "🥛"], ["egg", "🥚"], ["bread", "🍞"], ["cheese", "🧀"], ["paneer", "🧀"],
  ["yogurt", "🥣"], ["yoghurt", "🥣"], ["curd", "🥣"], ["chicken", "🍗"], ["fish", "🐟"], ["salmon", "🐟"], ["shrimp", "🦐"],
  ["prawn", "🦐"], ["beef", "🥩"], ["meat", "🥩"], ["pork", "🥓"], ["bacon", "🥓"], ["butter", "🧈"], ["tomato", "🍅"],
  ["cucumber", "🥒"], ["lettuce", "🥬"], ["spinach", "🥬"], ["cabbage", "🥬"], ["carrot", "🥕"], ["apple", "🍎"],
  ["banana", "🍌"], ["orange", "🍊"], ["lemon", "🍋"], ["lime", "🍋"], ["grape", "🍇"], ["strawberr", "🍓"], ["berr", "🫐"],
  ["juice", "🧃"], ["cream", "🥛"], ["mushroom", "🍄"], ["pepper", "🫑"], ["capsicum", "🫑"], ["broccoli", "🥦"],
  ["avocado", "🥑"], ["onion", "🧅"], ["garlic", "🧄"], ["potato", "🥔"], ["corn", "🌽"], ["tofu", "🍱"], ["ham", "🍖"],
  ["sausage", "🌭"], ["sauce", "🥫"], ["jam", "🍯"],
];

/** Friendly emoji for a fridge item or ingredient name. */
export function itemEmoji(name: string): string {
  const n = normalizeItemName(name);
  return EMOJI.find(([k]) => n.includes(k))?.[1] ?? "🥡";
}

/** Emoji thumbnail for a recipe title. */
export function recipeEmoji(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("omelette") || t.includes("egg")) return "🍳";
  if (t.includes("toast") || t.includes("sandwich") || t.includes("bread")) return "🥪";
  if (t.includes("salad")) return "🥗";
  if (t.includes("soup")) return "🍲";
  if (t.includes("curry")) return "🍛";
  if (t.includes("rice")) return "🍚";
  if (t.includes("pasta") || t.includes("noodle")) return "🍝";
  if (t.includes("chicken")) return "🍗";
  if (t.includes("smoothie") || t.includes("shake")) return "🥤";
  if (t.includes("yogurt") || t.includes("parfait") || t.includes("bowl")) return "🥣";
  if (t.includes("wrap") || t.includes("taco")) return "🌯";
  return "🍽️";
}
