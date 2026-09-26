import { Archive, emptyArchive } from "./model";

export const MAX_BACKUP_BYTES = 100 * 1024 * 1024;
const symptoms = new Set([
  "itching",
  "bleeding",
  "pain",
  "crusting",
  "rapid_growth",
  "color_darkening",
  "irregular_border",
  "raised",
  "none",
]);
function fail(message: string): never {
  throw new Error(`Cannot use this history: ${message}`);
}
function object(
  value: unknown,
  label: string,
): asserts value is Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(`${label} must be an object.`);
}
function text(
  value: unknown,
  label: string,
  max = 20000,
): asserts value is string {
  if (typeof value !== "string" || value.length > max)
    fail(`${label} must be text of at most ${max} characters.`);
}
function id(value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value))
    fail("a record identifier is invalid.");
}
function date(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    fail("a date is invalid.");
  const day = value.slice(0, 10);
  if (new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) !== day)
    fail("a calendar date is invalid.");
}
function number(value: unknown, label: string, min: number, max: number) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    fail(`${label} is outside its allowed range.`);
}
function array(
  value: unknown,
  label: string,
  max: number,
): asserts value is any[] {
  if (!Array.isArray(value) || value.length > max)
    fail(`${label} must be a list with at most ${max} entries.`);
}
function optionalText(row: Record<string, any>, keys: string[]) {
  for (const key of keys) if (row[key] !== undefined) text(row[key], key);
}
function flags(value: unknown) {
  array(value, "symptoms", 9);
  if (value.some((v) => !symptoms.has(v))) fail("a symptom is unrecognized.");
}
function abcde(value: unknown) {
  if (value === undefined) return;
  object(value, "observations");
  optionalText(value, [
    "asymmetry",
    "border",
    "color",
    "diameter",
    "evolution",
  ]);
}
export function isEmbeddedImage(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 16 * 1024 * 1024)
    return false;
  const match =
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4 !== 0) return false;
  // Check signatures as well as MIME labels; never allow URL fetches or SVG.
  const prefix = match[2];
  return match[1] === "jpeg"
    ? prefix.startsWith("/9j/")
    : match[1] === "png"
      ? prefix.startsWith("iVBORw0KGgo")
      : prefix.startsWith("UklGR");
}
export function validateArchive(value: unknown, native = false): Archive {
  object(value, "history");
  object(value.account, "account");
  const account = value.account;
  for (const key of [
    "onboardingComplete",
    "disclaimerAccepted",
    "reminderMonthlyEnabled",
    "passcodeEnabled",
  ]) {
    if (typeof account[key] !== "boolean")
      fail(`account ${key} must be true or false.`);
  }
  array(value.profiles, "profiles", 100);
  array(value.moles, "spots", 10000);
  const identifiers = new Set<string>();
  const unique = (value: unknown) => {
    id(value);
    if (identifiers.has(value)) fail("identifiers are duplicated.");
    identifiers.add(value);
  };
  const profiles = new Set<string>();
  for (const profile of value.profiles) {
    object(profile, "profile");
    unique(profile.id);
    profiles.add(profile.id);
    text(profile.name, "profile name", 200);
    if (!profile.name.trim()) fail("profile name is empty.");
    text(profile.avatar, "avatar", 200);
    optionalText(profile, ["relationship"]);
    if (profile.birthYear !== undefined)
      number(profile.birthYear, "birth year", 1850, new Date().getFullYear());
    if (!["male", "female"].includes(profile.bodyType))
      fail("body outline is unrecognized.");
    date(profile.createdAt);
  }
  if (
    account.activeProfileId !== undefined &&
    !profiles.has(account.activeProfileId)
  )
    fail("the active profile is missing.");
  if (account.onboardingComplete && !profiles.size)
    fail("a completed account has no profile.");
  for (const mole of value.moles) {
    object(mole, "spot");
    unique(mole.id);
    if (!profiles.has(mole.profileId)) fail("a spot has no matching profile.");
    text(mole.defaultName, "spot name", 200);
    text(mole.bodyRegion, "body region", 100);
    optionalText(mole, [
      "customName",
      "sizeEstimateNote",
      "colorNotes",
      "borderNotes",
      "shapeNotes",
    ]);
    if (!["front", "back", "left", "right"].includes(mole.bodyView))
      fail("body view is unrecognized.");
    number(mole.bodyX, "horizontal location", 0, 1);
    number(mole.bodyY, "vertical location", 0, 1);
    number(mole.bodyZ ?? 0, "depth", -1, 1);
    date(mole.firstNoticedDate);
    date(mole.createdAt);
    date(mole.updatedAt);
    flags(mole.symptomFlags);
    abcde(mole.abcdeSummary);
    if (mole.latestSizeMm !== undefined)
      number(mole.latestSizeMm, "size", 0.01, 1000);
    if (mole.reminderDays !== undefined)
      number(mole.reminderDays, "reminder interval", 1, 3650);
    if (mole.aiConcernScore !== undefined)
      number(mole.aiConcernScore, "legacy score", 1, 5);
    array(mole.photos, "photos", 2000);
    array(mole.updateLog, "observations", 10000);
    for (const photo of mole.photos) {
      object(photo, "photo");
      unique(photo.id);
      if (photo.moleId !== mole.id) fail("a photo refers to another spot.");
      date(photo.capturedAt);
      optionalText(photo, ["notes", "angleTag"]);
      if (
        !isEmbeddedImage(photo.localUri) &&
        !(
          native &&
          typeof photo.localUri === "string" &&
          /^(file|content):/.test(photo.localUri)
        )
      )
        fail(
          "photos must be embedded JPEG, PNG or WebP images (no remote URLs).",
        );
    }
    for (const log of mole.updateLog) {
      object(log, "observation");
      unique(log.id);
      if (log.moleId !== mole.id)
        fail("an observation refers to another spot.");
      date(log.timestamp);
      optionalText(log, ["note"]);
      abcde(log.abcdeSnapshot);
      if (log.sizeMm !== undefined) number(log.sizeMm, "size", 0.01, 1000);
      if (log.symptomChanges !== undefined) flags(log.symptomChanges);
      if (log.aiScoreSnapshot !== undefined)
        number(log.aiScoreSnapshot, "legacy score", 1, 5);
    }
  }
  // Preserve unknown JSON fields for forward-compatible round trips.
  return value as unknown as Archive;
}
export function archiveFromRows(
  rows: Map<string, string>,
  native = false,
): Archive {
  if (!rows.size) return emptyArchive();
  if (
    [...rows.keys()].some(
      (k) =>
        ![
          "@mole_tracker/account",
          "@mole_tracker/profiles",
          "@mole_tracker/moles",
        ].includes(k),
    )
  )
    fail("unknown storage keys are present.");
  const data = emptyArchive();
  for (const key of ["account", "profiles", "moles"] as const) {
    const raw = rows.get(`@mole_tracker/${key}`);
    if (raw !== undefined) (data as any)[key] = JSON.parse(raw);
  }
  return validateArchive(data, native);
}
