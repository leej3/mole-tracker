import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackupControls } from "@/components/BackupControls";
import { useColors } from "@/hooks/useColors";

export default function BackupScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24, gap: 20, width: "100%", maxWidth: 840, alignSelf: "center" }}>
    <Pressable accessibilityRole="button" onPress={() => router.replace("/(tabs)")} style={{ minHeight: 44, justifyContent: "center" }}>
      <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>← All records</Text>
    </Pressable>
    <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 26 }}>Backups & restore</Text>
    <Text style={{ color: colors.mutedForeground, lineHeight: 22 }}>A backup is your portable copy of this history. Store it in a private location you control. The SQLite file is not encrypted and contains every profile, note, and photo.</Text>
    <BackupControls />
  </ScrollView>;
}
