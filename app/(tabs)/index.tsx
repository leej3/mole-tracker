import React, { useState } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { Screen, Panel, Copy, Field, Choice } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { BodyMap3D } from "@/components/BodyMap3D";
import { displayDate, regionLabel } from "@/lib/locations";
export default function Home() {
  const { profiles, moles, activeProfileId, setDraftLocation } = useApp();
  const colors = useColors(),
    router = useRouter();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState("records"),
    [query, setQuery] = useState("");
  const profile = profiles.find((p) => p.id === activeProfileId);
  const records = moles
    .filter((m) => m.profileId === activeProfileId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const visible = records.filter((m) =>
    `${m.customName || m.defaultName} ${regionLabel(m.bodyRegion)}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const photos = records.reduce((n, m) => n + m.photos.length, 0);
  return (
    <Screen
      title="Your skin history"
      subtitle="Small observations, kept together over time. A private record to return to and share when it matters."
      back={false}
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Button
          title="+ Record a spot"
          onPress={() => {
            setDraftLocation(null);
            router.push("/mole/new");
          }}
        />
        {(
          [
            ["Profiles", "users", "/profiles"],
            ["Backups", "download", "/backup"],
            ["Visit report", "file-text", "/report"],
            ["Help", "help-circle", "/settings"],
          ] as const
        ).map(([label, icon, path]) => (
          <Pressable
            key={label}
            accessibilityRole="link"
            onPress={() => router.push(path)}
            style={{
              flexDirection: "row",
              gap: 8,
              padding: 12,
              minHeight: 44,
              alignItems: "center",
            }}
          >
            <Feather name={icon} size={17} color={colors.primary} />
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                color: colors.foreground,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {[
          ["PROFILE", profile?.name || "Your profile"],
          ["SPOTS RECORDED", String(records.length)],
          ["PHOTOGRAPHS", String(photos)],
        ].map(([label, value]) => (
          <View
            key={label}
            style={{
              flex: 1,
              minWidth: 140,
              padding: 20,
              borderRadius: 16,
              backgroundColor: colors.primaryLight,
              gap: 10,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                letterSpacing: 1.3,
                fontFamily: "Inter_600SemiBold",
                color: colors.primary,
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontFamily: "Inter_600SemiBold",
                color: colors.foreground,
              }}
            >
              {value}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Choice
          label="All records"
          selected={mode === "records"}
          onPress={() => setMode("records")}
        />
        <Choice
          label="Body map"
          selected={mode === "map"}
          onPress={() => setMode("map")}
        />
      </View>
      {mode === "map" ? (
        <Panel title="Find it on the map">
          <Copy>
            Choose front or back, select a region, then tap a position. Prefer
            words? “Record a spot” also offers a location list.
          </Copy>
          <BodyMap3D
            key={activeProfileId}
            moles={records}
            width={Math.max(240, Math.min(width - 94, 944))}
            height={480}
            onPinPlaced={(event) => {
              setDraftLocation({
                x: event.x,
                y: event.y,
                region: event.bodyPart,
                view: event.view,
              });
              router.push("/mole/new");
            }}
            onMoleTapped={(id) => router.push(`/mole/${id}`)}
          />
        </Panel>
      ) : (
        <>
          {records.length > 0 && (
            <Field
              label="Find a record"
              placeholder="Search by name or body location"
              value={query}
              onChangeText={setQuery}
            />
          )}
          {!records.length ? (
            <Panel title="Begin with one spot">
              <View
                style={{
                  flexDirection: width > 600 ? "row" : "column",
                  gap: 24,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: colors.primaryLight,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Feather name="camera" size={36} color={colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 12 }}>
                  <Copy>
                    Give it a name you’ll recognize, add its location, and take
                    a photo. That first record becomes a reference for next
                    time.
                  </Copy>
                  <Button
                    title="Create your first record"
                    onPress={() => router.push("/mole/new")}
                  />
                </View>
              </View>
            </Panel>
          ) : !visible.length ? (
            <Panel title="No matching records">
              <Copy>Try another name or location.</Copy>
              <Button
                title="Clear search"
                variant="ghost"
                onPress={() => setQuery("")}
              />
            </Panel>
          ) : (
            visible.map((m) => (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityLabel={`Open ${m.customName || m.defaultName}`}
                onPress={() => router.push(`/mole/${m.id}`)}
                style={({ pressed }) => ({
                  padding: 18,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  flexDirection: "row",
                  gap: 18,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {m.photos.length ? (
                  <Image
                    source={{ uri: m.photos[m.photos.length - 1].localUri }}
                    style={{ width: 72, height: 72, borderRadius: 12 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 12,
                      backgroundColor: colors.secondary,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Feather name="map-pin" size={24} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 5 }}>
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 17,
                      color: colors.foreground,
                    }}
                  >
                    {m.customName || m.defaultName}
                  </Text>
                  <Copy>
                    {regionLabel(m.bodyRegion)} · {m.bodyView}
                  </Copy>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    {m.photos.length} photos · Updated{" "}
                    {displayDate(m.updatedAt)}
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
            ))
          )}
        </>
      )}
      <Panel title="Keep this history yours">
        <Copy>
          Your records are saved in this browser. A downloaded backup lets you
          move devices or recover after clearing browser data.
        </Copy>
        <Button
          title="Make a backup"
          variant="ghost"
          onPress={() => router.push("/backup")}
        />
      </Panel>
    </Screen>
  );
}
