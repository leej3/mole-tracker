export interface PhotoInputBehavior {
  capture?: "environment";
  helperText: string;
}

export function getPhotoInputBehavior(): PhotoInputBehavior {
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const hasCaptureSupport = typeof document !== "undefined" && "capture" in document.createElement("input");
  const hasCoarsePointer = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  const mobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
  if (hasCaptureSupport && hasCoarsePointer && mobile) {
    return {
      capture: "environment",
      helperText: "On supported phones, Add photo opens the camera first. You can still choose a saved image.",
    };
  }
  return { helperText: "Choose a photo from your device." };
}
