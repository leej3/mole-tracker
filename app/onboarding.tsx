import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { Screen, Panel, Copy, Field } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { BackupControls } from "@/components/BackupControls";
export default function Onboarding() {
  const { startProfile } = useApp(),
    router = useRouter();
  const [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [restore, setRestore] = useState(false);
  const start = async () => {
    setBusy(true);
    try {
      await startProfile({
        name: name.trim(),
        avatar: "person",
        bodyType: "male",
        relationship: "Myself",
      });
      router.replace("/(tabs)");
    } catch {
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      title="A history that stays yours"
      subtitle="Keep photographs and observations together, over months and years. No account, subscription, or automatic uploads."
      back={false}
    >
      <Panel title="Start your personal record">
        <Field
          label="Profile name or nickname"
          placeholder="e.g. Me"
          value={name}
          onChangeText={setName}
          maxLength={200}
        />
        <Copy>
          This name helps keep records organized. You can add other profiles
          later.
        </Copy>
        <Button
          title="Start my history"
          onPress={() => void start()}
          disabled={!name.trim()}
          loading={busy}
        />
      </Panel>
      <View style={{ gap: 12 }}>
        <Copy>1. Record a spot and its location.</Copy>
        <Copy>2. Add photos and observations over time.</Copy>
        <Copy>3. Keep a backup, or select records for a visit report.</Copy>
      </View>
      <Copy>
        Mole Tracker keeps a personal skin history; it does not diagnose skin
        conditions. If a spot is new, changing, itching, or bleeding, seek
        advice from a qualified clinician.
      </Copy>
      <Button
        title={restore ? "Hide restore options" : "Already have a backup?"}
        variant="ghost"
        onPress={() => setRestore((v) => !v)}
      />
      {restore && (
        <Panel>
          <BackupControls />
        </Panel>
      )}
    </Screen>
  );
}
