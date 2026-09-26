import React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
export function Screen({
  title,
  subtitle,
  children,
  back = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  back?: boolean;
}) {
  const colors = useColors(),
    router = useRouter(),
    insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        width: "100%",
        maxWidth: 1040,
        alignSelf: "center",
        paddingHorizontal: 24,
        paddingTop: insets.top + 24,
        paddingBottom: 64,
        gap: 24,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 15,
            color: colors.primary,
            letterSpacing: 0.3,
          }}
        >
          ◌ MOLE TRACKER
        </Text>
        {back && (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.replace("/(tabs)")}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text
              style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}
            >
              ← All records
            </Text>
          </Pressable>
        )}
      </View>
      <View style={{ gap: 10 }}>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 34,
            lineHeight: 42,
            color: colors.foreground,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              lineHeight: 25,
              color: colors.mutedForeground,
              maxWidth: 680,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {children}
    </ScrollView>
  );
}
export function Panel({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 20,
        padding: 22,
        gap: 16,
      }}
    >
      {title && (
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 19,
            color: colors.foreground,
          }}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}
export function Copy({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <Text
      style={{
        fontFamily: "Inter_400Regular",
        fontSize: 14,
        lineHeight: 22,
        color: colors.mutedForeground,
      }}
    >
      {children}
    </Text>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const colors = useColors();
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: 13,
          color: colors.foreground,
        }}
      >
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.mutedForeground}
        {...props}
        style={[
          {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 14,
            minHeight: 48,
            fontFamily: "Inter_400Regular",
            fontSize: 16,
            color: colors.foreground,
            backgroundColor: colors.background,
          },
          props.multiline && { minHeight: 100, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primaryLight : colors.card,
      }}
    >
      <Text
        style={{
          fontFamily: "Inter_500Medium",
          color: selected ? colors.primary : colors.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
