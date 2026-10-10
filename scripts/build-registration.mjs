// Rebuild the audited mask extension; Docker is required only by developers.
import {
  readFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const pin = JSON.parse(readFileSync("vendor/itkelastix/upstream.json", "utf8"));
const root = process.cwd(),
  source = `${root}/.build/itkelastix`;
const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: "inherit", ...opts });
mkdirSync(source, { recursive: true });
if (!existsSync(`${source}/CMakeLists.txt`)) {
  run("curl", [
    "-fL",
    `${pin.repository.replace("github.com", "codeload.github.com")}/tar.gz/${pin.revision}`,
    "-o",
    `${root}/.build/itkelastix.tar.gz`,
  ]);
  run("tar", [
    "-xzf",
    `${root}/.build/itkelastix.tar.gz`,
    "--strip-components=1",
    "-C",
    source,
  ]);
  writeFileSync(`${source}/.mole-upstream-revision`, pin.revision);
}
if (
  readFileSync(`${source}/.mole-upstream-revision`, "utf8").trim() !==
  pin.revision
)
  throw new Error(
    "Build cache revision differs from upstream.json. Use a fresh .build/itkelastix source directory.",
  );
for (const patch of ["masks.patch", "browser-profile.patch"]) {
  try {
    run(
      "patch",
      [
        "--dry-run",
        "--forward",
        "--batch",
        "-p1",
        "-i",
        `${root}/vendor/itkelastix/${patch}`,
      ],
      { cwd: source },
    );
    run(
      "patch",
      [
        "--forward",
        "--batch",
        "-p1",
        "-i",
        `${root}/vendor/itkelastix/${patch}`,
      ],
      { cwd: source },
    );
  } catch {
    run(
      "patch",
      [
        "--dry-run",
        "--batch",
        "-R",
        "-p1",
        "-i",
        `${root}/vendor/itkelastix/${patch}`,
      ],
      { cwd: source },
    );
  }
}
run("docker", [
  "run",
  "--rm",
  "--platform",
  "linux/amd64",
  "--entrypoint",
  "/usr/local/bin/web-build",
  "--workdir",
  "/work",
  "--mount",
  `type=bind,source=${source},target=/work`,
  pin.image,
  "emscripten-build",
  "-DCMAKE_BUILD_TYPE=Release",
  "-DBUILD_TESTING=OFF",
  "-DELASTIX_IMAGE_DIMENSIONS=2",
  "-DELASTIX_IMAGE_2D_PIXELTYPES=float",
]);
mkdirSync("vendor/itkelastix/dist", { recursive: true });
for (const name of ["elastix.js", "elastix.wasm.zst"])
  copyFileSync(
    `${source}/emscripten-build/${name}`,
    `vendor/itkelastix/dist/${name}`,
  );

const sha256 = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
writeFileSync(
  "vendor/itkelastix/dist/manifest.json",
  JSON.stringify(
    {
      ...pin,
      patches: Object.fromEntries(
        ["masks.patch", "browser-profile.patch"].map((name) => [
          name,
          sha256(`vendor/itkelastix/${name}`),
        ]),
      ),
      files: Object.fromEntries(
        ["elastix.js", "elastix.wasm.zst"].map((name) => [
          name,
          sha256(`vendor/itkelastix/dist/${name}`),
        ]),
      ),
    },
    null,
    2,
  ) + "\n",
);
