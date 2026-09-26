import { useApp } from "@/context/AppContext";
import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import {
  exportDatabase,
  importDatabase,
  inspectDatabase,
} from "@/lib/storage.web";
import { readBytes } from "@/lib/browser-store";
import { MAX_BACKUP_BYTES } from "@/lib/validation";
import { Archive } from "@/lib/model";
import { useColors } from "@/hooks/useColors";
import { Button } from "./ui/Button";
export function BackupControls() {
  const { isSaving } = useApp();
  const colors = useColors();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{
    bytes: Uint8Array;
    data: Archive;
    revision: number;
    name: string;
  } | null>(null);
  const download = async () => {
    setBusy(true);
    try {
      const bytes = await exportDatabase();
      const blob = new Blob([new Uint8Array(bytes).buffer], {
        type: "application/vnd.sqlite3",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mole-tracker-${new Date().toISOString().slice(0, 10)}.sqlite`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(
        "Backup prepared. Check your downloads and store it somewhere private.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Backup could not be prepared.",
      );
    } finally {
      setBusy(false);
    }
  };
  const inspect = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setPreview(null);
    setStatus("");
    try {
      if (file.size > MAX_BACKUP_BYTES)
        throw new Error("Choose a backup smaller than 100 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const data = await inspectDatabase(bytes);
      const { revision } = await readBytes();
      setPreview({ bytes, data, revision, name: file.name });
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "This backup could not be read.",
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  const restore = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      await importDatabase(preview.bytes, preview.revision);
      window.location.assign("/");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Restore failed. Your current history is unchanged.",
      );
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 16 }}>
      <Text
        style={{
          fontSize: 18,
          fontFamily: "Inter_600SemiBold",
          color: colors.foreground,
        }}
      >
        A copy you control
      </Text>
      <Text style={{ color: colors.mutedForeground, lineHeight: 22 }}>
        SQLite backups include every profile, observation and photo. Files are
        unencrypted. Keep a copy outside this browser.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Button
          title="Download current backup"
          onPress={() => void download()}
          disabled={busy || isSaving}
        />
        <Button
          title="Inspect a backup"
          variant="secondary"
          onPress={() => input.current?.click()}
          disabled={busy || isSaving}
        />
      </View>
      <input
        ref={input}
        type="file"
        accept=".sqlite,.db"
        aria-label="Choose backup"
        style={{ display: "none" }}
        onChange={(e) => void inspect(e.currentTarget.files?.[0])}
      />
      {preview && (
        <View
          style={{
            padding: 20,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 12,
          }}
        >
          <Text style={{ fontWeight: "700", color: colors.foreground }}>
            Ready to restore: {preview.name}
          </Text>
          <Text style={{ color: colors.foreground }}>
            {preview.data.profiles.length} profiles ·{" "}
            {preview.data.moles.length} spots ·{" "}
            {preview.data.moles.reduce((n, m) => n + m.photos.length, 0)} photos
          </Text>
          <Text style={{ color: colors.mutedForeground }}>
            This replaces all records in this browser. Download your current
            backup above before continuing. Nothing changes until you choose
            Replace.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Button
              title="Replace with this backup"
              variant="danger"
              onPress={() => void restore()}
              disabled={busy || isSaving}
            />
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setPreview(null)}
              disabled={busy || isSaving}
            />
          </View>
        </View>
      )}
      {status ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.foreground, lineHeight: 22 }}
        >
          {status}
        </Text>
      ) : null}
    </View>
  );
}
