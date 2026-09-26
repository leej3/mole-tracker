import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profiles, activeProfileId, deleteProfile } = useApp();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
          Settings
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Feather name="user" size={28} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.profileName, { color: colors.foreground }]}>
                {activeProfile?.name || "No profile"}
              </Text>
              <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>
                {activeProfile?.relationship} · Body Type {activeProfile?.bodyType === "male" ? "A" : "B"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/profiles" as any)}
            style={[styles.manageBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.manageBtnText}>Manage Profiles</Text>
          </Pressable>
        </Card>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          About
        </Text>
        <Card>
          <SettingsRow
            icon="info"
            label="About Mole Tracker"
            onPress={() =>
              Alert.alert(
                "About Mole Tracker",
                "Mole Tracker helps you document skin moles over time and share a clear visual history with your doctor.\n\nVersion 1.0.0"
              )
            }
            colors={colors}
          />
          <SettingsRow
            icon="shield"
            label="Medical Disclaimer"
            onPress={() =>
              Alert.alert(
                "Medical Disclaimer",
                "Mole Tracker is not a medical device and does not diagnose any condition. All scores and summaries are for personal educational tracking only.\n\nAlways consult a qualified healthcare professional about any skin concerns."
              )
            }
            colors={colors}
            last
          />
        </Card>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Privacy & Data
        </Text>
        <Card>
          <SettingsRow
            icon="hard-drive"
            label="Data Storage"
            sublabel="All data is stored locally on your device"
            colors={colors}
          />
          <SettingsRow
            icon="lock"
            label="Privacy First"
            sublabel="Photos and health data never leave your device"
            colors={colors}
            last
          />
        </Card>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Danger Zone
        </Text>
        <Card>
          <SettingsRow
            icon="trash-2"
            label="Delete Active Profile"
            danger
            onPress={() => {
              if (!activeProfile) return;
              if (profiles.length <= 1) {
                Alert.alert("Cannot Delete", "You must have at least one profile.");
                return;
              }
              Alert.alert(
                "Delete Profile",
                `This will permanently delete ${activeProfile.name} and all their mole data. This cannot be undone.`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                      deleteProfile(activeProfile.id);
                      router.back();
                    },
                  },
                ]
              );
            }}
            colors={colors}
            last
          />
        </Card>

        <View style={[styles.disclaimerCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
          <Feather name="heart" size={16} color={colors.primary} />
          <Text style={[styles.disclaimerText, { color: colors.primary }]}>
            If you're concerned about a mole, please consult a qualified dermatologist or your doctor. Early detection matters — Mole Tracker is here to help you organize and document, not diagnose.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  danger = false,
  last = false,
  colors,
}: {
  icon: any;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
  colors: any;
}) {
  return (
    <>
      <Pressable
        onPress={onPress}
        style={[styles.settingsRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
        disabled={!onPress}
      >
        <View style={[styles.settingsIcon, { backgroundColor: danger ? "#ffebee" : colors.primaryLight }]}>
          <Feather
            name={icon}
            size={18}
            color={danger ? colors.destructive : colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.settingsLabel,
              { color: danger ? colors.destructive : colors.foreground },
            ]}
          >
            {label}
          </Text>
          {sublabel && (
            <Text style={[styles.settingsSublabel, { color: colors.mutedForeground }]}>
              {sublabel}
            </Text>
          )}
        </View>
        {onPress && (
          <Feather
            name="chevron-right"
            size={16}
            color={danger ? colors.destructive : colors.mutedForeground}
          />
        )}
      </Pressable>
    </>
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
  scrollContent: { padding: 20, gap: 12 },
  profileCard: { gap: 12 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  profileName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  profileSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2, textTransform: "capitalize" },
  manageBtn: { paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  manageBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: -4,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  settingsIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingsLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  settingsSublabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  disclaimerCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "flex-start",
    marginTop: 8,
  },
  disclaimerText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});
