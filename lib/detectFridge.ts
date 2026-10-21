import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { isSupabaseConfigured, supabase } from "./supabase";

const MAX_EDGE_BASE64_CHARS = 4_500_000;

type FnResponse = { items?: unknown; error?: string };

/**
 * Shrinks the photo to 1024 px wide JPEG and returns it as base64, to stay under Edge / gateway body limits
 * and speed up Gemini. Falls back to the original file if resizing fails.
 */
async function prepareImageBase64(localUri: string, fallbackMime: string): Promise<{ base64: string; mimeType: string }> {
  try {
    const image = await ImageManipulator.manipulate(localUri).resize({ width: 1024 }).renderAsync();
    const saved = await image.saveAsync({ compress: 0.72, format: SaveFormat.JPEG, base64: true });
    if (saved.base64) return { base64: saved.base64, mimeType: "image/jpeg" };
  } catch {
    // fall through to the original file
  }
  const base64 = await readAsStringAsync(localUri, { encoding: EncodingType.Base64 });
  return { base64, mimeType: fallbackMime || "image/jpeg" };
}

/**
 * Sends a local image to the `detect-fridge-items` Edge Function (Gemini on the server).
 */
export async function detectFridgeItemsFromUri(localUri: string, mimeType: string): Promise<string[]> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { base64, mimeType: uploadMime } = await prepareImageBase64(localUri, mimeType);

  if (base64.length > MAX_EDGE_BASE64_CHARS) {
    throw new Error("Image is still too large after compression. Try another photo.");
  }

  const { data, error } = await supabase.functions.invoke<FnResponse>("detect-fridge-items", {
    body: {
      imageBase64: base64,
      mimeType: uploadMime || mimeType || "image/jpeg",
    },
  });

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
