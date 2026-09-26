# Project review: privacy, durability and usability

Reviewed 26 September 2026 against the three-commit initial implementation
(rewritten baseline `c862b1c`) and the changes accompanying this report.
Scope: web application source,
storage/restore, image handling, navigation, embedded body map, build/deployment
configuration and dependency audit.
This is a focused review, not a penetration test or native-device certification.

The project has a useful local-storage foundation, but reliable persistence and
validated recovery need priority over additional AI or a server.
SQLite itself is not a security boundary: application code can read the entire
history.
The [design document](DESIGN.md) defines the intended product and release gates.

## High priority findings

### R1 — Stored script/markup injection through the body map — fixed paths

Evidence:
`utils/bodyMapHtml.ts:181` embeds record data into an HTML script; `utils/bodyMapHtml.ts:336`
and `:340` construct SVG with record IDs and names.
The original code used raw JSON.stringify and raw string concatenation, while
`components/BodyMap3D.web.tsx` created an unsandboxed same-origin srcdoc iframe.

A crafted name or imported backup could execute script with access to the parent
origin and its health-record database.
JSON string quoting alone does not prevent an HTML `</script>` terminator.

Changes: escape less-than characters before embedding JSON, escape SVG text and
attribute values, reject messages from unrelated windows inside the map, and
sandbox the web iframe with scripts allowed but without same-origin access.
Regression tests cover script termination, SVG
text/attribute payloads and message sender checks. Existing parent-side source checks remain in place. Still needed: complete message schemas and runtime backup validation; replace string-generated SVG with component/DOM
construction when redesigning the map.

### R2 — Save success does not mean durable success — open, release blocker

Evidence: `context/AppContext.tsx:220`, `:286` and `:321` invoke asynchronous
save functions inside React state-updater callbacks without awaiting them.
`lib/storage.web.ts:109` changes the in-memory database before IndexedDB commit.
Profile deletion writes three independent keys.
`context/AppContext.tsx:185` swallows load errors and continues with empty
initial state.

Storage quota failures or interruption can lose records after an apparently
successful save.
A load failure can lead users into creating a replacement account.
React updater replay may repeat side effects.
Separate tabs load independent copies and can overwrite one another's subsequent
changes.

Required fix: an awaited repository transaction per user operation, rollback on
failed persistence, visible failed-save state, explicit recovery on load
failure, and cross-tab revision/locking behavior.
Test quota rejection, reload, interruption and two-tab writes.
Do not promise dependable long-term storage until these pass.
The current pass does not replace the persistence layer.

### R3 — Restore accepts invalid application content — open, release blocker

Evidence: `lib/storage.web.ts:130` checks SQLite integrity and two column names,
then installs the entire candidate at `:144`.
It does not validate JSON data, record references, embedded media, version or
file size.
`app/mole/[id].tsx:360` passes restored photo URIs to the image renderer.

A structurally valid SQLite file can replace usable history with invalid data,
carry unwanted schema objects, or introduce remote images that disclose network
metadata when viewed.
This does not require breaking SQLite integrity checks.

Required fix: bounded import, strict versioned domain validation and preview,
copy only permitted records into a new canonical database, require embedded
raster image bytes on web, and preserve the old history on every failure.
Add fixtures for malformed JSON, duplicate/orphan IDs, invalid dates/numbers,
remote URIs, oversized media, unexpected schemas and interrupted replacement.
Until then, restore only backups whose origin and contents you trust, after
saving the current history.
That is a temporary operating constraint, not a substitute for validation.

## Medium priority findings

### R4 — Local storage and backups are unencrypted — documented limitation

Evidence:
`lib/storage.web.ts:41` exports raw SQLite bytes; `components/BackupControls.web.tsx`
downloads those bytes directly.
A person with device/browser-profile access or a copied backup can read records.
No application passcode or encrypted archive is implemented.

The updated backup screen explains this directly.
Use private device storage and user-controlled encrypted backup storage.
Optional archive encryption needs a separate tested format/key-recovery design;
do not add a cosmetic lock toggle.
Local-only operation does not protect against malicious updates or extensions.

### R5 — Photo fallback preserves source metadata and unbounded files — open

Evidence:
`lib/photo-picker.web.ts:24` falls back to reading the original file when decoding/resizing
fails.
This can preserve EXIF location metadata, large files and encodings that do not
work in another browser.
Normal processing stores a lossy JPEG up to 1600 pixels, with no preserved
archival original.

Required fix: bounded file/pixel decoding, explicit metadata-stripped encoding,
a useful decode error instead of silent raw-file fallback, and a documented
archival-quality policy.
Test camera orientation, metadata removal and browser compatibility.
Canceling the picker also needs a resolved cancellation path.

### R6 — Unsupported concern scores and inferred normal findings — display fixed

Evidence: `utils/scoring.ts` uses symptom thresholds and keyword matching, not
image inference.
The original substring test counted “No change observed” as a change, and absent
border/color notes became normal-looking conclusions.
Home, cards, map colors and detail screens amplified these values.

Changes: remove risk-score display from the active web journey, use neutral map
pins, stop creating new score snapshots, and show missing observations as “Not
recorded.”
Preserve historical fields for compatibility.
Legacy scoring helpers and an unused alternate map component remain; do not
reconnect them to the product.
Also fix in-place history sorting in the legacy helper.
This is a product integrity issue rather than a remotely exploitable flaw.

### R7 — Dependency advisories require a focused upgrade — open

`npm audit --omit=dev --json` reports 17 affected packages: 15 moderate and 2
high, no critical.
These counts include dependency chains, not 17 independently reachable attacks.
The audit exits 1.
Review the local duct audit log for complete advisory URLs and dependency paths.

PostCSS and other Expo tooling are included under production dependencies but
are generally build-time exposure for the static site.
Router parsing packages can be part of the browser bundle.
Confirm each affected call path and perform a compatible Expo/dependency upgrade
with web regression tests.
Do not run a blind forced audit fix: suggested changes include major-version
changes.

### R8 — Hosted code remains a sensitive trust boundary — open hardening

The deployment workflow serves a static Expo build; no health-record API was
found in the active web path.
Assets and application updates still arrive from a host.
No CSP or related response-header configuration is visible in the repo; edge
headers were not verified.
The add-record route currently places profile ID and body coordinates in query
parameters, which can enter browser history and request logs on reload.
Move draft state out of the URL.
The old `server/` landing-page template includes an external script but is not
used by the current `npm run build` deployment.

Required follow-up: dedicated origin, tested CSP and response headers, pinned CI
actions, dependency review and a
self-hosted/offline recovery exercise. Remove obsolete server/build scaffolding
in a separate cleanup after confirming it is unused.
Do not equate “no backend database” with “nothing can be hacked.”

## UX findings and first changes

- **Hidden records**: the original list followed the map's front/back state.
  Home now shows every record in the active profile, with recent updates first.
- **Ambiguous Add**: previously revealed the map without starting an entry.
  The labeled map destination now explains region selection and placement.
- **Icons shown as squares**: the root loaded Inter but did not explicitly await
  Feather.
  Feather is now loaded at startup; main navigation also has text.
  This addresses the missing-font hypothesis; visual validation is required.
- **Buried backups/profiles**: both now have visible home actions, including
  Profiles when only one exists.
  Backups has its own explanatory screen.
- **Sample records mistaken for personal history**: first-run demo seeding is
  removed.
  Previously persisted examples are not deleted automatically.
- **Repeated disclaimers and promised features**: remove mandatory disclaimer
  checkbox and repeated detail warnings.
  Keep concise onboarding/Help guidance and an official AAD link.
  Onboarding no longer claims PDF export exists.
- **Browser-native behavior still incomplete**: destructive actions use React
  Native Alert, and date selection uses a native date picker.
  Verify/replace these web paths, and provide accessible text location input.
- **Calendar dates**: browser testing exposed a UTC/local-date shift; creation
  now stores the local calendar date and date-only display uses local noon.
- **Direct detail links**: headers relying only on router.back need a records
  fallback when opened without history.
  The new backup screen has one.
- **Comparison/reporting**: current photo comparison is basic side-by-side;
  registration and a clinician report are design work, not implemented features.

## Verification and remaining gates

Automated checks for this pass: TypeScript, production web export, and three
regressions for map injection/message handling and observation integrity.
The regression harness executes generated map JavaScript with a minimal DOM; it
is not a substitute for browser security testing.
Dependency audit findings remain open.
Manual production-build checks confirmed profile onboarding, empty-state
navigation, visible Feather icons, map region selection and pin placement,
record creation, reload persistence for the synthetic record, corrected
calendar-date display, and the backup screen.
The home layout was inspected at 1280×720 and 390×844.
The backup UI reported success, but the browser automation download event timed
out; the downloaded bytes and a full restore were not verified in this pass.
Only synthetic records were used.
Native builds were not exercised.

Before relying on this as the sole copy of a history, complete R2 and R3 and
perform a full photo-inclusive export/restore on a fresh browser.
Then build selected-record reports and reproducible comparisons.
Avoid expanding the application into a server or classifier while these core
boundaries are open.

## PDF history cleanup

`Mole-Tracker-source-code.pdf` was removed from all three historical commits
with git-filter-repo, and the rewritten main branch was pushed over SSH using an
explicit old-head force-with-lease.
No tags or other remote branches were advertised.
The rewrite preserves original author/message metadata.
The old main was `5872e49`; the rewritten baseline is `c862b1c`.

Local Codex diff references retaining the old tree were also removed.
The PDF path and personal SQLite backups are now ignored.
Re-clone existing checkouts instead of merging old history back.
Rewriting refs cannot remove copies held in other
clones/forks or all GitHub cached objects. For sensitive content that requires cache removal, follow [GitHub's cleanup guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).
