import React, { useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useApp } from "@/context/AppContext";
import { Button } from "./ui/Button";
import { BackupControls } from "./BackupControls";
import { useColors } from "@/hooks/useColors";
export function StorageGate({ children }: { children: React.ReactNode }) {
  const { isLoading, loadError, reload, saveError, isSaving, clearSaveError } =
    useApp();
  const colors = useColors();
  const opened = useRef(false);
  if (!isLoading && !loadError) opened.current = true;
  if (isLoading && !opened.current)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        }}
      >
        <ActivityIndicator color={colors.primary} />
        <Text>Opening your history…</Text>
      </View>
    );
  if (loadError)
    return (
      <View
        style={{ padding: 24, gap: 20, maxWidth: 720, alignSelf: "center" }}
      >
        <Text style={{ fontSize: 24, fontWeight: "700" }}>
          Your history needs attention
        </Text>
        <Text accessibilityRole="alert">{loadError}</Text>
        <Text>
          Nothing has been replaced. Retry, or inspect a backup to recover your
          history.
        </Text>
        <Button title="Retry opening history" onPress={() => void reload()} />
        <BackupControls />
      </View>
    );
  return (
    <View style={{ flex: 1 }}>
      {saveError ? (
        <View
          style={{ padding: 16, gap: 8, backgroundColor: colors.warningLight }}
        >
          <Text accessibilityRole="alert" style={{ color: colors.foreground }}>
            {saveError}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Button
              title="Reload saved history"
              variant="secondary"
              onPress={() => void reload()}
            />
            <Button
              title="Keep editing"
              variant="ghost"
              onPress={clearSaveError}
            />
          </View>
        </View>
      ) : isSaving ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            padding: 8,
            textAlign: "center",
            color: colors.mutedForeground,
          }}
        >
          Saving to this device…
        </Text>
      ) : null}
      {children}
    </View>
  );
}
