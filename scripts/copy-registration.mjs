import { mkdirSync, copyFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { build } from "esbuild";
const manifest = JSON.parse(
  readFileSync("vendor/itkelastix/dist/manifest.json", "utf8"),
);
for (const [name, digest] of Object.entries(manifest.files))
  if (
    createHash("sha256")
      .update(readFileSync(`vendor/itkelastix/dist/${name}`))
      .digest("hex") !== digest
  )
    throw new Error(`Registration asset checksum mismatch: ${name}`);
const pin = JSON.parse(readFileSync("vendor/itkelastix/upstream.json", "utf8"));
for (const key of ["revision", "image", "runtime"])
  if (manifest[key] !== pin[key])
    throw new Error(
      "Registration build provenance mismatch. Rebuild the engine.",
    );
for (const [name, digest] of Object.entries(manifest.patches))
  if (
    createHash("sha256")
      .update(readFileSync(`vendor/itkelastix/${name}`))
      .digest("hex") !== digest
  )
    throw new Error("Registration patch changed. Rebuild the engine.");
if (
  createHash("sha256")
    .update(readFileSync("vendor/itkelastix/runtime/itk-wasm.js"))
    .digest("hex") !== pin.runtimeBrowserSha256
)
  throw new Error("Browser runtime checksum mismatch.");
mkdirSync("public/registration", { recursive: true });
for (const name of ["elastix.js", "elastix.wasm.zst"])
  copyFileSync(`vendor/itkelastix/dist/${name}`, `public/registration/${name}`);
copyFileSync("vendor/itkelastix/LICENSE", "public/registration/LICENSE");
copyFileSync("vendor/itkelastix/NOTICE", "public/registration/NOTICE");
copyFileSync(
  "vendor/itkelastix/runtime/LICENSE",
  "public/registration/RUNTIME-LICENSE",
);
await build({
  entryPoints: ["lib/registration.worker.ts"],
  outfile: "public/registration/worker.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  conditions: ["browser"],
  loader: { ".worker.js": "dataurl" },
  minify: true,
});
