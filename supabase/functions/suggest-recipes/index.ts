/**
 * Recipe ideas from the user's ingredients with Gemini (JSON mode).
 * Body: { ingredients: { name: string; daysLeft: number | null }[] }
 * Returns 200 + { recipes: Recipe[] } or 200 + { recipes: [], error } so the app can fall back to offline ideas.
 * Secret: GEMINI_API_KEY.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
// Current Flash first; Google retires pinned versions regularly (1.5 and 2.0 are gone).
// Lite first: in testing the larger models took 40 s+ (or hung) for recipe JSON, while lite answered in seconds.
const MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-2.5-flash", "gemini-3.8-flash"];
/** Overload / rate-limit statuses worth one quick retry before moving to the next model. */
const RETRYABLE = new Set([429, 500, 503]);
/** Recipe ideas don't need deep reasoning: keep "thinking" minimal for speed (field name differs per generation). */
const thinking = (model: string) =>
  model.startsWith("gemini-2.5") ? { thinkingBudget: 0 } : model.includes("lite") ? undefined : { thinkingLevel: "low" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MAX_INGREDIENTS = 40;

/** Tolerant ingredient key: case, punctuation and simple plurals ("Eggs" = "egg", "Tomatoes" = "tomato"). */
const key = (name: string) =>
  name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/(oes|ies|es|s)$/, (m) => (m === "ies" ? "y" : m === "oes" ? "o" : ""));

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PROMPT = `You are FridgeMate, a friendly home-cooking assistant.
Suggest 4 realistic, simple home recipes using ONLY the listed fridge ingredients plus basic pantry staples
(salt, pepper, oil, water, sugar, common dried spices). Prefer recipes that use ingredients with few days left
(lower daysLeft first). Every recipe must use at least one listed ingredient. Keep steps short and clear (3-7 steps).
"ingredientsUsed" must contain only names from the list (exact spelling). Estimate per-serving macros.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    recipes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          time: { type: "STRING", description: "e.g. 15 mins" },
          difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] },
          description: { type: "STRING" },
          ingredientsUsed: { type: "ARRAY", items: { type: "STRING" } },
          steps: { type: "ARRAY", items: { type: "STRING" } },
          macros: {
            type: "OBJECT",
            properties: {
              calories: { type: "INTEGER" }, protein: { type: "INTEGER" }, carbs: { type: "INTEGER" },
              fat: { type: "INTEGER" }, fiber: { type: "INTEGER" },
            },
            required: ["calories", "protein", "carbs", "fat", "fiber"],
          },
        },
        required: ["title", "time", "difficulty", "description", "ingredientsUsed", "steps", "macros"],
      },
    },
  },
  required: ["recipes"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ recipes: [], error: "Method not allowed" }, 405);

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ recipes: [], error: "Missing authorization" }, 401);
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: auth } },
  });
  const { data: u, error: uErr } = await supabase.auth.getUser();
  if (uErr || !u.user) return json({ recipes: [], error: "Unauthorized" }, 401);

  let ingredients: { name: string; daysLeft: number | null }[] = [];
  try {
    const body = (await req.json()) as { ingredients?: unknown };
    if (Array.isArray(body.ingredients)) {
      ingredients = body.ingredients
        .filter((i): i is { name: string; daysLeft: number | null } => !!i && typeof (i as { name?: unknown }).name === "string")
        .map((i) => ({ name: i.name.trim().slice(0, 60), daysLeft: typeof i.daysLeft === "number" ? i.daysLeft : null }))
        .filter((i) => i.name)
        .slice(0, MAX_INGREDIENTS);
    }
  } catch {
    return json({ recipes: [], error: "Invalid JSON body" }, 400);
  }
  if (ingredients.length === 0) return json({ recipes: [] });

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ recipes: [], error: "GEMINI_API_KEY is not set on this project." });

  const list = ingredients.map((i) => `- ${i.name}${i.daysLeft === null ? "" : ` (daysLeft: ${i.daysLeft})`}`).join("\n");
  const errors: string[] = [];
  // Supabase kills a function at 150 s. Give each model a bounded slice so a slow or stuck model
  // falls through to the next one instead of hanging the whole request (seen in testing: 150 s timeouts).
  const deadline = Date.now() + 110_000;
  for (const [i, model] of MODELS.entries()) {
    const remaining = deadline - Date.now();
    if (remaining < 5_000) { errors.push(`${model}: skipped (out of time)`); break; }
    const slice = Math.min(i === 0 ? 40_000 : 30_000, remaining);
    try {
      const call = () => fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(slice),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: PROMPT }] },
            contents: [{ role: "user", parts: [{ text: `Fridge ingredients:\n${list}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json", responseSchema: SCHEMA, thinkingConfig: thinking(model) },
          }),
        },
      );
      let res = await call();
      if (RETRYABLE.has(res.status) && deadline - Date.now() > slice) { await sleep(1200); res = await call(); }
      const out = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[]; error?: { message?: string } };
      if (!res.ok) { errors.push(`${model}: ${out.error?.message ?? res.status}`); continue; }
      const text = out.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      const parsed = JSON.parse(text) as { recipes?: unknown[] };
      const allowed = new Set(ingredients.map((i) => key(i.name)));
      const recipes = (parsed.recipes ?? []).filter((r) => {
        const x = r as { ingredientsUsed?: unknown };
        return Array.isArray(x.ingredientsUsed) && x.ingredientsUsed.some((n) => typeof n === "string" && allowed.has(key(n)));
      });
      if (recipes.length) return json({ recipes, model });
      errors.push(`${model}: no usable recipes`);
    } catch (e) {
      errors.push(`${model}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  console.error("suggest-recipes failed", errors);
  return json({ recipes: [], error: errors.join(" | ") });
});
