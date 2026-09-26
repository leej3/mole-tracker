import React, { useRef, useState, useEffect } from "react";
import { View } from "react-native";
import { Button } from "./ui/Button";
import { Copy } from "./ui/Screen";
export function ReportExport({ html }: { html: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(false), [html]);
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([html], { type: "text/html;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "skin-history-report.html";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Button
          title="Print / save as PDF"
          disabled={!ready}
          onPress={() => frame.current?.contentWindow?.print()}
        />
        <Button
          title="Download portable report"
          variant="secondary"
          onPress={download}
        />
      </View>
      <Copy>
        The portable HTML file includes its photos and opens without this app.
        Review the preview before sharing.
      </Copy>
      <iframe
        ref={frame}
        onLoad={() => setReady(true)}
        title="Selected visit report preview"
        srcDoc={html}
        sandbox="allow-same-origin allow-modals"
        style={{
          width: "100%",
          height: 640,
          border: "1px solid #dbe3dc",
          borderRadius: 16,
          background: "#fff",
        }}
      />
    </View>
  );
}
