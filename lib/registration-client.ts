import {
  Exclusion,
  RegistrationImage,
  RegistrationResult,
} from "./registration";
export async function prepareImage(
  uri: string,
  exclusion: Exclusion,
): Promise<RegistrationImage> {
  const image = new window.Image();
  image.src = uri;
  await image.decode();
  const scale = Math.min(
    1,
    512 / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.round(image.naturalWidth * scale),
    height = Math.round(image.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Image processing unavailable.");
  ctx.drawImage(image, 0, 0, width, height);
  const rgba = ctx.getImageData(0, 0, width, height).data,
    pixels = new Float32Array(width * height);
  for (let i = 0; i < pixels.length; i++)
    pixels[i] =
      (0.2126 * rgba[i * 4] +
        0.7152 * rgba[i * 4 + 1] +
        0.0722 * rgba[i * 4 + 2]) /
      255;
  return {
    width,
    height,
    pixels,
    exclusion: {
      x: exclusion.x * width,
      y: exclusion.y * height,
      radius: exclusion.radius * Math.min(width, height),
    },
  };
}
export function autoAlign(
  fixed: RegistrationImage,
  moving: RegistrationImage,
  signal: AbortSignal,
): Promise<RegistrationResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker("/registration/worker.js", { type: "module" });
    const done = () => {
      clearTimeout(timer);
      worker.terminate();
      signal.removeEventListener("abort", cancel);
    };
    const cancel = () => {
      done();
      reject(new Error("Alignment cancelled."));
    };
    const timer = setTimeout(() => {
      done();
      reject(
        new Error(
          "Alignment took too long. Try a closer pair or adjust manually.",
        ),
      );
    }, 90000);
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) {
      cancel();
      return;
    }
    worker.onmessage = (e) => {
      done();
      e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.result);
    };
    worker.onerror = () => {
      done();
      reject(
        new Error(
          "The alignment engine could not load. Check that the app assets are available.",
        ),
      );
    };
    worker.postMessage({ fixed, moving }, [
      fixed.pixels.buffer,
      moving.pixels.buffer,
    ]);
  });
}
