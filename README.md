# Mole Tracker

A personal skin history intended to remain useful across years and independent
of a vendor.
Record locations, photographs and dated observations, then keep a portable copy
under your control.

Start with the [project design](docs/DESIGN.md) and the
[security, privacy and UX review](docs/REVIEW.md).
The design distinguishes current functionality from the roadmap, including
registration, reports, optional browser AI and optional future synchronization.

## Current scope

The web app uses SQLite in browser storage.
**All records** shows every spot in the active profile.
**Body map / add spot** guides location selection; open a record to add photos
or observations.
**Backups** downloads or restores SQLite.
Affine registration, AI classification and printable clinician reports are not
yet implemented.
Native storage does not have the web backup guarantees.

Mole Tracker keeps a personal skin history; it does not diagnose skin
conditions.
If a spot is new, changing, itching, or bleeding, seek advice from a qualified
clinician.
The
[AAD self-exam guide](https://www.aad.org/public/diseases/skin-cancer/check-skin)
provides practical guidance.

## Privacy and durability

Normal recording does not upload your records or photos.
Browser storage and SQLite backups are **not encrypted**.
Keep backups in a private location outside this browser.
Clearing site data can erase the local history; restoring a file replaces it.
The current restore validator and save/error handling need the improvements
listed in the review before this should be your only copy.

Photos are normally resized and re-encoded as JPEG.
They are not archival originals, and a decode fallback can retain original
metadata.
Local data alone does not guarantee offline startup or protect against
compromised app code.

## Development

```sh
npm ci
npm start
npm run typecheck
node --test tests/security.test.cjs
npm run build
```

Use synthetic fixtures only.
Never commit personal photos, reports or databases.
Install the configured Snapper documentation hook with `pre-commit install`.

The main branch builds `dist/` and deploys to Cloudflare Pages.
The workflow uses `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository
secrets.
The legacy `server/` and `scripts/build.js` are not this deployment path.

## Licensing

MPL-2.0 is the proposed source license; see the design rationale.
It has not been applied pending confirmation of the imported source and
illustration rights.
Dependency licenses remain separate.
No software license grants rights to users' personal records or photographs.
