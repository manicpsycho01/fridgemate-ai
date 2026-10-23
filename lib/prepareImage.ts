import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/**
 * Shrinks a photo to `width` px JPEG and returns base64 (phones). Falls back to the original file if resizing fails.
 * The web version lives in prepareImage.web.ts.
 */
export async function prepareImageBase64(localUri: string, fallbackMime: string, width: number, compress: number): Promise<{ base64: string; mimeType: string }> {
  try {
    const image = await ImageManipulator.manipulate(localUri).resize({ width }).renderAsync();
    const saved = await image.saveAsync({ compress, format: SaveFormat.JPEG, base64: true });
    if (saved.base64) return { base64: saved.base64, mimeType: "image/jpeg" };
  } catch {
    // fall through to the original file
  }
  const base64 = await readAsStringAsync(localUri, { encoding: EncodingType.Base64 });
  return { base64, mimeType: fallbackMime || "image/jpeg" };
}
