import React, { useState } from "react";
import { Image, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SymptomFlag, useApp } from "@/context/AppContext";
import { Screen, Panel, Copy, Field, Choice } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { pickPhoto } from "@/lib/photo-picker";
import { REGIONS, regionLabel, localDay } from "@/lib/locations";
import { SYMPTOM_LABELS } from "@/utils/scoring";
import { useColors } from "@/hooks/useColors";
export default function NewSpot() {
  const { createMole, activeProfileId, draftLocation, setDraftLocation } =
    useApp();
  const router = useRouter(),
    colors = useColors();
  const [step, setStep] = useState(0),
    [name, setName] = useState(""),
    [region, setRegion] = useState(draftLocation?.region || ""),
    [side, setSide] = useState<"front" | "back">(
      draftLocation?.view || "front",
    );
  const [date, setDate] = useState(localDay()),
    [size, setSize] = useState(""),
    [note, setNote] = useState(""),
    [photo, setPhoto] = useState<string | null>(null),
    [symptoms, setSymptoms] = useState<SymptomFlag[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const choosePhoto = async () => {
    setBusy(true);
    try {
      const uri = await pickPhoto();
      if (uri) setPhoto(uri);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add photo.");
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    if (!activeProfileId) return;
    setBusy(true);
    setError("");
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new Error("Enter the date as YYYY-MM-DD.");
      const mole = await createMole(
        {
          profileId: activeProfileId,
          defaultName: regionLabel(region),
          customName: name.trim() || undefined,
          bodyRegion: region,
          bodyView: side,
          bodyX: draftLocation?.region === region ? draftLocation.x : 0.5,
          bodyY: draftLocation?.region === region ? draftLocation.y : 0.5,
          bodyZ: 0,
          firstNoticedDate: date,
          latestSizeMm: size ? Number(size) : undefined,
          symptomFlags: symptoms,
        },
        note.trim(),
        photo || undefined,
      );
      setDraftLocation(null);
      router.replace(`/mole/${mole.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Record could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      title="Record a spot"
      subtitle="Start with what you know. You can add more detail over time."
    >
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {["1 · Locate", "2 · Photograph", "3 · Save"].map((label, i) => (
          <Choice
            key={label}
            label={label}
            selected={step === i}
            onPress={() => {
              if (i === 0 || region) setStep(i);
            }}
          />
        ))}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
          {error}
        </Text>
      ) : null}
      {step === 0 ? (
        <Panel title="Where is it?">
          <Field
            label="A recognizable name (optional)"
            placeholder="e.g. Left shoulder spot"
            value={name}
            onChangeText={setName}
            maxLength={200}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["front", "back"] as const).map((v) => (
              <Choice
                key={v}
                label={regionLabel(v)}
                selected={side === v}
                onPress={() => setSide(v)}
              />
            ))}
          </View>
          <Copy>
            {draftLocation
              ? "A position is selected on the map. You can change the region below."
              : "Choose a region. The location marker will start at its center."}
          </Copy>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {REGIONS.map((r) => (
              <Choice
                key={r}
                label={regionLabel(r)}
                selected={region === r}
                onPress={() => setRegion(r)}
              />
            ))}
          </View>
          <Button
            title="Continue to photo"
            disabled={!region}
            onPress={() => setStep(1)}
          />
        </Panel>
      ) : step === 1 ? (
        <Panel title="Make a useful reference">
          <Copy>
            Use even lighting, a steady camera and a similar distance each time.
            Include a ruler if you want a size reference. Photos are re-encoded
            without location metadata, at up to 2400 pixels.
          </Copy>
          {photo && (
            <Image
              source={{ uri: photo }}
              resizeMode="contain"
              style={{ width: "100%", height: 300, borderRadius: 12 }}
            />
          )}
          <Button
            title={photo ? "Choose another photo" : "Take or choose a photo"}
            loading={busy}
            onPress={() => void choosePhoto()}
          />
          <Button
            title={photo ? "Continue" : "Skip photo for now"}
            variant="ghost"
            onPress={() => setStep(2)}
          />
        </Panel>
      ) : (
        <Panel title="A few details, if useful">
          <Copy>
            {name || regionLabel(region)} · {side}. You’re saving this to the
            active profile.
          </Copy>
          <Field
            label="First noticed (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
          />
          <Field
            label="Estimated size in millimeters (optional)"
            value={size}
            onChangeText={setSize}
            keyboardType="decimal-pad"
            placeholder="e.g. 4.5"
          />
          <Field
            label="Observation (optional)"
            multiline
            value={note}
            onChangeText={setNote}
            placeholder="What would you like to remember?"
            maxLength={20000}
          />
          <Copy>Symptoms you noticed (optional)</Copy>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(SYMPTOM_LABELS).map(([key, label]) => (
              <Choice
                key={key}
                label={label}
                selected={symptoms.includes(key as SymptomFlag)}
                onPress={() =>
                  setSymptoms((current) =>
                    current.includes(key as SymptomFlag)
                      ? current.filter((v) => v !== key)
                      : key === "none"
                        ? ["none"]
                        : [
                            ...current.filter((v) => v !== "none"),
                            key as SymptomFlag,
                          ],
                  )
                }
              />
            ))}
          </View>
          <Button
            title="Save record to this device"
            loading={busy}
            onPress={() => void save()}
          />
        </Panel>
      )}
    </Screen>
  );
}
