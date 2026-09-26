import { getPhotoInputBehavior } from "@/lib/photo-input";
async function compactImage(file: File): Promise<string> {
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 20 MB.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPEG, PNG or WebP photo.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "This photo could not be decoded. Try exporting it as JPEG first.",
    );
  }
  try {
    if (bitmap.width * bitmap.height > 40_000_000)
      throw new Error("Choose a photo with fewer than 40 megapixels.");
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Photo processing is unavailable in this browser.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL("image/jpeg", 0.92);
    if (!result.startsWith("data:image/jpeg;base64,"))
      throw new Error("Photo processing failed. The original was not stored.");
    return result;
  } finally {
    bitmap.close();
  }
}
export async function pickPhoto(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    if (getPhotoInputBehavior().capture)
      input.setAttribute("capture", "environment");
    input.oncancel = () => resolve(null);
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) resolve(null);
      else void compactImage(file).then(resolve, reject);
    };
    input.click();
  });
}
