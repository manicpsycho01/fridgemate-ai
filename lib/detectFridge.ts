import { prepareImageBase64 } from "./prepareImage";
import { isSupabaseConfigured, supabase } from "./supabase";

const MAX_EDGE_BASE64_CHARS = 4_500_000;

type FnResponse = { items?: unknown; error?: string };

/** Never leave the scanner spinning: give up with a clear message after `ms`. */
function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

/**
 * Sends a local image to the `detect-fridge-items` Edge Function (Gemini on the server).
 */
/** What the photo shows: an open fridge / counter (food you can see) or a grocery receipt (printed lines). */
export type ScanKind = "fridge" | "receipt";

export async function detectFridgeItemsFromUri(localUri: string, mimeType: string, kind: ScanKind = "fridge"): Promise<string[]> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  // Receipts need legible small print; fridge photos only need shapes and colours.
  const [width, compress] = kind === "receipt" ? [1600, 0.85] : [1024, 0.72];
  const { base64, mimeType: uploadMime } = await withTimeout(prepareImageBase64(localUri, mimeType, width, compress), 20_000, "Preparing the photo took too long. Try a smaller photo.");

  if (base64.length > MAX_EDGE_BASE64_CHARS) {
    throw new Error("Image is still too large after compression. Try another photo.");
  }

  const { data, error } = await withTimeout(
    supabase.functions.invoke<FnResponse>("detect-fridge-items", {
      body: {
        imageBase64: base64,
        mimeType: uploadMime || mimeType || "image/jpeg",
        kind,
      },
    }),
    90_000,
    "The AI is taking too long. Check your connection and try again.",
  );

  if (error) {
    throw new Error(error.message ?? "Edge function request failed");
  }

  const payload = data as FnResponse | null;
  const errMsg = payload?.error ? String(payload.error) : "";
  const rawItems = payload?.items;

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error(errMsg || "No items detected");
  }

  return rawItems.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
}
