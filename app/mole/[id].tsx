import React, { useState } from "react";
import { Image, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymptomFlag, useApp } from "@/context/AppContext";
import { Screen, Panel, Copy, Field, Choice } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { PhotoComparison } from "@/components/PhotoComparison";
import { pickPhoto } from "@/lib/photo-picker";
import { displayDate, regionLabel, localDay } from "@/lib/locations";
import { SYMPTOM_LABELS } from "@/utils/scoring";
import { useColors } from "@/hooks/useColors";
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    router = useRouter(),
    colors = useColors();
  const {
    getMoleById,
    updateMole,
    addMolePhoto,
    deleteMolePhoto,
    addUpdateLog,
    deleteMole,
  } = useApp();
  const mole = getMoleById(id);
  const [tab, setTab] = useState("history"),
    [adding, setAdding] = useState(false),
    [note, setNote] = useState(""),
    [size, setSize] = useState(""),
    [date, setDate] = useState(localDay()),
    [flags, setFlags] = useState<SymptomFlag[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [deleting, setDeleting] = useState<string | null>(null),
    [rename, setRename] = useState(false),
    [name, setName] = useState("");
  const [photoDraft, setPhotoDraft] = useState<string | null>(null),
    [photoDate, setPhotoDate] = useState(localDay());
  if (!mole)
    return (
      <Screen title="Record unavailable">
        <Copy>
          This record may have been removed or belongs to a different history.
        </Copy>
      </Screen>
    );
  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await operation();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The change could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };
  const addPhoto = () =>
    run(async () => {
      const photo = await pickPhoto();
      if (photo) {
        setPhotoDraft(photo);
        setTab("photos");
      }
    });
  const saveLog = () =>
    run(async () => {
      if (!note.trim() && !size && !flags.length)
        throw new Error("Add a note, size estimate or symptom.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new Error("Enter the date as YYYY-MM-DD.");
      await addUpdateLog(mole.id, {
        timestamp: `${date}T12:00:00`,
        note: note.trim() || undefined,
        sizeMm: size ? Number(size) : undefined,
        symptomChanges: flags.length ? flags : undefined,
      });
      setAdding(false);
      setNote("");
      setSize("");
      setFlags([]);
    });
  return (
    <Screen
      title={mole.customName || mole.defaultName}
      subtitle={`${regionLabel(mole.bodyRegion)} · ${regionLabel(mole.bodyView)} · First noticed ${displayDate(mole.firstNoticedDate)}`}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Button
          title="Add observation"
          onPress={() => {
            setAdding(true);
            setTab("history");
          }}
        />
        <Button
          title="Add photo"
          variant="secondary"
          loading={busy}
          onPress={() => void addPhoto()}
        />
        <Button
          title="Rename"
          variant="ghost"
          onPress={() => {
            setRename((v) => !v);
            setName(mole.customName || mole.defaultName);
          }}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.destructive }}>
          {error}
        </Text>
      ) : null}
      {rename && (
        <Panel title="Record name">
          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            maxLength={200}
          />
          <Button
            title="Save name"
            loading={busy}
            onPress={() =>
              void run(async () => {
                await updateMole(mole.id, {
                  customName: name.trim() || undefined,
                });
                setRename(false);
              })
            }
          />
        </Panel>
      )}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {[
          ["history", "History"],
          ["photos", `Photos (${mole.photos.length})`],
          ["compare", "Compare"],
        ].map(([key, label]) => (
          <Choice
            key={key}
            label={label}
            selected={tab === key}
            onPress={() => setTab(key)}
          />
        ))}
      </View>
      {tab === "history" ? (
        <>
          {adding && (
            <Panel title="What have you noticed?">
              <Field
                label="Observation date (YYYY-MM-DD)"
                value={date}
                onChangeText={setDate}
              />
              <Field
                label="Your observation"
                multiline
                value={note}
                onChangeText={setNote}
                placeholder="Changes, symptoms, or something to ask at your next visit"
              />
              <Field
                label="Estimated size in millimeters (optional)"
                value={size}
                onChangeText={setSize}
                keyboardType="decimal-pad"
              />
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(SYMPTOM_LABELS).map(([key, label]) => (
                  <Choice
                    key={key}
                    label={label}
                    selected={flags.includes(key as SymptomFlag)}
                    onPress={() =>
                      setFlags((v) =>
                        v.includes(key as SymptomFlag)
                          ? v.filter((f) => f !== key)
                          : key === "none"
                            ? ["none"]
                            : [
                                ...v.filter((f) => f !== "none"),
                                key as SymptomFlag,
                              ],
                      )
                    }
                  />
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button
                  title="Save observation"
                  loading={busy}
                  onPress={() => void saveLog()}
                />
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => setAdding(false)}
                  disabled={busy}
                />
              </View>
            </Panel>
          )}
          <Panel title="At a glance">
            <Copy>
              {mole.latestSizeMm
                ? `Latest size estimate: ${mole.latestSizeMm} mm`
                : "Size not recorded"}{" "}
              · {mole.photos.length} photos · {mole.updateLog.length}{" "}
              observations
            </Copy>
            <Copy>
              Symptoms:{" "}
              {mole.symptomFlags.length
                ? mole.symptomFlags.map((s) => SYMPTOM_LABELS[s]).join(", ")
                : "Not recorded"}
            </Copy>
            {[mole.colorNotes, mole.borderNotes, mole.shapeNotes]
              .filter(Boolean)
              .map((value, i) => (
                <Copy key={i}>{value}</Copy>
              ))}
          </Panel>
          {!mole.updateLog.length ? (
            <Panel title="The next observation starts here">
              <Copy>
                Add a note or a size estimate to begin a dated history.
              </Copy>
            </Panel>
          ) : (
            [...mole.updateLog]
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
              .map((log) => (
                <Panel key={log.id} title={displayDate(log.timestamp)}>
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                      fontSize: 16,
                      lineHeight: 25,
                      color: colors.foreground,
                    }}
                  >
                    {log.note || "Observation recorded"}
                  </Text>
                  {log.sizeMm !== undefined && (
                    <Copy>Estimated size: {log.sizeMm} mm</Copy>
                  )}
                  {log.symptomChanges?.length ? (
                    <Copy>
                      {log.symptomChanges
                        .map((s) => SYMPTOM_LABELS[s])
                        .join(" · ")}
                    </Copy>
                  ) : null}
                </Panel>
              ))
          )}
        </>
      ) : tab === "compare" ? (
        <Panel title="Look at two moments together">
          {mole.photos.length < 2 ? (
            <Copy>
              Add at least two photos to compare dates and align an overlay.
            </Copy>
          ) : (
            <PhotoComparison photos={mole.photos} />
          )}
        </Panel>
      ) : (
        <>
          {photoDraft && (
            <Panel title="Save this photograph">
              <Image
                source={{ uri: photoDraft }}
                resizeMode="contain"
                style={{ height: 280, width: "100%" }}
              />
              <Field
                label="Photo date (YYYY-MM-DD)"
                value={photoDate}
                onChangeText={setPhotoDate}
              />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                <Button
                  title="Save photo"
                  loading={busy}
                  onPress={() =>
                    void run(async () => {
                      if (!/^\d{4}-\d{2}-\d{2}$/.test(photoDate))
                        throw new Error("Enter the date as YYYY-MM-DD.");
                      await addMolePhoto(mole.id, {
                        localUri: photoDraft,
                        capturedAt: `${photoDate}T12:00:00`,
                      });
                      setPhotoDraft(null);
                    })
                  }
                />
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => setPhotoDraft(null)}
                />
              </View>
            </Panel>
          )}
          {!mole.photos.length && !photoDraft ? (
            <Panel title="Your first reference photo">
              <Copy>
                Use even lighting and include a size reference where possible.
                Next time, aim for the same angle and distance.
              </Copy>
            </Panel>
          ) : (
            [...mole.photos]
              .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
              .map((photo) => (
                <Panel key={photo.id} title={displayDate(photo.capturedAt)}>
                  <Image
                    accessibilityLabel={`Spot photographed ${displayDate(photo.capturedAt)}`}
                    source={{ uri: photo.localUri }}
                    resizeMode="contain"
                    style={{
                      height: 360,
                      width: "100%",
                      borderRadius: 12,
                      backgroundColor: colors.secondary,
                    }}
                  />
                  {photo.notes && <Copy>{photo.notes}</Copy>}
                  <Button
                    title="Remove this photo"
                    variant="ghost"
                    onPress={() => setDeleting(photo.id)}
                  />
                </Panel>
              ))
          )}
        </>
      )}
      <View
        style={{
          borderTopWidth: 1,
          borderColor: colors.border,
          paddingTop: 24,
          gap: 12,
        }}
      >
        {deleting ? (
          <Panel
            title={
              deleting === "record"
                ? "Delete this record?"
                : "Remove this photo?"
            }
          >
            <Copy>
              This removes it from the current history. Downloaded backups are
              unchanged.
            </Copy>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <Button
                title="Confirm deletion"
                variant="danger"
                loading={busy}
                onPress={() =>
                  void run(async () => {
                    if (deleting === "record") {
                      await deleteMole(mole.id);
                      router.replace("/(tabs)");
                    } else await deleteMolePhoto(mole.id, deleting);
                    setDeleting(null);
                  })
                }
              />
              <Button
                title="Keep it"
                variant="secondary"
                onPress={() => setDeleting(null)}
                disabled={busy}
              />
            </View>
          </Panel>
        ) : (
          <Button
            title="Delete this record"
            variant="ghost"
            onPress={() => setDeleting("record")}
          />
        )}
      </View>
    </Screen>
  );
}
