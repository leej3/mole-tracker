const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const out = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/registration.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  { exports: out, Uint8Array, Float32Array, Number, Math, Error },
);
const { samplingMask, fromElastix, invertMatrix, scoreAlignment } = out;
function fixture() {
  const width = 128,
    height = 128,
    pixels = Float32Array.from(
      { length: width * height },
      (_, i) =>
        0.5 +
        0.2 * Math.sin((i % width) * 0.13) +
        0.2 * Math.cos(Math.floor(i / width) * 0.21),
    );
  return { width, height, pixels, exclusion: { x: 64, y: 64, radius: 12 } };
}
test("sampling mask excludes lesion, guard band and image edges", () => {
  const a = fixture(),
    m = samplingMask(a);
  assert.equal(m[64 * 128 + 64], 0);
  assert.equal(m[64 * 128 + 87], 0);
  assert.equal(m[64 * 128 + 100], 1);
  assert.equal(m[0], 0);
  assert.throws(() =>
    samplingMask({ ...a, exclusion: { x: NaN, y: 64, radius: 12 } }),
  );
});
test("Elastix centered fixed-to-moving transform becomes correct pixel mapping", () => {
  const m = fromElastix(
    [
      {
        Transform: ["AffineTransform"],
        TransformParameters: ["1.1", ".1", "-.1", ".9", "3", "4"],
        CenterOfRotationPoint: ["50", "40"],
      },
    ],
    [10, -5],
  );
  assert.ok(Math.abs(m[4] + 16) < 1e-8);
  assert.ok(Math.abs(m[5] - 18) < 1e-8);
  const inverse = invertMatrix(m),
    x = 17,
    y = 23,
    u = m[0] * x + m[2] * y + m[4],
    v = m[1] * x + m[3] * y + m[5];
  assert.ok(Math.abs(inverse[0] * u + inverse[2] * v + inverse[4] - x) < 1e-8);
  assert.ok(Math.abs(inverse[1] * u + inverse[3] * v + inverse[5] - y) < 1e-8);
  assert.throws(() => invertMatrix([0, 0, 0, 0, 0, 0]));
});
test("quality checks ignore lesion changes and reject textureless or unrelated images", () => {
  const a = fixture(),
    b = fixture();
  for (let y = 53; y <= 75; y++)
    for (let x = 53; x <= 75; x++) b.pixels[y * 128 + x] = 1;
  const result = scoreAlignment(a, b, [1, 0, 0, 1, 0, 0]);
  assert.ok(result.correlation > 0.99);
  const flat = { ...b, pixels: new Float32Array(128 * 128).fill(0.5) };
  assert.throws(() => scoreAlignment(a, flat, [1, 0, 0, 1, 0, 0]));
  assert.throws(() => scoreAlignment(a, b, [1, 0, 0, 1, 120, 120]));
});
