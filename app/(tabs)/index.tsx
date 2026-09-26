import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { BodyMap3D, BodyMap3DHandle, PinPlacedEvent } from "@/components/BodyMap3D";
import { MoleCard } from "@/components/MoleCard";
import { calculateConcernScore } from "@/utils/scoring";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = Math.min(SCREEN_HEIGHT * 0.72, 640);

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bodyMapRef = useRef<BodyMap3DHandle>(null);

  const { profiles, moles, activeProfileId, getMolesForProfile } = useApp();
  const [showMap, setShowMap] = useState(true);
  const [mapView, setMapView] = useState<"front" | "back">("front");
  const [selectedRegion, setSelectedRegion] = useState<{ id: string; label: string } | null>(null);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const profileMoles = useMemo(
    () => (activeProfileId ? getMolesForProfile(activeProfileId) : []),
    [activeProfileId, getMolesForProfile, moles]
  );

  const alertMoles = useMemo(
    () => profileMoles.filter((m) => (calculateConcernScore(m) ?? 0) >= 3),
    [profileMoles]
  );

  const headerStats = useMemo(() => {
    const total = profileMoles.length;
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newCount = profileMoles.filter(
      (m) => new Date(m.createdAt).getTime() > cutoff
    ).length;
    const prevCount = total - newCount;
    const pct =
      prevCount > 0
        ? Math.round((newCount / prevCount) * 100)
        : newCount > 0
        ? 100
        : 0;
    return { total, newCount, prevCount, pct };
  }, [profileMoles]);

  const topPad = Platform.OS === "web" ? 12 : insets.top;

  const handlePinPlaced = useCallback(
    (event: PinPlacedEvent) => {
      router.push({
        pathname: "/mole/new",
        params: {
          x: event.x.toString(),
          y: event.y.toString(),
          z: event.z.toString(),
          normalX: event.normalX.toString(),
          normalY: event.normalY.toString(),
          normalZ: event.normalZ.toString(),
          region: event.bodyPart,
          view: event.view ?? "front",
          profileId: activeProfileId || "",
        },
      } as any);
    },
    [router, activeProfileId]
  );

  const handleMoleTapped = useCallback(
    (moleId: string) => {
      router.push(`/mole/${moleId}` as any);
    },
    [router]
  );

  // Called when the body map iframe tells us a body part was selected
  const handleBodyPartSelected = useCallback(
    (bodyPart: string, label: string) => {
      setSelectedRegion({ id: bodyPart, label });
    },
    []
  );

  const handleViewChanged = useCallback((view: "front" | "back") => {
    setMapView(view);
    setSelectedRegion(null);
  }, []);

  // Called when the user presses back inside the body map
  const handleGoBack = useCallback(() => {
    setSelectedRegion(null);
  }, []);

  // Pressing the breadcrumb "back" button from RN side
  const handleBackToOverview = useCallback(() => {
    setSelectedRegion(null);
    bodyMapRef.current?.sendMessage({ type: "goBack" });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
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
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Mole Tracker
          </Text>
          <Text style={[styles.profileName, { color: colors.foreground }]}>
            {activeProfile?.name || "My Profile"}
          </Text>

          {/* ── Summary stats row ── */}
          <View style={styles.statsRow}>
            {/* Mole count chip */}
            <View style={[styles.statChip, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.statChipText, { color: colors.primary }]}>
                {headerStats.total} {headerStats.total === 1 ? "mole" : "moles"}
              </Text>
            </View>

            {/* Change vs 30 days ago */}
            {headerStats.newCount > 0 && (
              <View style={[styles.statChip, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.statChipText, { color: colors.primary }]}>
                  +{headerStats.newCount} this month
                  {headerStats.prevCount > 0 ? ` (+${headerStats.pct}%)` : ""}
                </Text>
              </View>
            )}

            {/* Concern alert chip */}
            {alertMoles.length > 0 && (
              <Pressable
                onPress={() => {
                  const top = [...alertMoles].sort(
                    (a, b) => calculateConcernScore(b) - calculateConcernScore(a)
                  )[0];
                  router.push(`/mole/${top.id}` as any);
                }}
              >
                <View style={[styles.statChip, { backgroundColor: "#fff3e0", borderColor: "#f57c00", borderWidth: 1 }]}>
                  <Feather name="alert-circle" size={11} color={colors.warning} />
                  <Text style={[styles.statChipText, { color: colors.warning }]}>
                    {alertMoles.length} need attention
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          {profiles.length > 1 && (
            <Pressable
              onPress={() => router.push("/profiles" as any)}
              style={[styles.iconBtn, { backgroundColor: colors.primaryLight }]}
            >
              <Feather name="users" size={18} color={colors.primary} />
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push("/settings" as any)}
            style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
          >
            <Feather name="settings" size={18} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
          },
        ]}
      >
        {alertMoles.length > 0 && (
          <Pressable
            onPress={() => {
              // Navigate to the highest-scoring alert mole
              const top = [...alertMoles].sort(
                (a, b) => (b.aiConcernScore ?? 0) - (a.aiConcernScore ?? 0)
              )[0];
              router.push(`/mole/${top.id}` as any);
            }}
            style={({ pressed }) => [
              styles.alertBanner,
              { backgroundColor: colors.warningLight, borderColor: "#f57c00", opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="alert-circle" size={16} color={colors.warning} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.alertText, { color: colors.warning }]}>
                {alertMoles.length}{" "}
                {alertMoles.length === 1 ? "mole" : "moles"} worth monitoring
              </Text>
              <Text style={[styles.alertSub, { color: colors.warning }]}>
                Not a diagnosis — consult your doctor.
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.warning} />
          </Pressable>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            {selectedRegion ? (
              /* Breadcrumb when inside a body part detail */
              <Pressable
                onPress={handleBackToOverview}
                style={styles.breadcrumb}
              >
                <Feather name="arrow-left" size={16} color={colors.primary} />
                <Text style={[styles.breadcrumbText, { color: colors.primary }]}>
                  Body Map
                </Text>
                <Text style={[styles.breadcrumbSep, { color: colors.mutedForeground }]}>
                  /
                </Text>
                <Text style={[styles.breadcrumbActive, { color: colors.foreground }]}>
                  {selectedRegion.label}
                </Text>
              </Pressable>
            ) : (
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Body Map
              </Text>
            )}
            <Pressable
              onPress={() => setShowMap((v) => !v)}
              style={styles.sectionAction}
            >
              <Text style={[styles.sectionActionText, { color: colors.primary }]}>
                {showMap ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          {showMap && (
            <View style={styles.mapCard}>
              <BodyMap3D
                ref={bodyMapRef}
                moles={profileMoles}
                interactive
                gender={activeProfile?.bodyType ?? "male"}
                onPinPlaced={handlePinPlaced}
                onMoleTapped={handleMoleTapped}
                onBodyPartSelected={handleBodyPartSelected}
                onGoBack={handleGoBack}
                onViewChanged={handleViewChanged}
                width={SCREEN_WIDTH - 48}
                height={MAP_HEIGHT}
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ gap: 2 }}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                My Moles
              </Text>
              <Text style={[styles.viewLabel, { color: colors.mutedForeground }]}>
                {mapView === "front" ? "Front view" : "Back view"}
              </Text>
            </View>
            <Pressable
              onPress={() => setShowMap(true)}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>

          {profileMoles.filter((m) => (m.bodyView ?? "front") === mapView).length === 0 ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Feather name="map-pin" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No moles tracked yet
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Tap a body part on the map above, then tap anywhere on it to
                mark a mole location.
              </Text>
            </View>
          ) : (
            <View style={styles.moleList}>
              {profileMoles
                .filter((m) => (m.bodyView ?? "front") === mapView)
                .map((mole) => (
                  <MoleCard key={mole.id} mole={mole} />
                ))}
            </View>
          )}
        </View>

        <View
          style={[
            styles.disclaimerFooter,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Feather name="info" size={13} color={colors.mutedForeground} />
          <Text
            style={[styles.disclaimerFooterText, { color: colors.mutedForeground }]}
          >
            Mole Tracker is for personal documentation only. Not a diagnostic
            tool. Always consult a doctor.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  profileName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  headerActions: { flexDirection: "row", gap: 8, alignSelf: "flex-start" },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { padding: 24, gap: 24 },
  alertBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  alertText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  alertSub: { fontSize: 12, fontFamily: "Inter_400Regular", opacity: 0.8 },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  viewLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionAction: { paddingVertical: 4, paddingHorizontal: 8 },
  sectionActionText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  breadcrumbText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  breadcrumbSep: { fontSize: 14, fontFamily: "Inter_400Regular" },
  breadcrumbActive: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  mapCard: {
    borderRadius: 20,
    overflow: "hidden",
    height: MAP_HEIGHT,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  moleList: { gap: 12 },
  disclaimerFooter: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  disclaimerFooterText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
});
