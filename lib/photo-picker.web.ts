import { getPhotoInputBehavior } from "@/lib/photo-input";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read the selected image."));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

async function compactImage(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image resizing is unavailable.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return readAsDataUrl(file);
  }
}

export async function pickPhoto(): Promise<string | null> {
  const behavior = getPhotoInputBehavior();
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (behavior.capture) input.setAttribute("capture", behavior.capture);
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      void compactImage(file).then(resolve, reject);
    };
    input.click();
  });
}
