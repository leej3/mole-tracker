import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { Screen, Panel, Copy, Field } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
export default function Profiles() {
  const {
      profiles,
      activeProfileId,
      setActiveProfile,
      createProfile,
      deleteProfile,
      getMolesForProfile,
    } = useApp(),
    router = useRouter();
  const [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [deleting, setDeleting] = useState<string | null>(null);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch {
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      title="Profiles"
      subtitle="Separate collections on this device. Profiles share the same backup and are not separate private accounts."
    >
      {profiles.map((p) => (
        <Panel key={p.id} title={p.name}>
          <Copy>
            {getMolesForProfile(p.id).length} records
            {p.id === activeProfileId ? " · Currently selected" : ""}
          </Copy>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Button
              title={
                p.id === activeProfileId ? "View records" : "Use this profile"
              }
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  await setActiveProfile(p.id);
                  router.replace("/(tabs)");
                })
              }
            />
            <Button
              title="Delete profile"
              variant="ghost"
              disabled={busy}
              onPress={() => setDeleting(p.id)}
            />
          </View>
          {deleting === p.id && (
            <View style={{ gap: 12 }}>
              <Copy>
                Delete this profile and all its records and photos from this
                browser? Downloaded backups are unchanged.
              </Copy>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                <Button
                  title="Confirm deletion"
                  variant="danger"
                  loading={busy}
                  onPress={() =>
                    void run(async () => {
                      await deleteProfile(p.id);
                      setDeleting(null);
                    })
                  }
                />
                <Button
                  title="Keep profile"
                  variant="secondary"
                  onPress={() => setDeleting(null)}
                />
              </View>
            </View>
          )}
        </Panel>
      ))}
      <Panel title="Add a profile">
        <Field
          label="Name or nickname"
          value={name}
          onChangeText={setName}
          maxLength={200}
        />
        <Button
          title="Create profile"
          loading={busy}
          disabled={!name.trim()}
          onPress={() =>
            void run(async () => {
              await createProfile({
                name: name.trim(),
                avatar: "person",
                bodyType: "male",
              });
              setName("");
            })
          }
        />
      </Panel>
    </Screen>
  );
}
