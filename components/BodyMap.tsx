import React, { useRef, useState } from "react";
import {
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BodyView, BodyType, Mole } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { CONCERN_SCORE_COLORS } from "@/utils/scoring";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface BodyMapProps {
  bodyType: BodyType;
  view: BodyView;
  moles: Mole[];
  onTapLocation?: (x: number, y: number, region: string) => void;
  onTapMole?: (mole: Mole) => void;
  interactive?: boolean;
  width?: number;
  height?: number;
}

const BODY_REGIONS: Record<BodyView, Array<{ region: string; label: string; x: [number, number]; y: [number, number] }>> = {
  front: [
    { region: "head", label: "Head", x: [0.35, 0.65], y: [0.0, 0.12] },
    { region: "neck", label: "Neck", x: [0.4, 0.6], y: [0.12, 0.17] },
    { region: "chest", label: "Chest", x: [0.3, 0.7], y: [0.17, 0.32] },
    { region: "abdomen", label: "Abdomen", x: [0.3, 0.7], y: [0.32, 0.48] },
    { region: "left_arm", label: "L. Arm", x: [0.0, 0.3], y: [0.17, 0.55] },
    { region: "right_arm", label: "R. Arm", x: [0.7, 1.0], y: [0.17, 0.55] },
    { region: "left_thigh", label: "L. Thigh", x: [0.3, 0.5], y: [0.48, 0.68] },
    { region: "right_thigh", label: "R. Thigh", x: [0.5, 0.7], y: [0.48, 0.68] },
    { region: "left_lower_leg", label: "L. Lower Leg", x: [0.3, 0.5], y: [0.68, 0.9] },
    { region: "right_lower_leg", label: "R. Lower Leg", x: [0.5, 0.7], y: [0.68, 0.9] },
    { region: "feet", label: "Feet", x: [0.25, 0.75], y: [0.9, 1.0] },
  ],
  back: [
    { region: "back_head", label: "Head", x: [0.35, 0.65], y: [0.0, 0.12] },
    { region: "back_neck", label: "Neck", x: [0.4, 0.6], y: [0.12, 0.17] },
    { region: "upper_back", label: "Upper Back", x: [0.3, 0.7], y: [0.17, 0.32] },
    { region: "lower_back", label: "Lower Back", x: [0.3, 0.7], y: [0.32, 0.48] },
    { region: "left_shoulder", label: "L. Shoulder", x: [0.1, 0.3], y: [0.17, 0.27] },
    { region: "right_shoulder", label: "R. Shoulder", x: [0.7, 0.9], y: [0.17, 0.27] },
    { region: "left_arm_back", label: "L. Arm", x: [0.0, 0.3], y: [0.27, 0.55] },
    { region: "right_arm_back", label: "R. Arm", x: [0.7, 1.0], y: [0.27, 0.55] },
    { region: "buttocks", label: "Buttocks", x: [0.3, 0.7], y: [0.48, 0.62] },
    { region: "back_left_thigh", label: "L. Thigh", x: [0.3, 0.5], y: [0.62, 0.78] },
    { region: "back_right_thigh", label: "R. Thigh", x: [0.5, 0.7], y: [0.62, 0.78] },
    { region: "back_legs", label: "Lower Legs", x: [0.25, 0.75], y: [0.78, 1.0] },
  ],
  left: [
    { region: "left_side_head", label: "Head", x: [0.3, 0.7], y: [0.0, 0.12] },
    { region: "left_side_neck", label: "Neck", x: [0.35, 0.65], y: [0.12, 0.17] },
    { region: "left_side_torso", label: "Torso", x: [0.25, 0.75], y: [0.17, 0.48] },
    { region: "left_side_arm", label: "Left Arm", x: [0.0, 0.25], y: [0.17, 0.55] },
    { region: "left_side_hip", label: "Hip", x: [0.25, 0.75], y: [0.48, 0.62] },
    { region: "left_side_leg", label: "Left Leg", x: [0.2, 0.8], y: [0.62, 1.0] },
  ],
  right: [
    { region: "right_side_head", label: "Head", x: [0.3, 0.7], y: [0.0, 0.12] },
    { region: "right_side_neck", label: "Neck", x: [0.35, 0.65], y: [0.12, 0.17] },
    { region: "right_side_torso", label: "Torso", x: [0.25, 0.75], y: [0.17, 0.48] },
    { region: "right_side_arm", label: "Right Arm", x: [0.75, 1.0], y: [0.17, 0.55] },
    { region: "right_side_hip", label: "Hip", x: [0.25, 0.75], y: [0.48, 0.62] },
    { region: "right_side_leg", label: "Right Leg", x: [0.2, 0.8], y: [0.62, 1.0] },
  ],
};

function getRegionForCoords(view: BodyView, x: number, y: number): string {
  const regions = BODY_REGIONS[view];
  for (const region of regions) {
    if (
      x >= region.x[0] &&
      x <= region.x[1] &&
      y >= region.y[0] &&
      y <= region.y[1]
    ) {
      return region.region;
    }
  }
  return "unknown";
}

function getRegionLabel(view: BodyView, region: string): string {
  const regions = BODY_REGIONS[view];
  return regions.find((r) => r.region === region)?.label || region;
}

function BodySilhouette({
  bodyType,
  view,
  width,
  height,
  colors,
}: {
  bodyType: BodyType;
  view: BodyView;
  width: number;
  height: number;
  colors: ReturnType<typeof useColors>;
}) {
  const isFemale = bodyType === "female";
  const cx = width / 2;

  const headY = height * 0.06;
  const headR = width * 0.1;

  const neckTop = height * 0.12;
  const neckBot = height * 0.16;
  const neckW = width * 0.07;

  const shoulderY = height * 0.19;
  const shoulderW = isFemale ? width * 0.36 : width * 0.38;

  const hipY = height * 0.5;
  const hipW = isFemale ? width * 0.32 : width * 0.27;

  const bodyColor = colors.sageLighter;
  const outlineColor = colors.sage;

  if (view === "front" || view === "back") {
    return (
      <>
        <View
          style={{
            position: "absolute",
            left: cx - headR,
            top: height * 0.01,
            width: headR * 2,
            height: headR * 2,
            borderRadius: headR,
            backgroundColor: bodyColor,
            borderWidth: 1.5,
            borderColor: outlineColor,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: cx - neckW,
            top: neckTop,
            width: neckW * 2,
            height: neckBot - neckTop,
            backgroundColor: bodyColor,
            borderWidth: 1.5,
            borderColor: outlineColor,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: cx - shoulderW,
            top: shoulderY,
            width: shoulderW * 2,
            height: height * 0.33,
            borderRadius: 20,
            backgroundColor: bodyColor,
            borderWidth: 1.5,
            borderColor: outlineColor,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: cx - shoulderW - width * 0.08,
            top: shoulderY,
            width: width * 0.08,
            height: height * 0.35,
            borderRadius: 8,
            backgroundColor: bodyColor,
            borderWidth: 1.5,
            borderColor: outlineColor,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: cx + shoulderW,
            top: shoulderY,
            width: width * 0.08,
            height: height * 0.35,
            borderRadius: 8,
            backgroundColor: bodyColor,
            borderWidth: 1.5,
            borderColor: outlineColor,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: cx - hipW,
            top: hipY,
            width: hipW * 2,
            height: height * 0.2,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            backgroundColor: bodyColor,
            borderWidth: 1.5,
            borderColor: outlineColor,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: cx - hipW,
            top: height * 0.67,
            width: hipW * 0.85,
            height: height * 0.22,
            borderRadius: 8,
            backgroundColor: bodyColor,
            borderWidth: 1.5,
            borderColor: outlineColor,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: cx + hipW * 0.15,
            top: height * 0.67,
            width: hipW * 0.85,
            height: height * 0.22,
            borderRadius: 8,
            backgroundColor: bodyColor,
            borderWidth: 1.5,
            borderColor: outlineColor,
          }}
        />
      </>
    );
  }

  return (
    <>
      <View
        style={{
          position: "absolute",
          left: cx - headR,
          top: height * 0.01,
          width: headR * 2,
          height: headR * 2,
          borderRadius: headR,
          backgroundColor: bodyColor,
          borderWidth: 1.5,
          borderColor: outlineColor,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: cx - neckW,
          top: neckTop,
          width: neckW * 2,
          height: neckBot - neckTop,
          backgroundColor: bodyColor,
          borderWidth: 1.5,
          borderColor: outlineColor,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: cx - width * 0.15,
          top: shoulderY,
          width: width * 0.3,
          height: height * 0.33,
          borderRadius: 16,
          backgroundColor: bodyColor,
          borderWidth: 1.5,
          borderColor: outlineColor,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: cx - width * 0.15,
          top: hipY,
          width: width * 0.3,
          height: height * 0.38,
          borderRadius: 8,
          backgroundColor: bodyColor,
          borderWidth: 1.5,
          borderColor: outlineColor,
        }}
      />
    </>
  );
}

export function BodyMap({
  bodyType,
  view,
  moles,
  onTapLocation,
  onTapMole,
  interactive = true,
  width: propWidth,
  height: propHeight,
}: BodyMapProps) {
  const colors = useColors();
  const mapWidth = propWidth || SCREEN_WIDTH - 48;
  const mapHeight = propHeight || mapWidth * 2.1;
  const containerRef = useRef<View>(null);
  const [layout, setLayout] = useState({ x: 0, y: 0 });

  const handlePress = (e: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (!interactive || !onTapLocation) return;
    const { locationX, locationY } = e.nativeEvent;
    const relX = locationX / mapWidth;
    const relY = locationY / mapHeight;
    const region = getRegionForCoords(view, relX, relY);
    onTapLocation(relX, relY, region);
  };

  return (
    <Pressable onPress={handlePress} style={{ width: mapWidth, height: mapHeight }}>
      <View
        ref={containerRef}
        style={[
          styles.mapContainer,
          {
            width: mapWidth,
            height: mapHeight,
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
          },
        ]}
        onLayout={(e) => {
          const { x, y } = e.nativeEvent.layout;
          setLayout({ x, y });
        }}
      >
        <BodySilhouette
          bodyType={bodyType}
          view={view}
          width={mapWidth}
          height={mapHeight}
          colors={colors}
        />

        {moles.map((mole) => (
          <Pressable
            key={mole.id}
            onPress={(e) => {
              e.stopPropagation?.();
              onTapMole?.(mole);
            }}
            style={[
              styles.molePin,
              {
                left: mole.bodyX * mapWidth - 8,
                top: mole.bodyY * mapHeight - 8,
                backgroundColor:
                  CONCERN_SCORE_COLORS[mole.aiConcernScore || 1] || colors.primary,
                borderColor: "#fff",
              },
            ]}
          >
            <Text style={styles.molePinText}>{mole.aiConcernScore || 1}</Text>
          </Pressable>
        ))}

        {interactive && (
          <Text
            style={[
              styles.tapHint,
              {
                color: colors.mutedForeground,
                backgroundColor: colors.card + "dd",
              },
            ]}
          >
            Tap to add a mole
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export { getRegionLabel, BODY_REGIONS };

const styles = StyleSheet.create({
  mapContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
  },
  molePin: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  molePinText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
  tapHint: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
});
