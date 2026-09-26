import { Mole, Profile } from "./model";
import { isEmbeddedImage } from "./validation";
import { displayDate, regionLabel } from "./locations";
const escape = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function buildReport(
  profile: Profile,
  records: Mole[],
  includePhotos: boolean,
): string {
  const selected = records.filter((m) => m.profileId === profile.id);
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Skin history</title><style>
 body{font:16px/1.55 system-ui,sans-serif;color:#203730;max-width:850px;margin:40px auto;padding:24px}h1{font-size:32px}h2{margin-bottom:4px}header{border-bottom:2px solid #246656;padding-bottom:20px}.muted{color:#58685e}section{margin:30px 0;padding-top:15px;border-top:1px solid #ccd8ce}li{margin:12px 0;white-space:pre-wrap}figure{display:inline-block;width:44%;vertical-align:top;margin:12px 2%}img{max-width:100%;max-height:300px;object-fit:contain}figcaption{font-size:13px}article{break-inside:avoid}@media print{body{margin:0;padding:0}figure{break-inside:avoid}h2{break-after:avoid}}
 </style><header><p class="muted">MOLE TRACKER · PERSONAL RECORD</p><h1>Skin history for ${escape(profile.name)}</h1><p>${selected.length} selected records · Prepared ${escape(displayDate(new Date().toISOString()))}</p><p class="muted">Dates, symptoms and size estimates were recorded by the user. Photographs are references, not calibrated measurements.</p></header>
 ${selected
   .map(
     (
       m,
     ) => `<section><h2>${escape(m.customName || m.defaultName)}</h2><p class="muted">${escape(regionLabel(m.bodyRegion))} · ${escape(m.bodyView)} · First noticed ${escape(displayDate(m.firstNoticedDate))}</p>${m.latestSizeMm !== undefined ? `<p>Latest size estimate: ${escape(m.latestSizeMm)} mm</p>` : ""}
 ${m.symptomFlags.length ? `<p>Recorded symptoms: ${escape(m.symptomFlags.map(regionLabel).join(", "))}</p>` : ""}
 ${[m.colorNotes, m.borderNotes, m.shapeNotes]
   .filter(Boolean)
   .map((note) => `<p>${escape(note)}</p>`)
   .join("")}
 <h3>Observations</h3><ul>${[...m.updateLog]
   .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
   .map(
     (log) =>
       `<li><b>${escape(displayDate(log.timestamp))}</b>${log.sizeMm !== undefined ? ` · estimated ${escape(log.sizeMm)} mm` : ""}${log.symptomChanges?.length ? ` · ${escape(log.symptomChanges.map(regionLabel).join(", "))}` : ""}<br>${escape(log.note || "No note recorded")}</li>`,
   )
   .join("")}</ul>
 ${
   includePhotos
     ? [...m.photos]
         .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
         .filter((p) => isEmbeddedImage(p.localUri))
         .map(
           (p) =>
             `<figure><img alt="Recorded photograph" src="${escape(p.localUri)}"><figcaption>${escape(displayDate(p.capturedAt))}${p.notes ? ` · ${escape(p.notes)}` : ""}</figcaption></figure>`,
         )
         .join("")
     : ""
 }</section>`,
   )
   .join("")}
 <footer class="muted">End of selected history. This file contains private information; share only with your intended recipient.</footer></html>`;
}
