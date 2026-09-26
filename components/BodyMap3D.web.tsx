import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  BodyMap3DHandle,
  BodyMap3DProps,
  PinPlacedEvent,
  buildHtml,
} from "@/utils/bodyMapHtml";
import { CONCERN_SCORE_COLORS } from "@/utils/scoring";

export type { BodyMap3DHandle, BodyMap3DProps, PinPlacedEvent };

export const BodyMap3D = forwardRef<BodyMap3DHandle, BodyMap3DProps>(
  function BodyMap3D(
    {
      moles,
      onPinPlaced,
      onMoleTapped,
      onBodyPartSelected,
      onGoBack,
      onViewChanged,
      interactive = true,
      gender = "male",
      width,
      height,
    },
    ref
  ) {
    const colors = useColors();
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

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
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify(msg),
          "*"
        );
      },
    }));

    // Keep callbacks in refs so the message handler never goes stale
    const onPinPlacedRef = useRef(onPinPlaced);
    const onMoleTappedRef = useRef(onMoleTapped);
    const onBodyPartSelectedRef = useRef(onBodyPartSelected);
    const onGoBackRef = useRef(onGoBack);
    const onViewChangedRef = useRef(onViewChanged);
    onPinPlacedRef.current = onPinPlaced;
    onMoleTappedRef.current = onMoleTapped;
    onBodyPartSelectedRef.current = onBodyPartSelected;
    onGoBackRef.current = onGoBack;
    onViewChangedRef.current = onViewChanged;

    const handleWindowMessage = useCallback((event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      try {
        const msg =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (msg.type === "pinPlaced" && onPinPlacedRef.current)
          onPinPlacedRef.current(msg as PinPlacedEvent);
        else if (msg.type === "moleTapped" && onMoleTappedRef.current)
          onMoleTappedRef.current(msg.moleId);
        else if (msg.type === "bodyPartSelected" && onBodyPartSelectedRef.current)
          onBodyPartSelectedRef.current(msg.bodyPart, msg.label);
        else if (msg.type === "goBack" && onGoBackRef.current)
          onGoBackRef.current();
        else if (msg.type === "viewChanged" && onViewChangedRef.current)
          onViewChangedRef.current(msg.view as "front" | "back");
      } catch (_) {}
    }, []);

    // When moles change, update the iframe's pin list
    const molesRef = useRef(moles);
    useEffect(() => {
      molesRef.current = moles;
      // Push updated pins to the iframe
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      // Keep pin data consistent with the neutral markers in buildHtml.
      const pins = moles.map((m) => {
        const s = 1; // Pins identify records; they do not communicate medical risk.
        return {
          id: m.id,
          x: m.bodyX,
          y: m.bodyY,
          region: m.bodyRegion,
          view: m.bodyView ?? "front",
          color: CONCERN_SCORE_COLORS[s] ?? "#2d7a3a",
          name: m.customName ?? m.defaultName,
          score: s,
        };
      });
      iframe.contentWindow.postMessage(
        JSON.stringify({ type: "updatePins", pins }),
        "*"
      );
    }, [moles]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const iframe = document.createElement("iframe");
      iframe.style.cssText = `
        width:100%; height:100%; border:none; display:block;
        border-radius:20px; background:${colors.surfaceElevated};
      `;
      iframe.title = "Body map: select a region and spot";
      // The map can run scripts but cannot access the parent database or DOM.
      iframe.setAttribute("sandbox", "allow-scripts");
      iframe.srcdoc = html;

      container.appendChild(iframe);
      iframeRef.current = iframe;

      window.addEventListener("message", handleWindowMessage);

      return () => {
        window.removeEventListener("message", handleWindowMessage);
        if (container.contains(iframe)) container.removeChild(iframe);
        iframeRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <View
        style={[
          styles.wrapper,
          {
            width,
            height,
            borderColor: colors.border,
            backgroundColor: colors.surfaceElevated,
          },
        ]}
      >
        <div
          ref={containerRef}
          style={{
            width,
            height,
            borderRadius: 20,
            overflow: "hidden",
            position: "relative",
          }}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
});
