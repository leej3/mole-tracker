import React from "react";
import { MolePhoto } from "@/lib/model";
import { Copy } from "./ui/Screen";
export function PhotoComparison({ photos }: { photos: MolePhoto[] }) {
  return (
    <Copy>
      Image alignment is available in the browser version. Your original photos
      remain available below.
    </Copy>
  );
}
