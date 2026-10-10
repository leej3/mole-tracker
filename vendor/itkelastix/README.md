# Masked ITKElastix browser build

This directory contains the pinned source reference, patches and distributable
WebAssembly artifacts for Mole Tracker's browser registration.
ITKElastix and elastix are Apache-2.0 projects; their notices remain applicable.
See LICENSE and the upstream source for dependency notices.

- `upstream.json` identifies the ITKElastix revision and build environment.
  Its CMake file also pins SuperElastix/elastix.
- `masks.patch` adds optional `--fixed-mask` and `--moving-mask` image inputs,
  passed to the existing native registration mask setters.
- `browser-profile.patch` restricts the app's build to 2D float images and the
  registration executable.
  This is separate from the reusable mask extension.
- `dist/` contains the compiled engine used by normal builds.
  Docker is required to rebuild it, not to run the app or build its interface.

Run `npm run build:registration` with Docker running to rebuild the engine.
The container mounts only `.build/itkelastix`; it receives no home directory,
credentials, Docker socket or patient data.
Then run `npm run build` to bundle the worker and copy all assets into `dist/`.
The runtime loads same-origin assets on demand and uses no image service or CDN.
The self-contained official ITK-Wasm browser bundle is vendored in `runtime/`;
its npm package integrity and file checksum are recorded in `upstream.json`.
This avoids installing the unrelated Node CLI and archive extraction tooling.

Registration uses 512-pixel working images, binary masks in both image spaces,
and a 12-pixel sampling guard band around each exclusion.
Excluded lesion pixels are neutralized before pyramid construction as additional
protection against their values affecting smoothing; masks also exclude that
artificial boundary.
The marked centers set the moving image's initial physical origin; they are not
constraints on the optimized transform.
The worker performs a three-resolution affine registration with normalized
correlation.
Originals are never resampled in storage.

The returned ITK transform maps fixed physical coordinates to moving physical
coordinates.
The adapter converts it to image pixels and inverts it only when rendering the
moving image onto the fixed canvas.
Quality checks reject low texture, overlap below 50%, correlation below 0.55,
reflections, degenerate transforms, large scale changes and excessive shear.
These are engineering rejection thresholds, not calibrated clinical confidence.
The user previews the result, and can compare originals or reset it.

`npm test` checks masks, transform direction and quality gates.
For the actual engine regression, run `npm run copy:registration` followed by
`node scripts/prepare-registration-test.mjs`, serve `.build/test-site` on
loopback, and press **Run masked registration tests** in a browser.
It tests a known affine transform, changed lesion pixels and textureless images.
The generated fixtures and test site are excluded from Git and deployment.

## Verification on 10 October 2026

The actual browser WebAssembly test recovered the synthetic affine transform
with a maximum landmark error of 0.005 pixels.
Changing the excluded lesion from dark to bright produced no change in the
fitted matrix.
Textureless pairs were rejected and cancellation terminated the worker.
The 13 unit tests and production web build also pass.
These checks establish synthetic behavior, not accuracy on real skin photographs
or mobile performance.
