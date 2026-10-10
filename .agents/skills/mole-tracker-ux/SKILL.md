---
name: mole-tracker-ux
description: Design and review Mole Tracker's recording, navigation, photo comparison, report, and backup workflows using the installed UX skills with project-specific privacy and durable-data constraints. Use for user-facing workflow changes, not unrelated maintenance.
---

# Mole Tracker UX

Help a person keep an understandable skin history over years, compare visits,
and prepare selected information for a doctor.
Personal use, user ownership, and recoverability guide decisions; engagement,
conversion, and diagnostic scoring do not.

## Compose the installed guidance

Required external skills are declared and locked by APM in this project:

- Read `design-ux` at `.agents/skills/design-ux/SKILL.md` from the project root
  for task traces, heuristic review, severity, and independent visual review.
- Read `web-design-guidelines` at
  `.agents/skills/web-design-guidelines/SKILL.md` for implementation review.
  Fetch its public guideline source as instructed, without transmitting project
  data; note the source revision or retrieval date in the review.

These are explicit skill dependencies, not copied guidance.
If absent, restore them with `pixi run --locked setup-skills` from the project
root, then run `pixi run --locked audit-skills`.
Do not silently substitute another skill or claim that an unavailable external
review was completed.
If the remote guideline source is unavailable, retain this skill's constraints
and report that the external checklist could not be refreshed.

Apply the project adaptations below when external advice conflicts.
Treat `docs/DESIGN.md` and the current implementation as project inputs; check
whether a review finding is historical before treating it as an open defect.

## Design around the person's task

Choose the affected journey: find a spot, record a dated update, compare two
dates, prepare a report, or preserve/restore history.
State its entry point, completion condition, and recovery path before changing
the interface.
Do not make every small UI edit a redesign of the whole application.

- Prefer one clear next action.
  A dated update can group a photo and optional observations; do not require the
  person to understand the storage schema.
- Keep record history and dates visible.
  Preserve list position and selections when returning from details.
  Provide a route back to records on direct entry.
- Use progressive disclosure for optional detail and manual affine controls.
  Keep primary actions discoverable.
  Visible text accompanies important icons; missing icon fonts must not make the
  app unusable.
- Keep guidance short, contextual, and actionable.
  Retain one carefully worded disclaimer and useful official-resource links
  where appropriate; avoid repeated consent checkboxes or warning banners for
  ordinary tracking.
- Use calm, neutral visual hierarchy.
  Do not add risk colors, urgency, streaks, marketing heroes, decorative
  animation, or unsupported clinical conclusions.

## Privacy and durability adaptations

- Override advice to encode all UI state in URLs: keep names, notes, body
  coordinates, health filters, and draft observations out of paths and queries.
  Existing opaque record routes are not permission to expose more health data.
- Self-host assets.
  Do not add remote fonts, analytics, image services, CDN preconnections, or
  model uploads as a styling or performance shortcut.
  Use synthetic records and photographs in screenshots, tests, and review
  artifacts; never seed those examples into a person's real history.
- A save indicator means persistence completed.
  Show useful failure and retry states, preserve drafts on failure, and prevent
  duplicate submissions through the local transaction/domain layer.
  Do not introduce a server solely to follow generic server-idempotency advice.
- Keep export and restore easy to find.
  Restore previews what will be replaced, offers a current backup, and leaves
  existing history intact on failure.
  Distinguish local browser storage, downloaded backups, and any future sync.
  Do not imply encryption, successful backup verification, or offline startup
  unless that behavior exists and has been checked.
- Keep dates, missing observations, estimates, and derived results truthful.
  Empty fields are unknown; exported reports contain only the selected data.

## Comparison and optional computation

Keep both photo dates and an easy original view.
Registration matches surrounding skin, excludes the mole in both images, and
uses its center only to initialize.
Alignment must be cancellable and reversible, with poor matches rejected and
manual comparison available.
Preserve source photographs; identify temporary previews.
An affine overlay is not a measurement of physical growth.

Add AI only when it reduces work enough to justify download, delay, explanation,
correction, and maintenance.
Keep inference optional and local by default.
Never present a heuristic or unvalidated classifier as a diagnosis.

## Accessibility and evidence

Honor reduced motion even for personal use.
Keep useful content available if fonts fail; do not hide the app indefinitely
waiting for a perfect first paint.
Use accessible names, visible keyboard focus, semantic controls, touch targets
of at least 44 CSS pixels, zoomable content, and non-gesture alternatives for
marking locations and exclusion regions.
Verify the DOM produced by React Native Web rather than assuming JSX props
guarantee accessible output.

For a substantial workflow change, capture its default state and an actual task
trace at wide and narrow widths.
Include empty, saving, failure, cancellation, and successful states where the
change affects them.
Give a separate reviewer the synthetic artifacts and task, without coaching it
toward the builder's conclusions, as required by `design-ux`.
If independent review is unavailable, label self-checks honestly and leave that
review unverified.

Report located findings by severity, their task impact, and concrete fixes.
Recheck changed journeys after fixes.
Separate observed behavior from proposals and untested platforms.
Do not claim user research, accessibility certification, or validated clinical
accuracy from an agent review.
