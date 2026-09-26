export interface Alignment {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  stretch: number;
  shear: number;
}
export const identityAlignment: Alignment = {
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  stretch: 1,
  shear: 0,
};
// CSS affine matrix in the common display coordinate system, centered on the image.
export function affineMatrix(
  value: Alignment,
): [number, number, number, number, number, number] {
  const { x, y, rotation, scale, stretch, shear } = value;
  if (
    ![x, y, rotation, scale, stretch, shear].every(Number.isFinite) ||
    scale <= 0 ||
    stretch <= 0
  )
    throw new Error("Invalid image alignment.");
  const angle = (rotation * Math.PI) / 180,
    c = Math.cos(angle),
    s = Math.sin(angle);
  return [
    scale * c,
    scale * s,
    scale * (shear * c - stretch * s),
    scale * (shear * s + stretch * c),
    x,
    y,
  ];
}
