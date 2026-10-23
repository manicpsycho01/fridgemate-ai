/**
 * Web: the picked photo is a blob:/data: URL. Draw it onto a canvas at `width` px and export JPEG base64.
 * (expo-file-system and expo-image-manipulator's native paths aren't available in the browser.)
 */
export async function prepareImageBase64(localUri: string, fallbackMime: string, width: number, compress: number): Promise<{ base64: string; mimeType: string }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Couldn't read that photo. Try a JPEG or PNG."));
    i.src = localUri;
  });
  const scale = Math.min(1, width / img.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process that photo in this browser.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL("image/jpeg", compress);
  const base64 = url.slice(url.indexOf(",") + 1);
  return { base64, mimeType: base64 ? "image/jpeg" : fallbackMime };
}
