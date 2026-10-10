# Mole Tracker contributor guidance

For changes to navigation, recording, comparison, reports, backups, or other
user-facing workflows, use the project-owned
[mole-tracker-ux skill](.agents/skills/mole-tracker-ux/SKILL.md).
It composes the external `design-ux` and `web-design-guidelines` skills and
defines this project's privacy, durability, and interaction requirements.
Routine non-UI maintenance does not require a UX audit.

## Restore and audit external skills

From the repository root, with Pixi installed:

```sh
pixi run --locked setup-skills
pixi run --locked audit-skills
```

Run setup before starting a new agent session so skill discovery sees both
dependencies.
APM 0.31.0 is pinned in the tooling environment; npm remains the application's
dependency manager.
Both tasks use `--no-policy` to avoid organization-policy discovery for this
personal project.
Audit still checks lock consistency, content integrity, and deployment drift.

Track `apm.yml`, `apm.lock.yaml`, `pixi.toml`, and `pixi.lock`.
The two external `.agents/skills/` directories and `apm_modules/` are generated
and ignored; do not edit or commit their deployed copies.
The `mole-tracker-ux` directory is project-owned and tracked directly.

The locked sources are packaging forks of
[Conner K Ward's design-ux](https://github.com/connerkward/ckw-design-skill/tree/main/deterministic-design/design-ux)
and
[Vercel's web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines).
The forks add source-owned APM manifests; the design-ux fork also makes its
companion-skill references optional so it works independently.
Review upstream changes before changing pins, regenerate the APM lock, and
verify a fresh frozen restore plus audit.
Do not replace pins with moving refs.

## Project verification

Use `npm run typecheck`, `npm test`, and `npm run build` for application changes
as appropriate.
Exercise changed user journeys in the browser with synthetic data; check narrow
layouts and keyboard operation.
Use the Snapper pre-commit hook for documentation.
`docs/DESIGN.md` is the working product baseline; distinguish implemented behavior from planned behavior and historical findings in `docs/REVIEW.md`.
