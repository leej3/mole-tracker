import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useApp } from "@/context/AppContext";
import { Screen, Panel, Copy, Choice } from "@/components/ui/Screen";
import { ReportExport } from "@/components/ReportExport";
import { buildReport } from "@/lib/report";
export default function Report() {
  const { profiles, moles, activeProfileId } = useApp();
  const profile = profiles.find((p) => p.id === activeProfileId);
  const records = moles.filter((m) => m.profileId === activeProfileId);
  const [ids, setIds] = useState<string[]>([]),
    [photos, setPhotos] = useState(true);
  const html = useMemo(
    () =>
      profile
        ? buildReport(
            profile,
            records.filter((m) => ids.includes(m.id)),
            photos,
          )
        : "",
    [profile, records, ids, photos],
  );
  return (
    <Screen
      title="Prepare for a visit"
      subtitle="Choose the history you want to bring. Nothing is sent anywhere by this app."
    >
      <Panel title={`Records for ${profile?.name || "this profile"}`}>
        <Copy>
          Only selected records from this profile will appear in the report.
        </Copy>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {records.map((m) => (
            <Choice
              key={m.id}
              label={`${ids.includes(m.id) ? "✓ " : ""}${m.customName || m.defaultName}`}
              selected={ids.includes(m.id)}
              onPress={() =>
                setIds((v) =>
                  v.includes(m.id)
                    ? v.filter((id) => id !== m.id)
                    : [...v, m.id],
                )
              }
            />
          ))}
        </View>
        {!records.length && (
          <Copy>Add a record before preparing a report.</Copy>
        )}
        <Choice
          label={photos ? "✓ Include photographs" : "Include photographs"}
          selected={photos}
          onPress={() => setPhotos((v) => !v)}
        />
      </Panel>
      {ids.length ? (
        <ReportExport html={html} />
      ) : (
        <Copy>Select one or more records to preview your report.</Copy>
      )}
    </Screen>
  );
}
