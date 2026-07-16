/**
 * Detect fridge/counter food items from an image using Gemini.
 * Secret: GEMINI_API_KEY (Supabase Dashboard → Edge Functions → Secrets).
 *
 * Application-level failures return HTTP 200 + `{ items: [], error: "..." }`
 * so the mobile client can read the message (Supabase invoke treats non-2xx as opaque errors).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_INSTRUCTION =
  'You are a fridge inventory assistant. Analyze the provided image and return a JSON object containing a list of food items. ' +
  "Only include raw ingredients or perishables found in a fridge. Ignore non-food items. " +
  'Format exactly: {"items":["item1","item2"]}. Use short common names (e.g. Milk, Eggs, Tomato). No markdown, no extra keys.';

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function parseItemsJson(text: string): string[] {
  const trimmed = text.trim();
  const tryParse = (s: string) => {
    const o = JSON.parse(s) as { items?: unknown };
    if (!o || typeof o !== "object" || !Array.isArray(o.items)) return null;
    return o.items.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean);
  };
  try {
    const direct = tryParse(trimmed);
    if (direct) return direct;
  } catch {
    /* fall through */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    try {
      const inner = tryParse(fence[1].trim());
      if (inner) return inner;
    } catch {
      /* ignore */
    }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const slice = tryParse(trimmed.slice(start, end + 1));
      if (slice) return slice;
    } catch {
      /* ignore */
    }
  }
  throw new Error("Could not parse model JSON");
}

async function geminiDetect(
  apiKey: string,
  mimeType: string,
  imageBase64: string
): Promise<{ items: string[]; err?: string }> {
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest"];
  let lastErr = "Model request failed";

  for (const model of models) {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const geminiBody = {
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: "Return only the JSON object with an items array. No other text.",
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    };

    try {
      const gRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      });

      const gJson = (await gRes.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        error?: { message?: string };
      };

      if (!gRes.ok) {
        lastErr = gJson.error?.message ?? `${model}: ${gRes.status} ${gRes.statusText}`;
        continue;
      }

      const text =
        gJson.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (!text.trim()) {
        lastErr = `${model}: empty response`;
        continue;
      }

      const items = parseItemsJson(text);
      return { items };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      continue;
    }
  }

  return { items: [], err: lastErr };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed", items: [] }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing authorization", items: [] }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return jsonResponse({ error: "Unauthorized", items: [] }, 401);
  }

  let body: { imageBase64?: string; mimeType?: string };
  try {
    body = (await req.json()) as { imageBase64?: string; mimeType?: string };
  } catch {
    return jsonResponse({ error: "Invalid JSON body", items: [] }, 400);
  }

  const imageBase64 = body.imageBase64?.trim();
  const mimeType = (body.mimeType?.trim() || "image/jpeg").replace(/[^\w/+-]/g, "") || "image/jpeg";

  if (!imageBase64 || imageBase64.length < 50) {
    return jsonResponse({ error: "imageBase64 is required", items: [] }, 400);
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) {
    return jsonResponse({
      error: "Server misconfiguration: GEMINI_API_KEY is not set on this project.",
      items: [],
    });
  }

  const { items, err } = await geminiDetect(geminiKey, mimeType, imageBase64);
  if (err || items.length === 0) {
    return jsonResponse({
      items: [],
      error: err || "No food items detected in the image. Try a clearer photo or mock scan.",
    });
  }

  return jsonResponse({ items });
});
