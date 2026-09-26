import { ABCDESnapshot, Mole, MolePhoto, SymptomFlag } from "../context/AppContext";

export const CONCERN_SCORE_LABELS: Record<number, string> = {
  1: "No visible change",
  2: "Minor change worth routine monitoring",
  3: "Noticeable change worth mentioning at next visit",
  4: "Concerning change worth scheduling a doctor appointment",
  5: "Urgent-looking change that should be reviewed promptly",
};

export const CONCERN_SCORE_COLORS: Record<number, string> = {
  1: "#2d7a3a",
  2: "#558b2f",
  3: "#f57c00",
  4: "#e64a19",
  5: "#b71c1c",
};

export const CONCERN_SCORE_DISCLAIMER =
  "This score is for educational tracking and organization only. It is not a medical diagnosis. Always consult a qualified healthcare professional about your skin health.";

export const HIGH_SCORE_DISCLAIMER =
  "This entry shows changes that may be worth discussing with a healthcare professional soon. This app does not diagnose medical conditions.";

export const URGENT_SYMPTOMS: SymptomFlag[] = [
  "bleeding",
  "rapid_growth",
  "color_darkening",
];

export function calculateConcernScore(mole: Mole): number {
  let score = 1;

  const hasUrgentSymptom = mole.symptomFlags.some((s) =>
    URGENT_SYMPTOMS.includes(s)
  );
  if (hasUrgentSymptom) score = Math.max(score, 4);

  const hasMildSymptom = mole.symptomFlags.some(
    (s) =>
      s !== "none" &&
      !URGENT_SYMPTOMS.includes(s)
  );
  if (hasMildSymptom && score < 3) score = 3;

  if (mole.latestSizeMm && mole.latestSizeMm >= 6) score = Math.max(score, 2);
  if (mole.latestSizeMm && mole.latestSizeMm > 10) score = Math.max(score, 3);

  const abcde = mole.abcdeSummary;
  if (abcde) {
    const redFlags = [
      abcde.asymmetry?.toLowerCase().includes("asym"),
      abcde.border?.toLowerCase().includes("irregular"),
      abcde.color?.toLowerCase().includes("mix"),
      abcde.diameter?.toLowerCase().includes("larger"),
      abcde.evolution?.toLowerCase().includes("chang"),
    ].filter(Boolean).length;

    if (redFlags >= 3) score = Math.max(score, 4);
    else if (redFlags === 2) score = Math.max(score, 3);
    else if (redFlags === 1) score = Math.max(score, 2);
  }

  if (mole.updateLog.length >= 2) {
    const logs = mole.updateLog.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const first = logs[0];
    const last = logs[logs.length - 1];
    if (first.sizeMm && last.sizeMm && last.sizeMm > first.sizeMm * 1.5) {
      score = Math.max(score, 4);
    } else if (first.sizeMm && last.sizeMm && last.sizeMm > first.sizeMm * 1.2) {
      score = Math.max(score, 3);
    }
  }

  return Math.min(5, score);
}

export function getABCDESummary(mole: Mole): ABCDESnapshot {
  const existing = mole.abcdeSummary || {};

  return {
    asymmetry: existing.asymmetry || deriveAsymmetry(mole),
    border: existing.border || deriveBorder(mole),
    color: existing.color || deriveColor(mole),
    diameter: existing.diameter || deriveDiameter(mole),
    evolution: existing.evolution || deriveEvolution(mole),
  };
}

function deriveAsymmetry(mole: Mole): string {
  if (mole.shapeNotes?.toLowerCase().includes("irregular")) {
    return "Possible asymmetry noted";
  }
  return "No asymmetry recorded";
}

function deriveBorder(mole: Mole): string {
  if (
    mole.borderNotes?.toLowerCase().includes("irregular") ||
    mole.borderNotes?.toLowerCase().includes("uneven")
  ) {
    return "Irregular or poorly defined border";
  }
  return "Border appears regular";
}

function deriveColor(mole: Mole): string {
  if (
    mole.colorNotes?.toLowerCase().includes("mix") ||
    mole.colorNotes?.toLowerCase().includes("multi") ||
    mole.colorNotes?.toLowerCase().includes("varied")
  ) {
    return "Multiple colors present";
  }
  return "Uniform coloration";
}

function deriveDiameter(mole: Mole): string {
  if (!mole.latestSizeMm) return "Size not recorded";
  if (mole.latestSizeMm >= 6) {
    return `~${mole.latestSizeMm}mm — at or above 6mm (pencil eraser)`;
  }
  return `~${mole.latestSizeMm}mm — within common range`;
}

function deriveEvolution(mole: Mole): string {
  if (mole.updateLog.length < 2) return "Not enough history to assess evolution";
  const hasGrowth = mole.symptomFlags.includes("rapid_growth");
  const hasColorChange = mole.symptomFlags.includes("color_darkening");
  const hasIrregular = mole.symptomFlags.includes("irregular_border");
  if (hasGrowth || hasColorChange || hasIrregular) {
    return "Changes recorded — worth monitoring";
  }
  return "No significant changes recorded";
}

export const SYMPTOM_LABELS: Record<SymptomFlag, string> = {
  itching: "Itching",
  bleeding: "Bleeding",
  pain: "Pain or tenderness",
  crusting: "Crusting / scabbing",
  rapid_growth: "Rapid growth",
  color_darkening: "Color darkening",
  irregular_border: "Border becoming irregular",
  raised: "Raised / elevated",
  none: "No symptoms",
};

export const ABCDE_DESCRIPTIONS = {
  asymmetry: "One half is unlike the other half.",
  border: "Irregular, scalloped, or poorly defined border.",
  color: "Varied colors (brown, black, red, white, or blue).",
  diameter: "Often, but not always, larger than 6mm (pencil eraser).",
  evolution: "Changing in size, shape, color, or a new lesion.",
};
