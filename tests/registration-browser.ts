// Developer-only integration harness. Build into .build/test-site, never public/.
import { autoAlign } from "../lib/registration-client";
const output = document.getElementById("results")!;
import { pair } from "./registration-fixture";
const button = document.getElementById("run") as HTMLButtonElement;
button.onclick = async () => {
  button.disabled = true;
  output.textContent = "Running actual masked ITKElastix WebAssembly…";
  try {
    const first = pair(),
      expected = first.m,
      result = await autoAlign(
        first.fixed,
        first.moving,
        new AbortController().signal,
      );
    const err = Math.max(
      ...[
        [35, 35],
        [150, 35],
        [35, 150],
        [150, 150],
      ].map(([x, y]) =>
        Math.hypot(
          (result.fixedToMoving[0] - expected[0]) * x +
            (result.fixedToMoving[2] - expected[2]) * y +
            result.fixedToMoving[4] -
            expected[4],
          (result.fixedToMoving[1] - expected[1]) * x +
            (result.fixedToMoving[3] - expected[3]) * y +
            result.fixedToMoving[5] -
            expected[5],
        ),
      ),
    );
    output.textContent = `Known affine maximum landmark error: ${err.toFixed(3)} px\n`;
    if (err > 2) throw new Error("Known-transform recovery exceeded 2 pixels.");
    const next = pair(true),
      second = await autoAlign(
        next.fixed,
        next.moving,
        new AbortController().signal,
      );
    const delta = Math.max(
      ...result.fixedToMoving.map((v, i) =>
        Math.abs(v - second.fixedToMoving[i]),
      ),
    );
    output.textContent += `Excluded lesion perturbation: ${delta.toExponential(3)}\n`;
    if (delta > 0.001) throw new Error("Excluded lesion changed the fit.");
    const blank = pair();
    blank.fixed.pixels.fill(0.5);
    blank.moving.pixels.fill(0.5);
    let rejected = false;
    try {
      await autoAlign(blank.fixed, blank.moving, new AbortController().signal);
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error("Blank images should be rejected.");
    const cancelled = pair(),
      abort = new AbortController();
    const pending = autoAlign(cancelled.fixed, cancelled.moving, abort.signal);
    abort.abort();
    let stopped = false;
    try {
      await pending;
    } catch (error) {
      stopped =
        error instanceof Error && error.message === "Alignment cancelled.";
    }
    if (!stopped) throw new Error("Cancellation failed.");
    output.textContent +=
      "PASS: actual masked WASM affine recovery, lesion invariance, blank-image rejection, and cancellation.";
  } catch (e) {
    output.textContent +=
      "\nFAIL: " + (e instanceof Error ? e.message : String(e));
  } finally {
    button.disabled = false;
  }
};
