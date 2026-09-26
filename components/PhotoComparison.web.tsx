import React, { useState } from "react";
import { Text, View } from "react-native";
import { MolePhoto } from "@/lib/model";
import { affineMatrix, identityAlignment, Alignment } from "@/lib/alignment";
import { displayDate } from "@/lib/locations";
import { Button } from "./ui/Button";
import { Choice, Copy } from "./ui/Screen";
import { useColors } from "@/hooks/useColors";
export function PhotoComparison({ photos }: { photos: MolePhoto[] }) {
  const colors = useColors();
  const ordered = [...photos].sort((a, b) =>
    a.capturedAt.localeCompare(b.capturedAt),
  );
  const [first, setFirst] = useState(ordered[0]?.id),
    [second, setSecond] = useState(ordered[ordered.length - 1]?.id),
    [overlay, setOverlay] = useState(false),
    [advanced, setAdvanced] = useState(false),
    [opacity, setOpacity] = useState(0.5),
    [alignment, setAlignment] = useState({ ...identityAlignment });
  const a = ordered.find((p) => p.id === first),
    b = ordered.find((p) => p.id === second);
  if (!a || !b) return null;
  const choose = (setter: (v: string) => void, id: string) => {
    setter(id);
    setAlignment({ ...identityAlignment });
  };
  const matrix = affineMatrix(alignment);
  const slider = (
    key: keyof Alignment,
    label: string,
    min: number,
    max: number,
    step: number,
  ) => (
    <label
      key={key}
      style={{
        fontFamily: "Inter_400Regular, system-ui, sans-serif",
        display: "grid",
        gap: 6,
        color: colors.foreground,
        fontSize: 13,
      }}
    >
      {label}:{" "}
      {alignment[key].toFixed(
        key === "scale" || key === "stretch" || key === "shear" ? 2 : 0,
      )}
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={alignment[key]}
        onChange={(e) =>
          setAlignment((v) => ({ ...v, [key]: Number(e.target.value) }))
        }
      />
    </label>
  );
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {[
          [first, (id: string) => choose(setFirst, id), "Reference"],
          [second, (id: string) => choose(setSecond, id), "Comparison"],
        ].map(([value, setter, label]) => (
          <label
            key={String(label)}
            style={{
              fontFamily: "Inter_400Regular, system-ui, sans-serif",
              display: "grid",
              gap: 8,
              color: colors.foreground,
              flex: 1,
            }}
          >
            {String(label)}
            <select
              aria-label={`${label} photograph`}
              value={String(value)}
              onChange={(e) => (setter as (id: string) => void)(e.target.value)}
              style={{
                fontFamily: "inherit",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #ccd8ce",
                background: colors.card,
                color: colors.foreground,
              }}
            >
              {ordered.map((p, i) => (
                <option key={p.id} value={p.id}>
                  {displayDate(p.capturedAt)} · Photo {i + 1}
                </option>
              ))}
            </select>
          </label>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Choice
          label="Side by side"
          selected={!overlay}
          onPress={() => setOverlay(false)}
        />
        <Choice
          label="Align overlay"
          selected={overlay}
          onPress={() => setOverlay(true)}
        />
      </View>
      {first === second ? (
        <Copy>Choose two different photos to compare.</Copy>
      ) : overlay ? (
        <>
          <div
            style={{
              position: "relative",
              height: 360,
              overflow: "hidden",
              background: "#182720",
              borderRadius: 12,
            }}
          >
            <img
              src={a.localUri}
              alt={`Reference ${displayDate(a.capturedAt)}`}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
            <img
              src={b.localUri}
              alt={`Aligned comparison ${displayDate(b.capturedAt)}`}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                opacity,
                transform: `matrix(${matrix.join(",")})`,
                transformOrigin: "center",
              }}
            />
          </div>
          <Copy>
            Align using stable skin landmarks around the spot. Originals are
            unchanged. This visual adjustment is temporary and does not measure
            growth.
          </Copy>
          <label
            style={{
              fontFamily: "Inter_400Regular, system-ui, sans-serif",
              color: colors.foreground,
              fontSize: 13,
            }}
          >
            Comparison opacity
            <input
              aria-label="Comparison opacity"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </label>
          <div
            style={{
              fontFamily: "Inter_400Regular, system-ui, sans-serif",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: 16,
            }}
          >
            {slider("x", "Horizontal offset", -200, 200, 1)}
            {slider("y", "Vertical offset", -150, 150, 1)}
            {slider("rotation", "Rotation", -90, 90, 1)}
            {slider("scale", "Scale", 0.5, 2, 0.01)}
            {advanced && slider("stretch", "Vertical stretch", 0.5, 2, 0.01)}
            {advanced && slider("shear", "Shear", -0.5, 0.5, 0.01)}
          </div>
          <Choice
            label="Advanced affine controls"
            selected={advanced}
            onPress={() => {
              setAdvanced((v) => !v);
              setAlignment((v) => ({ ...v, stretch: 1, shear: 0 }));
            }}
          />
          {advanced && (
            <Copy>
              Stretch and shear can hide shape differences. Check the originals
              side by side before drawing conclusions.
            </Copy>
          )}
          <Button
            title="Reset alignment"
            variant="ghost"
            onPress={() => setAlignment({ ...identityAlignment })}
          />
        </>
      ) : (
        <div
          style={{
            fontFamily: "Inter_400Regular, system-ui, sans-serif",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {[a, b].map((p, i) => (
            <figure key={i} style={{ margin: 0 }}>
              <img
                src={p.localUri}
                alt={`${i ? "Comparison" : "Reference"} photo`}
                style={{
                  width: "100%",
                  height: 300,
                  objectFit: "contain",
                  background: "#182720",
                  borderRadius: 12,
                }}
              />
              <figcaption
                style={{
                  fontFamily: "Inter_400Regular, system-ui, sans-serif",
                  color: colors.mutedForeground,
                  fontSize: 12,
                  marginTop: 8,
                }}
              >
                {displayDate(p.capturedAt)}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </View>
  );
}
