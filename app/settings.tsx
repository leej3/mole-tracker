import React from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Panel, Copy } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
export default function Help() {
  const router = useRouter();
  return (
    <Screen
      title="Help & your data"
      subtitle="A few practical things to keep your history useful."
    >
      <Panel title="Photographs worth returning to">
        <Copy>
          Use even lighting, a steady camera and a consistent angle and
          distance. Include a ruler if you want a size reference. Add the date
          the photograph was taken.
        </Copy>
        <Copy>
          The browser stores a re-encoded JPEG up to 2400 pixels, without the
          original metadata. Keep your original separately if you need full
          resolution.
        </Copy>
      </Panel>
      <Panel title="Local, and under your control">
        <Copy>
          Records live in this browser on this device. There is no automatic
          photo upload or analytics. Browser storage and downloaded SQLite
          backups are not encrypted; use private device storage and keep a
          backup elsewhere.
        </Copy>
        <Button
          title="Backups & restore"
          variant="secondary"
          onPress={() => router.push("/backup")}
        />
        <Copy>
          A changed or compromised app can access its local records. Local
          storage is not a substitute for keeping the device and application up
          to date.
        </Copy>
      </Panel>
      <Panel title="When to seek advice">
        <Copy>
          Mole Tracker keeps a personal skin history; it does not diagnose skin
          conditions. If a spot is new, changing, itching, or bleeding, seek
          advice from a qualified clinician.
        </Copy>
        <Button
          title="Skin self-exam guide · AAD ↗"
          variant="ghost"
          onPress={() =>
            void Linking.openURL(
              "https://www.aad.org/public/diseases/skin-cancer/check-skin",
            )
          }
        />
      </Panel>
      <Panel title="Built for the long view">
        <Copy>
          Your complete archive can move with you as a SQLite file. A visit
          report shares only the records you select. Browser comparison tools
          align a view without changing the original photographs.
        </Copy>
        <Copy>
          Source licensing is being finalized after the imported source and
          illustration rights are confirmed. Your records and photographs remain
          yours.
        </Copy>
      </Panel>
    </Screen>
  );
}
