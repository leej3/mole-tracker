import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { exportDatabase, importDatabase } from "@/lib/storage.web";
import { useColors } from "@/hooks/useColors";

export function BackupControls() {
  const colors = useColors();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const downloadBackup = async () => {
    setBusy(true);
    setStatus("");
    try {
      const bytes = await exportDatabase();
      const backup = new Uint8Array(bytes.byteLength);
      backup.set(bytes);
      const blob = new Blob([backup.buffer], { type: "application/vnd.sqlite3" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mole-tracker-backup-${new Date().toISOString().slice(0, 10)}.sqlite`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("Backup downloaded. Keep it somewhere safe.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not download the backup.");
    } finally {
      setBusy(false);
    }
  };

  const restoreBackup = async (file?: File) => {
    if (!file) return;
    if (!window.confirm("Restore this backup? It will replace the data in this browser.")) return;
    setBusy(true);
    setStatus("");
    try {
      await importDatabase(new Uint8Array(await file.arrayBuffer()));
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not restore this backup.");
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <View style={[styles.container, { borderTopColor: colors.border }] }>
      <Text style={[styles.title, { color: colors.foreground }]}>Browser backup</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>Download a SQLite file containing your profiles, mole records, and photos. Restoring replaces this browser’s current records.</Text>
      <View style={styles.actions}>
        <Pressable disabled={busy} onPress={downloadBackup} style={[styles.button, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}>
          <Text style={styles.primaryLabel}>{busy ? "Please wait…" : "Download backup"}</Text>
        </Pressable>
        <Pressable disabled={busy} onPress={() => inputRef.current?.click()} style={[styles.button, styles.secondary, { borderColor: colors.border, opacity: busy ? 0.6 : 1 }]}>
          <Text style={[styles.secondaryLabel, { color: colors.foreground }]}>Restore backup</Text>
        </Pressable>
        <input
          ref={inputRef}
          type="file"
          accept=".sqlite,.db,application/vnd.sqlite3,application/octet-stream"
          aria-label="Choose a Mole Tracker SQLite backup"
          style={{ display: "none" }}
          onChange={(event) => void restoreBackup(event.currentTarget.files?.[0])}
        />
      </View>
      {status ? <Text role="status" style={[styles.status, { color: colors.mutedForeground }]}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 16, marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  description: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  button: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 13 },
  primaryLabel: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  secondary: { borderWidth: 1, backgroundColor: "transparent" },
  secondaryLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  status: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
