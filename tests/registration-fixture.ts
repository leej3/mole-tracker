import { invertMatrix, RegistrationImage, Matrix } from "../lib/registration";
function source(x: number, y: number) {
  let v = 0.5 + 0.08 * Math.sin(x * 0.19) * Math.cos(y * 0.12);
  for (let k = 0; k < 31; k++) {
    const cx = 15 + ((k * 37) % 160),
      cy = 14 + ((k * 59) % 160);
    v -= 0.22 * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (8 + (k % 5) * 7));
  }
  return v;
}
export function pair(changed = false) {
  const w = 192,
    angle = 0.06,
    a = Math.cos(angle) * 1.02,
    b = Math.sin(angle) * 1.02,
    m: Matrix = [a, b, -b, a, 6, -5],
    inv = invertMatrix(m);
  const fx = 96,
    fy = 96,
    mx = m[0] * fx + m[2] * fy + m[4],
    my = m[1] * fx + m[3] * fy + m[5];
  const fixed: RegistrationImage = {
      width: w,
      height: w,
      pixels: new Float32Array(w * w),
      exclusion: { x: fx, y: fy, radius: 22 },
    },
    moving: RegistrationImage = {
      width: w,
      height: w,
      pixels: new Float32Array(w * w),
      exclusion: { x: mx, y: my, radius: 22 },
    };
  for (let y = 0; y < w; y++)
    for (let x = 0; x < w; x++) {
      fixed.pixels[y * w + x] = source(x, y);
      moving.pixels[y * w + x] = source(
        inv[0] * x + inv[2] * y + inv[4],
        inv[1] * x + inv[3] * y + inv[5],
      );
      if ((x - fx) ** 2 + (y - fy) ** 2 < 18 ** 2)
        fixed.pixels[y * w + x] = 0.05;
      if ((x - mx) ** 2 + (y - my) ** 2 < 18 ** 2)
        moving.pixels[y * w + x] = changed ? 0.95 : 0.05;
    }
  return { fixed, moving, m };
}
