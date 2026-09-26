import React from "react";
import { Screen, Panel, Copy } from "@/components/ui/Screen";
import { BackupControls } from "@/components/BackupControls";
export default function Backups() {
  return (
    <Screen
      title="Your history, beyond this browser"
      subtitle="Download a portable backup, move to another device, or inspect an older copy before restoring."
    >
      <Panel>
        <BackupControls />
      </Panel>
      <Panel title="A simple backup habit">
        <Copy>
          Make a backup after adding important photos or observations. Keep a
          dated copy in private storage you control. Before changing devices,
          test restoring a copy in another browser.
        </Copy>
        <Copy>
          A backup is the complete archive. For a medical visit, use Visit
          report to select only the records you want to share.
        </Copy>
      </Panel>
    </Screen>
  );
}
