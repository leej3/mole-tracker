// Shared registration contract. Coordinates are pixels in bounded working images.
export interface Exclusion {
  x: number;
  y: number;
  radius: number;
}
export interface RegistrationImage {
  width: number;
  height: number;
  pixels: Float32Array;
  exclusion: Exclusion;
}
export type Matrix = [number, number, number, number, number, number]; // x'=ax+cy+e; y'=bx+dy+f
export interface RegistrationResult {
  fixedToMoving: Matrix;
  correlation: number;
  overlap: number;
}
export function samplingMask(image: RegistrationImage): Uint8Array {
  const { width, height, pixels, exclusion: e } = image;
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 32 ||
    height < 32 ||
    width > 512 ||
    height > 512 ||
    pixels.length !== width * height ||
    ![e.x, e.y, e.radius].every(Number.isFinite) ||
    e.x < 0 ||
    e.x >= width ||
    e.y < 0 ||
    e.y >= height ||
    e.radius < 4 ||
    e.radius > Math.min(width, height) * 0.4
  )
    throw new Error("Invalid registration image or exclusion.");
  const mask = new Uint8Array(width * height);
  let count = 0;
  // Extra margin keeps interpolation and pyramid smoothing away from the lesion.
  const r = e.radius + 12;
  for (let y = 8; y < height - 8; y++)
    for (let x = 8; x < width - 8; x++)
      if ((x - e.x) ** 2 + (y - e.y) ** 2 > r * r) {
        mask[y * width + x] = 1;
        count++;
      }
  if (count < width * height * 0.25)
    throw new Error("Leave more surrounding skin visible for alignment.");
  return mask;
}
export function invertMatrix(m: Matrix): Matrix {
  const [a, b, c, d, e, f] = m,
    det = a * d - b * c;
  if (!m.every(Number.isFinite) || det <= 0.1 || det > 10)
    throw new Error("The alignment is degenerate or has implausible scale.");
  return [
    d / det,
    -b / det,
    -c / det,
    a / det,
    (c * f - d * e) / det,
    (b * e - a * f) / det,
  ];
}
export function fromElastix(value: unknown, movingOrigin: number[]): Matrix {
  const maps = value as Array<Record<string, unknown[]>>;
  if (
    !Array.isArray(maps) ||
    maps.length !== 1 ||
    maps[0].Transform?.[0] !== "AffineTransform"
  )
    throw new Error("Unexpected registration transform.");
  const p = maps[0].TransformParameters?.map(Number),
    center = maps[0].CenterOfRotationPoint?.map(Number);
  if (p?.length !== 6 || center?.length !== 2)
    throw new Error("Incomplete registration transform.");
  const [a, c, b, d, tx, ty] = p,
    [cx, cy] = center;
  const m: Matrix = [
    a,
    b,
    c,
    d,
    tx + cx - a * cx - c * cy - movingOrigin[0],
    ty + cy - b * cx - d * cy - movingOrigin[1],
  ];
  invertMatrix(m);
  return m;
}
export function scoreAlignment(
  fixed: RegistrationImage,
  moving: RegistrationImage,
  m: Matrix,
): RegistrationResult {
  const fm = samplingMask(fixed),
    mm = samplingMask(moving);
  let n = 0,
    total = 0,
    sx = 0,
    sy = 0,
    sxx = 0,
    syy = 0,
    sxy = 0;
  for (let y = 0; y < fixed.height; y += 2)
    for (let x = 0; x < fixed.width; x += 2) {
      if (!fm[y * fixed.width + x]) continue;
      total++;
      const u = m[0] * x + m[2] * y + m[4],
        v = m[1] * x + m[3] * y + m[5],
        ix = Math.floor(u),
        iy = Math.floor(v);
      if (ix < 0 || iy < 0 || ix + 1 >= moving.width || iy + 1 >= moving.height)
        continue;
      const i = iy * moving.width + ix,
        j = i + moving.width;
      if (!mm[i] || !mm[i + 1] || !mm[j] || !mm[j + 1]) continue;
      const dx = u - ix,
        dy = v - iy,
        a = fixed.pixels[y * fixed.width + x],
        b =
          (moving.pixels[i] * (1 - dx) + moving.pixels[i + 1] * dx) * (1 - dy) +
          (moving.pixels[j] * (1 - dx) + moving.pixels[j + 1] * dx) * dy;
      n++;
      sx += a;
      sy += b;
      sxx += a * a;
      syy += b * b;
      sxy += a * b;
    }
  const varianceX = sxx - (sx * sx) / n,
    varianceY = syy - (sy * sy) / n;
  const correlation = (sxy - (sx * sy) / n) / Math.sqrt(varianceX * varianceY),
    overlap = n / total;
  if (
    n < 100 ||
    varianceX / n < 0.0001 ||
    varianceY / n < 0.0001 ||
    !Number.isFinite(correlation) ||
    correlation < 0.55 ||
    overlap < 0.5
  )
    throw new Error(
      "No reliable skin alignment found. Try photos with more shared detail or adjust manually.",
    );
  const inv = invertMatrix(m),
    sxFit = Math.hypot(inv[0], inv[1]),
    syFit = Math.hypot(inv[2], inv[3]);
  if (
    sxFit < 0.5 ||
    sxFit > 2 ||
    syFit < 0.5 ||
    syFit > 2 ||
    Math.abs(inv[0] * inv[2] + inv[1] * inv[3]) / (sxFit * syFit) > 0.5
  )
    throw new Error(
      "The proposed alignment distorts the image too much. Adjust manually.",
    );
  return { fixedToMoving: m, correlation, overlap };
}
