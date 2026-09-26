import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useColors } from "@/hooks/useColors";
import {
  BodyMap3DHandle,
  BodyMap3DProps,
  PinPlacedEvent,
  buildHtml,
} from "@/utils/bodyMapHtml";

export type { BodyMap3DHandle, BodyMap3DProps, PinPlacedEvent };

// The library's union native props collapse to `never` under the web TypeScript
// resolver, though Metro only uses this file for native platforms.
const NativeWebView = WebView as any;
type NativeWebViewRef = { injectJavaScript(script: string): void };

export const BodyMap3D = forwardRef<BodyMap3DHandle, BodyMap3DProps>(
  function BodyMap3D(
    { moles, onPinPlaced, onMoleTapped, onBodyPartSelected, onGoBack, onViewChanged, interactive = true, gender = "male", width, height },
    ref
  ) {
    const colors = useColors();
    const webViewRef = useRef<NativeWebViewRef | null>(null);

    const html = buildHtml(
      moles,
      interactive,
      colors.primary,
      colors.surfaceElevated,
      colors.border,
      gender
    );

    useImperativeHandle(ref, () => ({
      sendMessage(msg: object) {
        webViewRef.current?.injectJavaScript(
          `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(
            JSON.stringify(msg)
          )}}));true;`
        );
      },
    }));

    const handleMessage = useCallback(
      (event: { nativeEvent: { data: string } }) => {
        try {
          const msg = JSON.parse(event.nativeEvent.data);
          if (msg.type === "pinPlaced" && onPinPlaced)
            onPinPlaced(msg as PinPlacedEvent);
          else if (msg.type === "moleTapped" && onMoleTapped)
            onMoleTapped(msg.moleId);
          else if (msg.type === "bodyPartSelected" && onBodyPartSelected)
            onBodyPartSelected(msg.bodyPart, msg.label);
          else if (msg.type === "goBack" && onGoBack)
            onGoBack();
          else if (msg.type === "viewChanged" && onViewChanged)
            onViewChanged(msg.view as "front" | "back");
        } catch (_) {}
      },
      [onPinPlaced, onMoleTapped, onBodyPartSelected, onGoBack, onViewChanged]
    );

    return (
      <View
        style={[
          styles.container,
          {
            width,
            height,
            borderColor: colors.border,
            backgroundColor: colors.surfaceElevated,
          },
        ]}
      >
        <NativeWebView
          ref={webViewRef}
          source={{ html }}
          style={{ width, height, backgroundColor: "transparent" }}
          scrollEnabled={false}
          bounces={false}
          scalesPageToFit={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          originWhitelist={["*"]}
          renderLoading={() => (
            <View
              style={[
                styles.loading,
                { backgroundColor: colors.surfaceElevated },
              ]}
            >
              <ActivityIndicator color={colors.primary} size="large" />
              <Text
                style={[
                  styles.loadingText,
                  { color: colors.mutedForeground },
                ]}
              >
                Building 3D model…
              </Text>
            </View>
          )}
          startInLoadingState
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
