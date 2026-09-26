import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BodyType, Profile, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ProfilesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profiles, activeProfileId, setActiveProfile, createProfile, deleteProfile, getMolesForProfile } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Myself");
  const [birthYear, setBirthYear] = useState("");
  const [bodyType, setBodyType] = useState<BodyType>("male");
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const saveProfile = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createProfile({
        name,
        avatar: "person.circle",
        relationship,
        birthYear: birthYear ? parseInt(birthYear) : undefined,
        bodyType,
      });
      setShowNew(false);
      setName("");
      setBirthYear("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Profiles
        </Text>
        <Pressable
          onPress={() => setShowNew((v) => !v)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name={showNew ? "x" : "plus"} size={18} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {showNew && (
          <Card elevated style={styles.newProfileCard}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              New Profile
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Profile name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            />
            <View style={styles.chipsRow}>
              {["Myself", "Child", "Parent", "Partner", "Other"].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRelationship(r)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: relationship === r ? colors.primary : colors.surface,
                      borderColor: relationship === r ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: relationship === r ? "#fff" : colors.foreground, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.bodyTypeRow}>
              {(["male", "female"] as BodyType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setBodyType(t)}
                  style={[
                    styles.bodyTypeBtn,
                    {
                      backgroundColor: bodyType === t ? colors.primary : colors.surface,
                      borderColor: bodyType === t ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: bodyType === t ? "#fff" : colors.foreground, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                    {t === "male" ? "Body A" : "Body B"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button title="Create Profile" onPress={saveProfile} loading={loading} fullWidth />
          </Card>
        )}

        <Text style={[styles.listLabel, { color: colors.mutedForeground }]}>
          {profiles.length} profile{profiles.length !== 1 ? "s" : ""}
        </Text>

        {profiles.map((profile) => {
          const moles = getMolesForProfile(profile.id);
          const isActive = profile.id === activeProfileId;
          return (
            <Pressable
              key={profile.id}
              onPress={() => {
                setActiveProfile(profile.id);
                router.back();
              }}
            >
              <Card style={[styles.profileCard, isActive && { borderColor: colors.primary, borderWidth: 2 }]}>
                <View style={styles.profileRow}>
                  <View style={[styles.avatar, { backgroundColor: isActive ? colors.primary : colors.primaryLight }]}>
                    <Feather name="user" size={24} color={isActive ? "#fff" : colors.primary} />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, { color: colors.foreground }]}>
                      {profile.name}
                    </Text>
                    <Text style={[styles.profileMeta, { color: colors.mutedForeground }]}>
                      {profile.relationship && `${profile.relationship} · `}
                      {moles.length} mole{moles.length !== 1 ? "s" : ""}
                      {profile.birthYear && ` · b. ${profile.birthYear}`}
                    </Text>
                  </View>
                  <View style={styles.profileActions}>
                    {isActive && (
                      <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                    {profiles.length > 1 && !isActive && (
                      <Pressable
                        onPress={() =>
                          Alert.alert("Delete Profile", `Delete ${profile.name} and all their mole data?`, [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () => deleteProfile(profile.id),
                            },
                          ])
                        }
                      >
                        <Feather name="trash-2" size={16} color={colors.destructive} />
                      </Pressable>
                    )}
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 20, gap: 12 },
  newProfileCard: { gap: 12, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  bodyTypeRow: { flexDirection: "row", gap: 8 },
  bodyTypeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  listLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 },
  profileCard: { padding: 16 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  profileMeta: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  profileActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeBadgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
