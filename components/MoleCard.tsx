import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Mole } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { calculateConcernScore, CONCERN_SCORE_COLORS, CONCERN_SCORE_LABELS, SYMPTOM_LABELS } from "@/utils/scoring";
import { Card } from "./ui/Card";

interface MoleCardProps {
  mole: Mole;
}

export function MoleCard({ mole }: MoleCardProps) {
  const colors = useColors();
  const router = useRouter();
  const score = calculateConcernScore(mole);
  const scoreColor = CONCERN_SCORE_COLORS[score];
  const displayName = mole.customName || mole.defaultName;
  const lastUpdated = new Date(mole.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const activeSymptoms = mole.symptomFlags.filter((s) => s !== "none");

  return (
    <Pressable
      onPress={() => router.push(`/mole/${mole.id}` as any)}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <Card style={[styles.card, { borderLeftColor: scoreColor, borderLeftWidth: 4 }]}>
        <View style={styles.header}>
          <View style={styles.titleArea}>
            <View
              style={[
                styles.scoreIndicator,
                { backgroundColor: scoreColor },
              ]}
            >
              <Text style={styles.scoreNum}>{score}</Text>
            </View>
            <View style={styles.titleTexts}>
              <Text
                style={[styles.name, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text
                style={[styles.region, { color: colors.mutedForeground }]}
              >
                {mole.bodyRegion.replace(/_/g, " ")} · {mole.bodyView}
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.footer}>
          <View style={[styles.footerItem, styles.levelBadge, { backgroundColor: scoreColor + '22', borderColor: scoreColor + '55' }]}>
            <Text style={[styles.levelText, { color: scoreColor }]}>
              Level {score}/5
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Feather name="image" size={12} color={colors.mutedForeground} />
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              {mole.photos.length} {mole.photos.length === 1 ? "photo" : "photos"}
            </Text>
          </View>
          {mole.latestSizeMm && (
            <View style={styles.footerItem}>
              <Feather name="maximize" size={12} color={colors.mutedForeground} />
              <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                {mole.latestSizeMm}mm
              </Text>
            </View>
          )}
          <View style={styles.footerItem}>
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              {lastUpdated}
            </Text>
          </View>
        </View>

        {activeSymptoms.length > 0 && (
          <View style={[styles.symptomsRow, { backgroundColor: colors.warningLight }]}>
            <Feather name="alert-circle" size={11} color={colors.warning} />
            <Text style={[styles.symptomsText, { color: colors.warning }]}>
              {activeSymptoms
                .slice(0, 2)
                .map((s) => SYMPTOM_LABELS[s])
                .join(", ")}
              {activeSymptoms.length > 2 ? ` +${activeSymptoms.length - 2}` : ""}
            </Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  scoreIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNum: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  titleTexts: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  region: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    textTransform: "capitalize",
  },
  divider: {
    height: 1,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  symptomsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  symptomsText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  levelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  levelText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
