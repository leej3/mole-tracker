import initSqlJs from "sql.js";
import { Archive, Snapshot, STORAGE_KEYS, emptyArchive } from "./model";
import { archiveFromRows } from "./validation";
import { decodeDatabase, encodeDatabase } from "./database";
import { readBytes, writeBytes } from "./browser-store";
const sql = () =>
  initSqlJs({
    locateFile: () =>
      new URL("sql-wasm.wasm", window.location.origin).toString(),
  });
export async function readSnapshot(): Promise<Snapshot> {
  const stored = await readBytes();
  if (stored.bytes)
    return {
      data: decodeDatabase(await sql(), stored.bytes),
      revision: stored.revision,
    };
  const rows = new Map<string, string>();
  for (const key of STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) rows.set(key, value);
  }
  return {
    data: rows.size ? archiveFromRows(rows) : emptyArchive(),
    revision: stored.revision,
  };
}
export async function saveSnapshot(
  data: Archive,
  expectedRevision: number,
): Promise<number> {
  const revision = await writeBytes(
    encodeDatabase(await sql(), data),
    expectedRevision,
  );
  // Only remove legacy copies after the complete new snapshot is durable.
  try {
    STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* A stale legacy copy is safer than reporting a durable save as failed. */
  }
  return revision;
}
export async function exportDatabase(): Promise<Uint8Array> {
  const { data } = await readSnapshot();
  return encodeDatabase(await sql(), data);
}
export async function inspectDatabase(bytes: Uint8Array): Promise<Archive> {
  return decodeDatabase(await sql(), bytes);
}
export async function importDatabase(
  bytes: Uint8Array,
  expectedRevision: number,
): Promise<void> {
  const SQL = await sql();
  const candidate = decodeDatabase(SQL, bytes);
  // Never install an imported schema or mutate the existing database in place.
  await writeBytes(encodeDatabase(SQL, candidate), expectedRevision);
}
