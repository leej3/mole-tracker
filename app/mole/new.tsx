import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { BodyView, SymptomFlag, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/ui/Button";
import { SYMPTOM_LABELS, calculateConcernScore } from "@/utils/scoring";

export default function NewMoleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    x: string;
    y: string;
    z: string;
    normalX: string;
    normalY: string;
    normalZ: string;
    region: string;
    view: string;
    profileId: string;
  }>();

  const { createMole, addUpdateLog, profiles, activeProfileId } = useApp();

  const profileId = params.profileId || activeProfileId || "";
  const profile = profiles.find((p) => p.id === profileId);

  const bodyX = parseFloat(params.x || "0");
  const bodyY = parseFloat(params.y || "0");
  const bodyZ = parseFloat(params.z || "0");
  const bodyRegion = params.region || "unknown";
  const bodyView = (params.view || "front") as BodyView;

  const regionLabel = bodyRegion.replace(/_/g, " ");
  const existingCount = 1;
  const defaultName = `${regionLabel} mole ${String(existingCount).padStart(2, "0")}`;

  const [customName, setCustomName] = useState("");
  const [firstNoticed, setFirstNoticed] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sizeMm, setSizeMm] = useState("");
  const [colorNotes, setColorNotes] = useState("");
  const [borderNotes, setBorderNotes] = useState("");
  const [shapeNotes, setShapeNotes] = useState("");
  const [symptoms, setSymptoms] = useState<SymptomFlag[]>(["none"]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSymptom = (s: SymptomFlag) => {
    if (s === "none") {
      setSymptoms(["none"]);
      return;
    }
    setSymptoms((prev) => {
      const without = prev.filter((x) => x !== "none");
      if (without.includes(s)) {
        const next = without.filter((x) => x !== s);
        return next.length === 0 ? ["none"] : next;
      }
      return [...without, s];
    });
  };

  const save = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const newMole = await createMole({
        profileId,
        defaultName,
        customName: customName || undefined,
        bodyView,
        bodyRegion,
        bodyX,
        bodyY,
        bodyZ,
        firstNoticedDate: firstNoticed.toISOString().split("T")[0],
        latestSizeMm: sizeMm ? parseFloat(sizeMm) : undefined,
        colorNotes: colorNotes || undefined,
        borderNotes: borderNotes || undefined,
        shapeNotes: shapeNotes || undefined,
        symptomFlags: symptoms,
      });

      const score = calculateConcernScore(newMole);
      await addUpdateLog(newMole.id, {
        timestamp: new Date().toISOString(),
        sizeMm: sizeMm ? parseFloat(sizeMm) : undefined,
        note: notes || "Mole added",
        aiScoreSnapshot: score,
      });

      router.replace(`/mole/${newMole.id}` as any);
    } finally {
      setLoading(false);
    }
  };

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
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            New Mole
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {regionLabel} · {bodyView}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.locationBadge,
            { backgroundColor: colors.primaryLight },
          ]}
        >
          <Feather name="map-pin" size={14} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.primary }]}>
            {regionLabel} — {bodyView} view
          </Text>
        </View>

        <Section title="Name" colors={colors}>
          <Text style={[styles.defaultNameHint, { color: colors.mutedForeground }]}>
            Auto-name: {defaultName}
          </Text>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="Custom name (optional)"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
          />
        </Section>

        <Section title="First Noticed" colors={colors}>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.dateBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Feather name="calendar" size={16} color={colors.primary} />
            <Text style={[styles.dateBtnText, { color: colors.foreground }]}>
              {firstNoticed.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={firstNoticed}
              mode="date"
              maximumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setFirstNoticed(date);
              }}
            />
          )}
        </Section>

        <Section title="Estimated Size" colors={colors}>
          <View style={styles.sizeRow}>
            <TextInput
              value={sizeMm}
              onChangeText={setSizeMm}
              placeholder="e.g. 4"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              style={[
                styles.input,
                styles.sizeInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
            <Text style={[styles.mmLabel, { color: colors.mutedForeground }]}>
              mm (estimate)
            </Text>
          </View>
          <Text style={[styles.sizeHint, { color: colors.mutedForeground }]}>
            A pencil eraser is about 6mm for reference.
          </Text>
        </Section>

        <Section title="Symptoms" colors={colors}>
          <View style={styles.symptomsGrid}>
            {(Object.keys(SYMPTOM_LABELS) as SymptomFlag[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => toggleSymptom(s)}
                style={[
                  styles.symptomChip,
                  {
                    backgroundColor: symptoms.includes(s)
                      ? s === "none"
                        ? colors.primary
                        : "#e53935"
                      : colors.surface,
                    borderColor: symptoms.includes(s)
                      ? s === "none"
                        ? colors.primary
                        : "#e53935"
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.symptomText,
                    {
                      color: symptoms.includes(s)
                        ? "#fff"
                        : colors.foreground,
                    },
                  ]}
                >
                  {SYMPTOM_LABELS[s]}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Observations" colors={colors}>
          <TextInput
            value={colorNotes}
            onChangeText={setColorNotes}
            placeholder="Color notes (e.g. uniform brown, mixed tones)"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
          />
          <TextInput
            value={borderNotes}
            onChangeText={setBorderNotes}
            placeholder="Border notes (e.g. smooth, irregular)"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
          />
          <TextInput
            value={shapeNotes}
            onChangeText={setShapeNotes}
            placeholder="Shape notes (e.g. round, oval)"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
          />
        </Section>

        <Section title="Additional Notes" colors={colors}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any other notes..."
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
        </Section>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16),
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Button
          title="Save Mole"
          onPress={save}
          loading={loading}
          fullWidth
        />
      </View>
    </View>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      {children}
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
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    textTransform: "capitalize",
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  locationText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  defaultNameHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  dateBtnText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sizeInput: {
    width: 80,
  },
  mmLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sizeHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  symptomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  symptomChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  symptomText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
