import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BodyType, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/ui/Button";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STEPS = ["disclaimer", "profile", "body_type", "tutorial"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding, createProfile } = useApp();

  const [step, setStep] = useState<Step>("disclaimer");
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [relationship, setRelationship] = useState("Myself");
  const [bodyType, setBodyType] = useState<BodyType>("male");
  const [loading, setLoading] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex + 1) / STEPS.length;

  const goNext = async () => {
    if (step === "disclaimer" && !disclaimerChecked) return;
    if (step === "profile") {
      if (!profileName.trim()) return;
    }
    if (step === "tutorial") {
      await finish();
      return;
    }
    setStep(STEPS[stepIndex + 1]);
  };

  const finish = async () => {
    setLoading(true);
    try {
      await createProfile({
        name: profileName || "Me",
        avatar: "person.circle",
        relationship,
        birthYear: birthYear ? parseInt(birthYear) : undefined,
        bodyType,
      });
      await completeOnboarding(bodyType);
      router.replace("/(tabs)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 20 },
      ]}
    >
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === "disclaimer" && (
          <DisclaimerStep
            checked={disclaimerChecked}
            onToggle={() => setDisclaimerChecked((v) => !v)}
            colors={colors}
          />
        )}
        {step === "profile" && (
          <ProfileStep
            name={profileName}
            onNameChange={setProfileName}
            birthYear={birthYear}
            onBirthYearChange={setBirthYear}
            relationship={relationship}
            onRelationshipChange={setRelationship}
            colors={colors}
          />
        )}
        {step === "body_type" && (
          <BodyTypeStep
            selected={bodyType}
            onSelect={setBodyType}
            colors={colors}
          />
        )}
        {step === "tutorial" && <TutorialStep colors={colors} />}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 16, borderTopColor: colors.border },
        ]}
      >
        {stepIndex > 0 && (
          <Pressable
            onPress={() => setStep(STEPS[stepIndex - 1])}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
          </Pressable>
        )}
        <Button
          title={step === "tutorial" ? "Get Started" : "Continue"}
          onPress={goNext}
          disabled={
            (step === "disclaimer" && !disclaimerChecked) ||
            (step === "profile" && !profileName.trim())
          }
          loading={loading}
          style={{ flex: 1 }}
          fullWidth
        />
      </View>
    </View>
  );
}

function DisclaimerStep({
  checked,
  onToggle,
  colors,
}: {
  checked: boolean;
  onToggle: () => void;
  colors: any;
}) {
  return (
    <View style={styles.stepContainer}>
      <View
        style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}
      >
        <Feather name="shield" size={36} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>
        Important Disclaimer
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
        Please read carefully before continuing
      </Text>

      <View
        style={[styles.disclaimerBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[styles.disclaimerText, { color: colors.foreground }]}>
          <Text style={{ fontFamily: "Inter_600SemiBold" }}>
            Mole Tracker is not a medical device.{"\n\n"}
          </Text>
          This app is designed to help you{" "}
          <Text style={{ fontFamily: "Inter_600SemiBold" }}>
            organize and document
          </Text>{" "}
          your moles over time so you can share this information with a
          healthcare professional.{"\n\n"}
          Mole Tracker does{" "}
          <Text style={{ fontFamily: "Inter_600SemiBold" }}>not diagnose</Text>{" "}
          skin conditions, cancer, or any other medical condition. Concern
          scores and summaries are for educational tracking only.{"\n\n"}
          If you are concerned about any skin change, please consult a qualified
          dermatologist or your primary care physician promptly.
        </Text>
      </View>

      <Pressable
        onPress={onToggle}
        style={styles.checkRow}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: checked ? colors.primary : colors.surface,
              borderColor: checked ? colors.primary : colors.border,
            },
          ]}
        >
          {checked && <Feather name="check" size={14} color="#fff" />}
        </View>
        <Text style={[styles.checkLabel, { color: colors.foreground }]}>
          I understand this app is for personal tracking only and not a
          substitute for professional medical advice.
        </Text>
      </Pressable>
    </View>
  );
}

function ProfileStep({
  name,
  onNameChange,
  birthYear,
  onBirthYearChange,
  relationship,
  onRelationshipChange,
  colors,
}: {
  name: string;
  onNameChange: (v: string) => void;
  birthYear: string;
  onBirthYearChange: (v: string) => void;
  relationship: string;
  onRelationshipChange: (v: string) => void;
  colors: any;
}) {
  const relationships = ["Myself", "Child", "Parent", "Partner", "Other"];

  return (
    <View style={styles.stepContainer}>
      <View
        style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}
      >
        <Feather name="user" size={36} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>
        Create Your First Profile
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
        Mole Tracker supports multiple profiles — for yourself, a child, or
        anyone you care for.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          Profile Name *
        </Text>
        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder="e.g. Alex, Mom, Leo"
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
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          Relationship
        </Text>
        <View style={styles.chipsRow}>
          {relationships.map((r) => (
            <Pressable
              key={r}
              onPress={() => onRelationshipChange(r)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    relationship === r ? colors.primary : colors.surface,
                  borderColor:
                    relationship === r ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      relationship === r
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          Birth Year (optional)
        </Text>
        <TextInput
          value={birthYear}
          onChangeText={onBirthYearChange}
          placeholder="e.g. 1988"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="number-pad"
          maxLength={4}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
        />
      </View>
    </View>
  );
}

function BodyTypeStep({
  selected,
  onSelect,
  colors,
}: {
  selected: BodyType;
  onSelect: (v: BodyType) => void;
  colors: any;
}) {
  return (
    <View style={styles.stepContainer}>
      <View
        style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}
      >
        <Feather name="users" size={36} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>
        Choose Body Map Style
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
        This determines the body outline on your map. You can change this later
        in profile settings.
      </Text>

      <View style={styles.bodyTypeRow}>
        {(["male", "female"] as BodyType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => onSelect(t)}
            style={[
              styles.bodyTypeCard,
              {
                backgroundColor:
                  selected === t ? colors.primaryLight : colors.surface,
                borderColor:
                  selected === t ? colors.primary : colors.border,
              },
            ]}
          >
            <Feather
              name={t === "male" ? "user" : "user"}
              size={48}
              color={selected === t ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.bodyTypeLabel,
                {
                  color:
                    selected === t ? colors.primary : colors.foreground,
                  fontFamily:
                    selected === t
                      ? "Inter_600SemiBold"
                      : "Inter_400Regular",
                },
              ]}
            >
              {t === "male" ? "Body Type A" : "Body Type B"}
            </Text>
            {selected === t && (
              <View
                style={[
                  styles.checkMark,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Feather name="check" size={12} color="#fff" />
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TutorialStep({ colors }: { colors: any }) {
  const steps = [
    {
      icon: "map-pin" as const,
      title: "Pin a mole",
      desc: "Tap anywhere on the body map to mark where a mole is located.",
    },
    {
      icon: "camera" as const,
      title: "Add photos",
      desc: "Upload photos from your camera roll to build a visual timeline.",
    },
    {
      icon: "activity" as const,
      title: "Track changes",
      desc: "Log symptoms, sizes, and notes to monitor changes over time.",
    },
    {
      icon: "share-2" as const,
      title: "Share with your doctor",
      desc: "Export a clear PDF report to share at your next appointment.",
    },
  ];

  return (
    <View style={styles.stepContainer}>
      <View
        style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}
      >
        <Feather name="star" size={36} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>
        How It Works
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
        Mole Tracker makes it easy to document and share your skin health
        history.
      </Text>

      <View style={styles.tutorialList}>
        {steps.map((s, i) => (
          <View key={i} style={styles.tutorialItem}>
            <View
              style={[
                styles.tutorialIconBox,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Feather name={s.icon} size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.tutorialTitle, { color: colors.foreground }]}
              >
                {s.title}
              </Text>
              <Text
                style={[
                  styles.tutorialDesc,
                  { color: colors.mutedForeground },
                ]}
              >
                {s.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBar: {
    height: 3,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 24,
    marginBottom: 8,
    borderRadius: 2,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  stepContainer: {
    gap: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  stepTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 32,
  },
  stepSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  disclaimerBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  disclaimerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  checkRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  bodyTypeRow: {
    flexDirection: "row",
    gap: 12,
  },
  bodyTypeCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    gap: 10,
    position: "relative",
  },
  bodyTypeLabel: {
    fontSize: 15,
    textAlign: "center",
  },
  checkMark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  tutorialList: {
    gap: 16,
  },
  tutorialItem: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  tutorialIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tutorialTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  tutorialDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  backBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
