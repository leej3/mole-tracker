import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymptomFlag, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import {
  ABCDE_DESCRIPTIONS,
  CONCERN_SCORE_DISCLAIMER,
  HIGH_SCORE_DISCLAIMER,
  SYMPTOM_LABELS,
  calculateConcernScore,
  getABCDESummary,
} from "@/utils/scoring";

export default function MoleDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMoleById, updateMole, addMolePhoto, deleteMolePhoto, addUpdateLog, deleteMole } = useApp();

  const mole = getMoleById(id || "");
  const [editingName, setEditingName] = useState(false);
  const [customName, setCustomName] = useState(mole?.customName || "");
  const [newNote, setNewNote] = useState("");
  const [newSizeMm, setNewSizeMm] = useState("");
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "photos" | "history" | "abcde">("overview");
  const [comparingPhotos, setComparingPhotos] = useState<[string, string] | null>(null);

  const score = useMemo(() => (mole ? calculateConcernScore(mole) : 1), [mole]);
  const abcde = useMemo(() => (mole ? getABCDESummary(mole) : null), [mole]);

  useEffect(() => {
    if (mole) setCustomName(mole.customName || "");
  }, [mole]);

  if (!mole) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Mole not found</Text>
      </View>
    );
  }

  const displayName = mole.customName || mole.defaultName;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await addMolePhoto(mole.id, {
        localUri: asset.uri,
        capturedAt: new Date().toISOString(),
      });
    }
  };

  const saveNameEdit = async () => {
    await updateMole(mole.id, { customName: customName || undefined });
    setEditingName(false);
  };

  const saveUpdate = async () => {
    if (!newNote && !newSizeMm) return;
    const newScore = calculateConcernScore(mole);
    await addUpdateLog(mole.id, {
      timestamp: new Date().toISOString(),
      sizeMm: newSizeMm ? parseFloat(newSizeMm) : undefined,
      note: newNote || undefined,
      aiScoreSnapshot: newScore,
    });
    if (newSizeMm) {
      await updateMole(mole.id, { latestSizeMm: parseFloat(newSizeMm) });
    }
    setNewNote("");
    setNewSizeMm("");
    setShowAddUpdate(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Mole",
      `Are you sure you want to delete "${displayName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteMole(mole.id);
            router.back();
          },
        },
      ]
    );
  };

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "photos", label: `Photos (${mole.photos.length})` },
    { key: "history", label: "History" },
    { key: "abcde", label: "ABCDE" },
  ] as const;

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
        <View style={styles.headerCenter}>
          {editingName ? (
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              onBlur={saveNameEdit}
              autoFocus
              style={[
                styles.nameInput,
                { color: colors.foreground, borderColor: colors.primary },
              ]}
            />
          ) : (
            <Pressable onPress={() => setEditingName(true)} style={styles.nameRow}>
              <Text
                style={[styles.headerTitle, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Feather name="edit-2" size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
          <Text
            style={[styles.headerSub, { color: colors.mutedForeground }]}
          >
            {mole.bodyRegion.replace(/_/g, " ")} · {mole.bodyView}
          </Text>
        </View>
        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Feather name="trash-2" size={18} color={colors.destructive} />
        </Pressable>
      </View>

      <View style={styles.tabsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === tab.key ? colors.primary : "transparent",
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === tab.key ? colors.primary : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab.key ? colors.primaryForeground : colors.mutedForeground,
                    fontFamily: activeTab === tab.key ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "overview" && (
          <OverviewTab mole={mole} score={score} colors={colors} />
        )}
        {activeTab === "photos" && (
          <PhotosTab
            mole={mole}
            onPickPhoto={pickPhoto}
            onDeletePhoto={(photoId) => deleteMolePhoto(mole.id, photoId)}
            colors={colors}
          />
        )}
        {activeTab === "history" && (
          <HistoryTab
            mole={mole}
            showAddUpdate={showAddUpdate}
            setShowAddUpdate={setShowAddUpdate}
            newNote={newNote}
            setNewNote={setNewNote}
            newSizeMm={newSizeMm}
            setNewSizeMm={setNewSizeMm}
            onSave={saveUpdate}
            colors={colors}
          />
        )}
        {activeTab === "abcde" && abcde && (
          <ABCDETab abcde={abcde} score={score} colors={colors} />
        )}
      </ScrollView>
    </View>
  );
}

function OverviewTab({ mole, score, colors }: { mole: any; score: number; colors: any }) {
  const activeSymptoms = mole.symptomFlags.filter((s: SymptomFlag) => s !== "none");

  return (
    <View style={styles.tabContent}>
      <Card elevated>
        <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
          Concern Score
        </Text>
        <View style={{ marginTop: 8 }}>
          <ScoreBar score={score} />
        </View>
        {score >= 3 && (
          <View style={[styles.highScoreBox, { backgroundColor: colors.warningLight }]}>
            <Feather name="alert-circle" size={14} color={colors.warning} />
            <Text style={[styles.highScoreText, { color: colors.warning }]}>
              {HIGH_SCORE_DISCLAIMER}
            </Text>
          </View>
        )}
        <Text style={[styles.disclaimerSmall, { color: colors.mutedForeground }]}>
          {CONCERN_SCORE_DISCLAIMER}
        </Text>
      </Card>

      <Card>
        <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
          Details
        </Text>
        <InfoRow label="First noticed" value={new Date(mole.firstNoticedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} colors={colors} />
        {mole.latestSizeMm && (
          <InfoRow label="Latest size" value={`~${mole.latestSizeMm}mm (estimate)`} colors={colors} />
        )}
        {mole.colorNotes && (
          <InfoRow label="Color" value={mole.colorNotes} colors={colors} />
        )}
        {mole.borderNotes && (
          <InfoRow label="Border" value={mole.borderNotes} colors={colors} />
        )}
        {mole.shapeNotes && (
          <InfoRow label="Shape" value={mole.shapeNotes} colors={colors} />
        )}
      </Card>

      {activeSymptoms.length > 0 ? (
        <Card style={{ borderColor: "#f57c00" }}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
            Symptoms
          </Text>
          <View style={styles.symptomsWrap}>
            {activeSymptoms.map((s: SymptomFlag) => (
              <View
                key={s}
                style={[styles.symptomBadge, { backgroundColor: "#fbe9e7" }]}
              >
                <Text style={[styles.symptomBadgeText, { color: "#bf360c" }]}>
                  {SYMPTOM_LABELS[s]}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
            Symptoms
          </Text>
          <Text style={[styles.noSymptoms, { color: colors.primary }]}>
            No symptoms reported
          </Text>
        </Card>
      )}

      <View style={[styles.urgentWarning, { backgroundColor: "#fff3e0", borderColor: "#e65100" }]}>
        <Feather name="alert-triangle" size={16} color="#e65100" />
        <Text style={[styles.urgentText, { color: "#bf360c" }]}>
          If you notice sudden rapid growth, bleeding, or severe color changes, seek prompt medical attention. This app does not diagnose medical conditions.
        </Text>
      </View>
    </View>
  );
}

function PhotosTab({
  mole,
  onPickPhoto,
  onDeletePhoto,
  colors,
}: {
  mole: any;
  onPickPhoto: () => void;
  onDeletePhoto: (id: string) => void;
  colors: any;
}) {
  const [comparing, setComparing] = useState<[string, string] | null>(null);
  const sortedPhotos = [...mole.photos].sort(
    (a: any, b: any) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
  );

  return (
    <View style={styles.tabContent}>
      <Button title="Add Photo from Library" onPress={onPickPhoto} variant="secondary" fullWidth />

      {comparing && (
        <Card>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
            Side-by-side comparison
          </Text>
          <View style={styles.compareRow}>
            {comparing.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={styles.compareImage}
                resizeMode="cover"
              />
            ))}
          </View>
          <Pressable onPress={() => setComparing(null)}>
            <Text style={[styles.clearCompare, { color: colors.mutedForeground }]}>
              Clear comparison
            </Text>
          </Pressable>
        </Card>
      )}

      {sortedPhotos.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Feather name="image" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No photos yet. Add your first photo to begin tracking.
          </Text>
        </View>
      ) : (
        <View style={styles.photoTimeline}>
          {sortedPhotos.map((photo: any, index: number) => (
            <Card key={photo.id} style={styles.photoCard}>
              <Image
                source={{ uri: photo.localUri }}
                style={styles.photoImage}
                resizeMode="cover"
              />
              <View style={styles.photoFooter}>
                <Text style={[styles.photoDate, { color: colors.foreground }]}>
                  {new Date(photo.capturedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
                <View style={styles.photoActions}>
                  {sortedPhotos.length >= 2 && index > 0 && (
                    <Pressable
                      onPress={() =>
                        setComparing([sortedPhotos[0].localUri, photo.localUri])
                      }
                      style={[styles.photoActionBtn, { backgroundColor: colors.primaryLight }]}
                    >
                      <Feather name="columns" size={14} color={colors.primary} />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() =>
                      Alert.alert("Delete Photo", "Remove this photo?", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => onDeletePhoto(photo.id),
                        },
                      ])
                    }
                    style={[styles.photoActionBtn, { backgroundColor: "#ffebee" }]}
                  >
                    <Feather name="trash-2" size={14} color="#c62828" />
                  </Pressable>
                </View>
              </View>
              {photo.notes && (
                <Text style={[styles.photoNote, { color: colors.mutedForeground }]}>
                  {photo.notes}
                </Text>
              )}
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

function HistoryTab({
  mole,
  showAddUpdate,
  setShowAddUpdate,
  newNote,
  setNewNote,
  newSizeMm,
  setNewSizeMm,
  onSave,
  colors,
}: {
  mole: any;
  showAddUpdate: boolean;
  setShowAddUpdate: (v: boolean) => void;
  newNote: string;
  setNewNote: (v: string) => void;
  newSizeMm: string;
  setNewSizeMm: (v: string) => void;
  onSave: () => void;
  colors: any;
}) {
  const sortedLogs = [...mole.updateLog].sort(
    (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <View style={styles.tabContent}>
      <Pressable
        onPress={() => setShowAddUpdate(!showAddUpdate)}
        style={[styles.addUpdateBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
      >
        <Feather name={showAddUpdate ? "minus" : "plus"} size={16} color={colors.primary} />
        <Text style={[styles.addUpdateBtnText, { color: colors.primary }]}>
          {showAddUpdate ? "Cancel Update" : "Log an Update"}
        </Text>
      </Pressable>

      {showAddUpdate && (
        <Card>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>
            New Update
          </Text>
          <TextInput
            value={newNote}
            onChangeText={setNewNote}
            placeholder="What changed? Any new observations..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            style={[
              styles.input,
              styles.textarea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
          />
          <View style={styles.sizeRow}>
            <TextInput
              value={newSizeMm}
              onChangeText={setNewSizeMm}
              placeholder="Size (mm)"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              style={[
                styles.input,
                { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
              ]}
            />
          </View>
          <Button title="Save Update" onPress={onSave} fullWidth />
        </Card>
      )}

      {sortedLogs.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Feather name="clock" size={28} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No history yet. Log updates over time to track changes.
          </Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {sortedLogs.map((log: any, i: number) => (
            <View key={log.id} style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
              {i < sortedLogs.length - 1 && (
                <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
              )}
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineDate, { color: colors.mutedForeground }]}>
                  {new Date(log.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
                {log.note && (
                  <Text style={[styles.timelineNote, { color: colors.foreground }]}>
                    {log.note}
                  </Text>
                )}
                {log.sizeMm && (
                  <Text style={[styles.timelineMeta, { color: colors.mutedForeground }]}>
                    Size: ~{log.sizeMm}mm
                  </Text>
                )}
                {log.aiScoreSnapshot && (
                  <View style={styles.scoreRow}>
                    <ScoreBar score={log.aiScoreSnapshot} compact />
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ABCDETab({ abcde, score, colors }: { abcde: any; score: number; colors: any }) {
  const items = [
    { key: "asymmetry", letter: "A", label: "Asymmetry", desc: ABCDE_DESCRIPTIONS.asymmetry },
    { key: "border", letter: "B", label: "Border", desc: ABCDE_DESCRIPTIONS.border },
    { key: "color", letter: "C", label: "Color", desc: ABCDE_DESCRIPTIONS.color },
    { key: "diameter", letter: "D", label: "Diameter", desc: ABCDE_DESCRIPTIONS.diameter },
    { key: "evolution", letter: "E", label: "Evolution", desc: ABCDE_DESCRIPTIONS.evolution },
  ] as const;

  return (
    <View style={styles.tabContent}>
      <View style={[styles.abcdeBanner, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.abcdeBannerTitle, { color: colors.primary }]}>
          ABCDE Framework
        </Text>
        <Text style={[styles.abcdeBannerDesc, { color: colors.primary }]}>
          A clinical mnemonic used by dermatologists to assess moles. Your entries below are for tracking purposes only — not a diagnosis.
        </Text>
      </View>

      {items.map(({ key, letter, label, desc }) => (
        <Card key={key}>
          <View style={styles.abcdeRow}>
            <View style={[styles.abcdeLetter, { backgroundColor: colors.primary }]}>
              <Text style={styles.abcdeLetterText}>{letter}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.abcdeLabel, { color: colors.foreground }]}>
                {label}
              </Text>
              <Text style={[styles.abcdeDesc, { color: colors.mutedForeground }]}>
                {desc}
              </Text>
              <Text style={[styles.abcdeValue, { color: colors.foreground }]}>
                {abcde[key] || "Not recorded"}
              </Text>
            </View>
          </View>
        </Card>
      ))}

      <View style={[styles.disclaimerBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.disclaimerBoxText, { color: colors.mutedForeground }]}>
          {CONCERN_SCORE_DISCLAIMER}
        </Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: 200 },
  nameInput: {
    fontSize: 18, fontFamily: "Inter_600SemiBold", borderBottomWidth: 2, paddingBottom: 2, textAlign: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", textTransform: "capitalize" },
  deleteBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  tabsBar: { borderBottomWidth: 1 },
  tabsContent: { paddingHorizontal: 16, gap: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, marginVertical: 4 },
  tabText: { fontSize: 14 },
  scrollContent: { padding: 16, gap: 16 },
  tabContent: { gap: 16 },
  cardLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  highScoreBox: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 10, marginTop: 10, alignItems: "flex-start" },
  highScoreText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  disclaimerSmall: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 8, lineHeight: 16 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 6, gap: 12 },
  infoLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1, textAlign: "right" },
  symptomsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  symptomBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  symptomBadgeText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  noSymptoms: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 4 },
  urgentWarning: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  urgentText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  emptyBox: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  compareRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  compareImage: { flex: 1, height: 180, borderRadius: 12 },
  clearCompare: { textAlign: "center", marginTop: 8, fontSize: 13, fontFamily: "Inter_400Regular" },
  photoTimeline: { gap: 12 },
  photoCard: { padding: 12, gap: 8 },
  photoImage: { width: "100%", height: 200, borderRadius: 12 },
  photoFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  photoDate: { fontSize: 14, fontFamily: "Inter_500Medium" },
  photoActions: { flexDirection: "row", gap: 8 },
  photoActionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  photoNote: { fontSize: 12, fontFamily: "Inter_400Regular" },
  addUpdateBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  addUpdateBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  sizeRow: { flexDirection: "row", gap: 10 },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: "row", gap: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineLine: { position: "absolute", left: 4, top: 14, width: 2, bottom: 0 },
  timelineContent: { flex: 1, paddingBottom: 20, gap: 4 },
  timelineDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  timelineNote: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  timelineMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scoreRow: { marginTop: 4 },
  abcdeBanner: { padding: 16, borderRadius: 14, gap: 6 },
  abcdeBannerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  abcdeBannerDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  abcdeRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  abcdeLetter: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  abcdeLetterText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  abcdeLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  abcdeDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginBottom: 6 },
  abcdeValue: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  disclaimerBox: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  disclaimerBoxText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
