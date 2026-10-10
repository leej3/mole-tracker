import React, { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import { Button } from "./ui/Button";
import { Copy } from "./ui/Screen";
import { useColors } from "@/hooks/useColors";
import { autoAlign, prepareImage } from "@/lib/registration-client";
import { Exclusion, invertMatrix } from "@/lib/registration";
interface Props {
  fixedUri: string;
  movingUri: string;
  onAligned: (uri: string) => void;
  onReset: () => void;
}
export function AutomaticAlignment({
  fixedUri,
  movingUri,
  onAligned,
  onReset,
}: Props) {
  const colors = useColors(),
    controller = useRef<AbortController | null>(null);
  const [regions, setRegions] = useState<Exclusion[]>([
    { x: 0.5, y: 0.5, radius: 0.12 },
    { x: 0.5, y: 0.5, radius: 0.12 },
  ]);
  const [dimensions, setDimensions] = useState([
    [1, 1],
    [1, 1],
  ]);
  const [marked, setMarked] = useState([false, false]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [candidate, setCandidate] = useState<string | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const update = (i: number, patch: Partial<Exclusion>) => {
    setRegions((v) => v.map((e, j) => (i === j ? { ...e, ...patch } : e)));
    setCandidate(null);
    setMessage("");
    onReset();
  };
  const run = async () => {
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setCandidate(null);
    setMessage("Aligning surrounding skin on this device…");
    try {
      const fixed = await prepareImage(fixedUri, regions[0]),
        moving = await prepareImage(movingUri, regions[1]);
      if (abort.signal.aborted) return;
      const result = await autoAlign(fixed, moving, abort.signal);
      if (abort.signal.aborted) return;
      const image = new window.Image();
      image.src = movingUri;
      await image.decode();
      if (abort.signal.aborted) return;
      const canvas = document.createElement("canvas");
      canvas.width = fixed.width;
      canvas.height = fixed.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Image preview unavailable.");
      ctx.setTransform(...invertMatrix(result.fixedToMoving));
      ctx.drawImage(image, 0, 0, moving.width, moving.height);
      setCandidate(canvas.toDataURL("image/png"));
      setMessage(
        "Alignment ready. Preview it, then compare with the originals.",
      );
    } catch (error) {
      if (!abort.signal.aborted)
        setMessage(
          error instanceof Error ? error.message : "Alignment failed.",
        );
    } finally {
      if (controller.current === abort) {
        setBusy(false);
        controller.current = null;
      }
    }
  };
  return (
    <View style={{ gap: 14 }}>
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: 18,
          color: colors.foreground,
        }}
      >
        Align surrounding skin
      </Text>
      <Copy>
        Mark the mole’s center in each photo, then enlarge the circle to cover
        the whole mole and a little surrounding margin. Matching uses the skin
        outside these circles. Centers provide a starting position only.
      </Copy>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
          fontFamily: "Inter_400Regular,system-ui,sans-serif",
          color: colors.foreground,
        }}
      >
        {[fixedUri, movingUri].map((uri, i) => (
          <div key={i} style={{ display: "grid", gap: 8 }}>
            <strong>{i ? "Comparison" : "Reference"}</strong>
            <div style={{ position: "relative", lineHeight: 0 }}>
              <img
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setDimensions((v) =>
                    v.map((d, j) =>
                      j === i ? [img.naturalWidth, img.naturalHeight] : d,
                    ),
                  );
                }}
                src={uri}
                alt={`${i ? "Comparison" : "Reference"}: mark mole center`}
                style={{
                  width: "100%",
                  display: "block",
                  borderRadius: 10,
                  cursor: busy ? "wait" : "crosshair",
                }}
                onClick={(e) => {
                  if (busy) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  update(i, {
                    x: Math.min(
                      0.99,
                      Math.max(0.01, (e.clientX - r.left) / r.width),
                    ),
                    y: Math.min(
                      0.99,
                      Math.max(0.01, (e.clientY - r.top) / r.height),
                    ),
                  });
                  setMarked((v) => v.map((b, j) => (j === i ? true : b)));
                }}
              />
              <svg
                viewBox={`0 0 ${dimensions[i][0]} ${dimensions[i][1]}`}
                preserveAspectRatio="none"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              >
                <circle
                  cx={regions[i].x * dimensions[i][0]}
                  cy={regions[i].y * dimensions[i][1]}
                  r={regions[i].radius * Math.min(...dimensions[i])}
                  fill="rgba(255,160,50,.2)"
                  stroke="#ffb75d"
                  strokeWidth={Math.min(...dimensions[i]) * 0.006}
                />
              </svg>
            </div>
            <label>
              Horizontal center
              <input
                aria-label={`${i ? "Comparison" : "Reference"} horizontal center`}
                disabled={busy}
                type="range"
                min=".01"
                max=".99"
                step=".01"
                value={regions[i].x}
                onChange={(e) => {
                  update(i, { x: Number(e.target.value) });
                  setMarked((v) => v.map((b, j) => (j === i ? true : b)));
                }}
                style={{ width: "100%" }}
              />
            </label>
            <label>
              Vertical center
              <input
                aria-label={`${i ? "Comparison" : "Reference"} vertical center`}
                disabled={busy}
                type="range"
                min=".01"
                max=".99"
                step=".01"
                value={regions[i].y}
                onChange={(e) => {
                  update(i, { y: Number(e.target.value) });
                  setMarked((v) => v.map((b, j) => (j === i ? true : b)));
                }}
                style={{ width: "100%" }}
              />
            </label>
            <label>
              Excluded radius
              <input
                aria-label={`${i ? "Comparison" : "Reference"} excluded radius`}
                disabled={busy}
                type="range"
                min=".03"
                max=".35"
                step=".01"
                value={regions[i].radius}
                onChange={(e) => update(i, { radius: Number(e.target.value) })}
                style={{ width: "100%" }}
              />
            </label>
            <Button
              title={
                marked[i]
                  ? `${i ? "Comparison" : "Reference"} center marked`
                  : `Use ${i ? "comparison" : "reference"} center`
              }
              variant="ghost"
              disabled={busy}
              onPress={() =>
                setMarked((v) => v.map((b, j) => (j === i ? true : b)))
              }
            />
          </div>
        ))}
      </div>
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        <Button
          title={busy ? "Aligning…" : "Auto-align skin"}
          disabled={busy || !marked.every(Boolean)}
          onPress={() => void run()}
        />
        {busy && (
          <Button
            title="Cancel alignment"
            variant="ghost"
            onPress={() => {
              controller.current?.abort();
              setMessage("Alignment cancelled.");
            }}
          />
        )}
        {candidate && (
          <Button
            title="Preview aligned overlay"
            variant="secondary"
            onPress={() => onAligned(candidate)}
          />
        )}
      </View>
      {message ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.foreground }}
        >
          {message}
        </Text>
      ) : null}
      <Copy>
        Alignment is temporary. Originals are unchanged. This matches image
        appearance; it does not measure physical growth.
      </Copy>
    </View>
  );
}
