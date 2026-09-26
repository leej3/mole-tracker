import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  CONCERN_SCORE_COLORS,
  CONCERN_SCORE_LABELS,
} from "@/utils/scoring";
import { useColors } from "@/hooks/useColors";

interface ScoreBarProps {
  score: number;
  showLabel?: boolean;
  compact?: boolean;
}

export function ScoreBar({ score, showLabel = true, compact = false }: ScoreBarProps) {
  const colors = useColors();
  const scoreColor = CONCERN_SCORE_COLORS[score] || colors.muted;
  const label = CONCERN_SCORE_LABELS[score] || "";

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              compact ? styles.dotCompact : {},
              {
                backgroundColor:
                  i <= score ? scoreColor : colors.border,
              },
            ]}
          />
        ))}
        <Text
          style={[
            styles.scoreNum,
            { color: scoreColor },
            compact && styles.scoreNumCompact,
          ]}
        >
          {score}/5
        </Text>
      </View>
      {showLabel && !compact && (
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotCompact: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scoreNum: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginLeft: 4,
  },
  scoreNumCompact: {
    fontSize: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
