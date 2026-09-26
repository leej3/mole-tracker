import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { BodyMap3D, PinPlacedEvent } from "@/components/BodyMap3D";
import { MoleCard } from "@/components/MoleCard";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { profiles, moles, activeProfileId } = useApp();
  const [view, setView] = useState<"records" | "map">("records");
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId);
  const records = useMemo(() => moles.filter((mole) => mole.profileId === activeProfileId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [moles, activeProfileId]);

  const addAtLocation = (event: PinPlacedEvent) => router.push({
    pathname: "/mole/new",
    params: { x: String(event.x), y: String(event.y), z: String(event.z),
      region: event.bodyPart, view: event.view, profileId: activeProfileId || "" },
  });

  const action = (label: string, icon: React.ComponentProps<typeof Feather>["name"], onPress: () => void) => (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={[styles.action, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Feather name={icon} size={18} color={colors.primary} />
      <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium" }}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.page, { paddingTop: (Platform.OS === "web" ? 20 : insets.top + 16), paddingBottom: insets.bottom + 80 }]}>
      <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>Mole Tracker · stored on this device</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{activeProfile?.name || "Your records"}</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>Keep a photographic history. Open a record to add a photo or note, or mark a new spot on the body map.</Text>
      <View style={styles.actions}>
        {action("Profiles", "users", () => router.push("/profiles"))}
        {action("Backups", "download", () => router.push("/backup"))}
        {action("Settings & help", "settings", () => router.push("/settings"))}
      </View>
      <View style={styles.actions}>
        {(["records", "map"] as const).map((tab) => (
          <Pressable key={tab} accessibilityRole="button" accessibilityState={{ selected: view === tab }}
            onPress={() => setView(tab)} style={[styles.action, { backgroundColor: view === tab ? colors.primary : colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: view === tab ? "#fff" : colors.foreground, fontFamily: "Inter_600SemiBold" }}>
              {tab === "records" ? `All records (${records.length})` : "Body map / add spot"}
            </Text>
          </Pressable>
        ))}
      </View>
      {view === "map" ? (
        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Add a spot in two steps</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>1. Choose Front or Back and select a body region. 2. Tap its location to open a new record. Select an existing pin to open its history.</Text>
          <BodyMap3D key={activeProfileId} moles={records} interactive gender={activeProfile?.bodyType ?? "male"}
            width={Math.max(240, Math.min(width - 40, 800))} height={Math.min(height * 0.65, 580)}
            onPinPlaced={addAtLocation} onMoleTapped={(id) => router.push(`/mole/${id}`)} />
          {action("Return to all records", "list", () => setView("records"))}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Your history</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>All body locations, most recently updated first.</Text>
          {records.length ? records.map((mole) => <MoleCard key={mole.id} mole={mole} />) : (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Text style={[styles.heading, { color: colors.foreground }]}>Start with one spot</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>Choose its location, give it a recognizable name, then add a photo. You can add measurements and observations later.</Text>
              {action("Add your first spot", "plus", () => setView("map"))}
            </View>
          )}
          {records.length > 0 && action("Add another spot", "plus", () => setView("map"))}
        </View>
      )}
      <Text style={[styles.description, { color: colors.mutedForeground }]}>Keep a backup outside this browser. Clearing site data can erase this history.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { width: "100%", maxWidth: 840, alignSelf: "center", paddingHorizontal: 20, gap: 16 },
  eyebrow: { fontFamily: "Inter_500Medium", fontSize: 13 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28 },
  heading: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  description: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderRadius: 10, flexDirection: "row", gap: 8, alignItems: "center", alignSelf: "flex-start" },
  section: { gap: 14 },
  empty: { borderWidth: 1, borderRadius: 12, padding: 20, gap: 14 },
});
