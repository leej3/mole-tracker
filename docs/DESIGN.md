# Mole Tracker: project design

Status: working design, 26 September 2026.
This is the development baseline, not a claim that every requirement already
works.
See [the review](REVIEW.md) for implementation gaps and priorities.

## Purpose

Give an individual a private, understandable skin history that remains useful
for decades, independent of a vendor, subscription, hosting provider, or model.
Make it easy to photograph the same spot again, record observations, compare
visits, and bring selected information to a clinician.

The primary outcome is a reliable longitudinal record, not a diagnosis or a
score.
A person should be able to recover and interpret their history even if this
application is no longer maintained.

Personal use is the primary scope.
There are no plans for monetization, advertising, analytics, engagement targets,
or a marketplace.
Multiple profiles are separate collections on one device, not separate
authenticated accounts.

## Product principles

1. Preserve observations before adding interpretations.
   Never infer a normal finding from an empty field.
   Keep user estimates distinct from measurements.
2. Local operation and export are core functionality.
   A future server must be optional; recording, viewing, and recovering data
   must not depend on it.
3. Prefer a short, obvious workflow to a feature-rich dashboard.
   Show the next action, where the user is, and what will happen when they press
   a control.
4. Use optional computation only when its benefit exceeds its setup, waiting,
   download, correction, and maintenance cost.
5. Keep originals and derived results distinguishable.
   Never overwrite an observation with a model output or an aligned image.
6. Describe privacy accurately.
   Local storage reduces centralized exposure but is neither encryption nor
   protection from malicious application updates.
7. Guidance should be useful and sparse.
   No repeated consent rituals or disclaimers attached to routine recording
   actions.

## Core journeys and acceptance criteria

| Journey | Intended behavior | Acceptance criterion |
| --- | --- | --- |
| Start | Name a local profile; choose a map outline; show the first action | No seeded medical examples appear as personal data; nickname allowed |
| Record a new spot | Choose region and position, name it, add a dated photo | Location has a text alternative; optional details do not block saving |
| Follow up | Open an existing record, add a photo, size estimate, symptoms or note | A dated observation is saved once and survives a reload |
| Compare | Select two dates, inspect originals, optionally align | Each image date, transform, and any unavailable scale are visible |
| Prepare a visit | Select records, date range, notes and photos; preview report | Export contains only selected profiles/records and no invented findings |
| Preserve history | Download backup, verify and restore locally | A fresh browser restores all photos and observations without the old host |
| Recover from trouble | Explain a failed write or unreadable database | Existing data is never silently replaced with an empty account |

## Information architecture

Home is **All records** for the active profile, sorted by most recent update.
Changing the map view must never silently filter this list.
Later search and region filters must be visible, removable, and show their
result count.

Primary destinations:

- **All records**: find a spot and continue its history.
- **Body map / add spot**: choose front/back, then region, then position.
- **Backups**: download, inspect, and restore a portable history.
- **Profiles**: select and manage the local collection being viewed.
- **Settings & help**: storage explanation, guidance, project/license
  information.

Within a spot, use **Overview**, **Photos**, **History**, and **Observations**.
Keep “Add photo” and “Add observation” prominent.
ABCDE terminology belongs in optional explanatory help, not an unexplained
destination.
A report action should appear only when it actually exports a report.

Every important action needs visible text, an accessible name, keyboard access,
a focus indicator, and a target at least 44 CSS pixels high.
Icons supplement text; they do not carry the only explanation.
Bundle assets locally.
A font failure must not make navigation unusable.
Support narrow screens, zoom, dark mode, and direct links with a reliable route
back to records.

The map is a location aid, not a medical visualization.
Use neutral pins and counts.
A later accessible text region selector should complement the diagram.
Outline choice is visual preference, not required demographic information.

## Current architecture and intended boundaries

Current web stack: Expo Router, React Native Web, TypeScript, sql.js.
SQLite is an in-memory database persisted as a complete byte array in IndexedDB.
The `app_storage` table contains JSON values for account, profiles, and moles;
photos are embedded data URLs.
This is not a normalized relational schema.
Native storage currently uses AsyncStorage and photo URIs, so web backup claims
must not be extended to native builds.

Keep these boundaries explicit as the code evolves:

- UI: routes, forms, accessible controls and task feedback.
- Domain: profiles, spots, observations, images, comparisons and reports.
- Repository: validated, versioned reads and transactional writes.
- Image processing: decode, metadata removal, derivatives, registration.
- Optional inference: a cancellable local worker with a versioned contract.
- Optional synchronization: a separate adapter; never the source of truth for
  whether the user can read or export local records.

Avoid a framework rewrite until these responsibilities and recovery semantics
are tested.
First replace fire-and-forget persistence with awaited repository operations.
Commit all parts of one user action atomically, update visible state only after
persistence, and show actionable failures.
Serialize across browser tabs or reject stale writers with revision checks; the
existing Promise queue only coordinates one JavaScript context.

## Data ownership and durable format

SQLite remains the primary backup format for the foreseeable future.
Add a schema version, application identifier, migration history and export
metadata.
Migrations must be forward-tested against committed synthetic fixtures and must
never discard an unknown field silently.
Reject newer unsupported schemas.

Target entities: profile, spot, observation, photo, comparison and optional
model result.
Each has a stable identifier.
Observations carry capture date, recorded date, provenance and optional
measurement uncertainty.
Photos reference observations and include pixel dimensions, encoding and content
hash.
Preserve capture time separately from file modification time and document
timezone use.

Keep media bytes in the backup, not paths into a vanished browser or server.
Offer a secondary documented archive containing JSON and ordinary image files
for recovery without sql.js.
Include a small standalone recovery guide and sample SQL/JSON schema, using
synthetic data only.

Restore must be an explicit replace operation with a preview: export version,
profile/record/photo counts, date range, unsupported features and validation
results.
Let the user save the current history first.
Validate file size, SQLite integrity, schema, JSON types, IDs, relationships,
dates, finite numeric ranges and image encodings before replacing anything.
Copy validated records into a fresh database rather than trusting imported
triggers, views or tables.
Reject remote photo URLs; opening a backup must not make network requests.

Write and verify the replacement before swapping the active handle.
A failed restore leaves the current database intact.
Test quota failure, interruption, malformed files, orphan records and multi-tab
conflicts.
Large image work and imports belong in a worker with size limits and
progress/cancel feedback.

Backup files currently have no encryption.
State this once beside download and restore.
User-controlled encrypted storage is useful now.
An optional encrypted archive later needs a versioned authenticated-encryption
format, established key derivation, recovery instructions, and tests; a UI
passcode alone is not protection.
Forgetting an archive password must not be presented as recoverable without an
actual key recovery design.

Deleting active records does not erase downloaded backups, OS copies or browser
snapshots.
Do not promise forensic erasure.
Provide an intentional “erase this browser's data” flow after backups and
deletion behavior are verified.

## Privacy and security baseline

Protect photographs, body locations, profile details, dates and notes.
Minimize collection: names can be pseudonyms; birth year and relationship are
optional.
No location permissions or geotags are needed for this product.

The primary boundaries are imported files, image decoders, HTML rendering,
iframe messaging, browser storage, deployment artifacts, and any future server.
Render user strings as text, validate messages, sandbox embedded map code, and
never accept image URLs that can contact another host.
Re-encode imported photos to strip metadata; do not silently retain the original
file on decode failure.
Document that the current resized JPEG is lossy and is not an original archive.

Same-origin code can read the database.
A compromised dependency, injected script, browser extension, unlocked device,
or compromised deployment can expose it.
Keep the app on a dedicated origin, self-host its assets, minimize packages,
review dependency advisories, and introduce a tested restrictive content
security policy.
Hosting still receives ordinary asset-request metadata; do not claim “no server
exists.”
No health content in URLs, telemetry, error logs, issue reports, CI artifacts,
fixtures or analytics.

A static deployment has no health-record API today.
Reproducible self-hosting, a versioned downloadable release and offline startup
are still required for independence from the hosted service.
“Local data” does not yet mean a verified offline app: there is currently no
service worker/offline distribution test.

## Sequential image registration

Start with manual side-by-side comparison, linked zoom and an opacity overlay.
Then add manual landmarks and a **similarity transform** (translation, rotation,
uniform scale).
Add a full affine transform as an advanced option: two linear coordinates plus
translation, represented by a 2×3 matrix.
Three non-collinear landmark pairs can determine its six parameters; extra pairs
allow fitting and residual checks.

Default to similarity because shear and non-uniform scale can obscure changes in
shape.
Do not fit the changing lesion boundary to itself: use surrounding stable
landmarks, keep originals visible, and make alignment reversible.
Changing skin pose, camera perspective, lighting and focus may defeat a global
transform.
Failed alignment must result in an ordinary comparison, not a plausible-looking
but misleading image.

Store source image hashes, crop coordinates, landmarks, transform direction,
matrix, method/version and residuals.
Derive previews without replacing source images.
Pixel-area differences are not physical growth unless capture scale is
calibrated; lighting differences are not evidence of biological change.

An optional automated proposal could use feature matching with robust outlier
rejection, followed by intensity-based refinement.
OpenCV documents
[affine ECC alignment](https://docs.opencv.org/4.x/dc/d6b/group__video__track.html).
That is an implementation candidate, not proof it works for these photographs.
Benchmark on synthetic known transforms and varied
consenting/test images; reject low overlap, degenerate fits and implausible scale/shear.
Require explicit user acceptance and retain the original comparison.

## Optional browser AI

Do not relabel the existing symptom/keyword heuristic as AI.
Retire its display and stop generating new risk scores; preserve legacy values
only for round-trip compatibility.
Missing notes must never become “regular border” or “uniform color.”
A disclaimer does not fix unsupported outputs.

The first useful computational assistance should be focus/exposure checks,
framing consistency or segmentation for comparison.
Some of these may need no model.
Measure whether they save effort before adding downloads and new UI.

For optional classification, evaluate a small quantized model through
[ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/), with a WASM
fallback and optional WebGPU acceleration.
Package runtime and weights locally; no remote image API.
Proposed starting budgets: at most 15 MB additional model download, at most 3
seconds warm inference on a named mid-range phone, and no blocking of recording.
These are acceptance targets, not measured performance.

Select weights only after checking their redistribution license, training-data
license/provenance, preprocessing, intended imaging modality, skin-tone coverage, calibration and out-of-distribution behavior. Dermoscopy accuracy does not establish performance on ordinary phone photos. No model is selected or shipped by this design. Record model/version,
image hash, input preprocessing and uncertainty with each optional result,
separate from the user's observations.

Run in a cancellable worker on explicit request.
Make skipping it effortless.
Prefer descriptive outputs over cancer probabilities or triage categories.
Classification must not suppress user concerns or control access to reporting.

## Future server

Add a server only when a concrete need, such as cross-device synchronization,
justifies its ongoing security and recovery burden.
Retain the same local repository/export contract.
Design conflict resolution, deletions and restore semantics before adding an
“upload database” endpoint.

Prefer an optional encrypted backup/sync service with client-held keys if it
meets the desired recovery experience.
Explicitly document leaked metadata, key loss and malicious-client-update
limits.
Otherwise document which operators can decrypt records.
Require authentication, per-record authorization, revocable device sessions,
bounded uploads, rate limits, encrypted backups, restore drills, retention
controls and a server-specific threat review.
A generic storage bucket or login screen is not an adequate security design.

## License, guidance and project maintenance

Recommended license: **MPL-2.0**, for source continuity through distributed
modifications while allowing reuse alongside other software.
This fits the longevity goal better than a personal-use-only restriction.
Mozilla explains its
[file-level obligations](https://www.mozilla.org/en-US/MPL/2.0/FAQ/).
Do not add a noncommercial clause.
This is a proposed choice, not an applied license: verify ownership of the
imported source and body illustrations before adding the exact license text and
appropriate notices.
Dependencies and future weights retain their own licenses; user photos and
records are not licensed by the source-code license.

Use one concise product statement in onboarding and Help:

> Mole Tracker keeps a personal skin history; it does not diagnose skin
> conditions.
> If a spot is new, changing, itching, or bleeding, seek advice
> from a qualified clinician.

Place optional practical guidance next to capture and observation tools:
consistent lighting, distance, angle, a size reference, and a clear date.
Link to the
[AAD self-exam guide](https://www.aad.org/public/diseases/skin-cancer/check-skin)
in Help.
Avoid repeated warnings on record cards, comparisons or every save.

Use small changes with explicit acceptance criteria.
Keep decisions here or in short dated decision records.
Add tests for irreversible boundaries: persistence, restore, migrations,
HTML/message handling, export selection, and image transform math.
Test important journeys in the actual web build, on narrow and wide screens.
Use synthetic fixtures and never commit personal databases or photos.

## Delivery order

1. **Foundation**: complete the security and durability fixes in REVIEW;
   truthful UI, visible actions, icons, no fake data, no risk-score display.
   Exit when save failures are recoverable and reload/backup/restore tests pass.
2. **Useful personal archive**:
   validated/versioned restore, independent JSON/media export, selected-record
   printable report, accessible text location input, offline/self-hosted
   recovery drill.
   Exit when a fresh device can recover the full history and a clinician can
   understand the selected report.
3. **Comparison**: user-selected dates, linked viewing, manual similarity/affine
   registration, provenance and residuals.
   Exit when synthetic transform tests and usability checks pass without
   modifying source images.
4. **Optional assistance**: compare a no-model baseline with a small local
   model; ship only if measured benefit and provenance justify it.
5. **Optional server**: a separate design review driven by an actual sync need.

Immediate open decisions:
source/illustration ownership and final license; whether to retain full-resolution re-encoded photos as well as thumbnails; supported browser/device
matrix; and the first report layout.
None requires building a server now.
