import type { SqlJsStatic } from "sql.js";
import { Archive, STORAGE_KEYS } from "./model";
import {
  archiveFromRows,
  MAX_BACKUP_BYTES,
  validateArchive,
} from "./validation";
export const SCHEMA_VERSION = 1;
const APPLICATION_ID = 0x4d4f4c45;
export function decodeDatabase(SQL: SqlJsStatic, bytes: Uint8Array): Archive {
  if (bytes.byteLength > MAX_BACKUP_BYTES || bytes.byteLength < 100)
    throw new Error("Choose a SQLite backup smaller than 100 MB.");
  const db = new SQL.Database(bytes);
  try {
    if (db.exec("PRAGMA integrity_check")[0]?.values[0]?.[0] !== "ok")
      throw new Error(
        "The backup is damaged. Your current history is unchanged.",
      );
    const version = Number(db.exec("PRAGMA user_version")[0]?.values[0]?.[0]);
    const appId = Number(db.exec("PRAGMA application_id")[0]?.values[0]?.[0]);
    if (version > SCHEMA_VERSION || ![0, APPLICATION_ID].includes(appId))
      throw new Error("This backup belongs to another app or a newer version.");
    const schema = db.exec(
      "SELECT name, type, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'",
    )[0]?.values;
    if (
      !schema ||
      schema.length !== 1 ||
      schema[0][0] !== "app_storage" ||
      schema[0][1] !== "table" ||
      /VIRTUAL/i.test(String(schema[0][2]))
    )
      throw new Error(
        "Unexpected database schema. Only Mole Tracker backups can be restored.",
      );
    const cols = db.exec("PRAGMA table_info(app_storage)")[0]?.values;
    if (
      !cols ||
      cols.length !== 2 ||
      cols[0][1] !== "key" ||
      cols[1][1] !== "value"
    )
      throw new Error("Incompatible backup columns.");
    const rows = db.exec("SELECT key, value FROM app_storage")[0]?.values ?? [];
    if (rows.length > 3) throw new Error("Unexpected backup records.");
    const values = new Map<string, string>();
    for (const [key, value] of rows) {
      if (
        typeof key !== "string" ||
        typeof value !== "string" ||
        values.has(key)
      )
        throw new Error("Invalid backup records.");
      values.set(key, value);
    }
    return archiveFromRows(values);
  } finally {
    db.close();
  }
}
export function encodeDatabase(SQL: SqlJsStatic, data: Archive): Uint8Array {
  validateArchive(data);
  const db = new SQL.Database();
  try {
    db.run(
      `PRAGMA application_id = ${APPLICATION_ID}; PRAGMA user_version = ${SCHEMA_VERSION}; CREATE TABLE app_storage (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`,
    );
    for (const [index, value] of [
      data.account,
      data.profiles,
      data.moles,
    ].entries())
      db.run("INSERT INTO app_storage VALUES (?, ?)", [
        STORAGE_KEYS[index],
        JSON.stringify(value),
      ]);
    const bytes = db.export();
    if (bytes.byteLength > MAX_BACKUP_BYTES)
      throw new Error(
        "This history exceeds the current 100 MB storage limit. Export your current backup before adding more photos.",
      );
    return bytes;
  } finally {
    db.close();
  }
}
