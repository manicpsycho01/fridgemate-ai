import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { isSupabaseConfigured, supabase } from "./supabase";

const MAX_EDGE_BASE64_CHARS = 4_500_000;

type FnResponse = { items?: unknown; error?: string };

/**
 * Shrinks image before upload to avoid Edge / gateway body limits and speed up Gemini.
 */
async function prepareImageForUpload(localUri: string, fallbackMime: string): Promise<{ uri: string; mimeType: string }> {
  try {
    const manipulated = await manipulateAsync(
      localUri,
      [{ resize: { width: 1024 } }],
      { compress: 0.72, format: SaveFormat.JPEG }
    );
    return { uri: manipulated.uri, mimeType: "image/jpeg" };
  } catch {
    return { uri: localUri, mimeType: fallbackMime || "image/jpeg" };
  }
}

/**
 * Sends a local image to the `detect-fridge-items` Edge Function (Gemini on the server).
 */
export async function detectFridgeItemsFromUri(localUri: string, mimeType: string): Promise<string[]> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { uri: uploadUri, mimeType: uploadMime } = await prepareImageForUpload(localUri, mimeType);

  const base64 = await FileSystem.readAsStringAsync(uploadUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

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
