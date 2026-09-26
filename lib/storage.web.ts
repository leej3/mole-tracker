import initSqlJs, { Database, SqlJsStatic } from "sql.js";

const DATABASE_KEY = "mole-tracker.sqlite";
const LEGACY_KEYS = [
  "@mole_tracker/account",
  "@mole_tracker/profiles",
  "@mole_tracker/moles",
];

let databasePromise: Promise<Database> | undefined;
let writeQueue: Promise<void> = Promise.resolve();

function openDatabaseFile(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mole-tracker-storage", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("databases");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open browser storage."));
  });
}

async function readDatabaseBytes(): Promise<Uint8Array | undefined> {
  const store = await openDatabaseFile();
  return new Promise((resolve, reject) => {
    const request = store.transaction("databases", "readonly").objectStore("databases").get(DATABASE_KEY);
    request.onsuccess = () => {
      const value = request.result as ArrayBuffer | undefined;
      store.close();
      resolve(value ? new Uint8Array(value) : undefined);
    };
    request.onerror = () => {
      store.close();
      reject(request.error ?? new Error("Could not read the local database."));
    };
  });
}

async function persistDatabase(database: Database): Promise<void> {
  const bytes = database.export();
  const store = await openDatabaseFile();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = store.transaction("databases", "readwrite");
      transaction.objectStore("databases").put(bytes.buffer, DATABASE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save the local database."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Saving the local database was interrupted."));
    });
  } finally {
    store.close();
  }
}

function ensureSchema(database: Database): void {
  database.run("CREATE TABLE IF NOT EXISTS app_storage (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)");
}

function migrateLegacyLocalStorage(database: Database): string[] {
  const migrated: string[] = [];
  for (const key of LEGACY_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      database.run("INSERT OR IGNORE INTO app_storage (key, value) VALUES (?, ?)", [key, value]);
      migrated.push(key);
    }
  }
  return migrated;
}

function wasmUrl(): string {
  const baseUrl = document.querySelector("base")?.href ?? `${window.location.origin}/`;
  return new URL("sql-wasm.wasm", baseUrl).toString();
}

async function initializeDatabase(): Promise<Database> {
  const SQL: SqlJsStatic = await initSqlJs({ locateFile: wasmUrl });
  const bytes = await readDatabaseBytes();
  const database = bytes ? new SQL.Database(bytes) : new SQL.Database();
  ensureSchema(database);
  const migratedKeys = migrateLegacyLocalStorage(database);
  await persistDatabase(database);
  migratedKeys.forEach((key) => localStorage.removeItem(key));
  return database;
}

function getDatabase(): Promise<Database> {
  databasePromise ??= initializeDatabase();
  return databasePromise;
}

async function serialized<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

const storage = {
  async getItem(key: string): Promise<string | null> {
    const database = await getDatabase();
    const rows = database.exec("SELECT value FROM app_storage WHERE key = ?", [key]);
    return (rows[0]?.values[0]?.[0] as string | undefined) ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    await serialized(async () => {
      const database = await getDatabase();
      database.run("INSERT OR REPLACE INTO app_storage (key, value) VALUES (?, ?)", [key, value]);
      await persistDatabase(database);
    });
  },

  async removeItem(key: string): Promise<void> {
    await serialized(async () => {
      const database = await getDatabase();
      database.run("DELETE FROM app_storage WHERE key = ?", [key]);
      await persistDatabase(database);
    });
  },
};

export default storage;

export async function exportDatabase(): Promise<Uint8Array> {
  await writeQueue;
  return (await getDatabase()).export();
}

export async function importDatabase(bytes: Uint8Array): Promise<void> {
  await serialized(async () => {
    const SQL: SqlJsStatic = await initSqlJs({ locateFile: wasmUrl });
    const candidate = new SQL.Database(bytes);
    try {
      const integrity = candidate.exec("PRAGMA integrity_check")[0]?.values[0]?.[0];
      if (integrity !== "ok") throw new Error("The selected file is not a valid SQLite database.");
      const schema = candidate.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'app_storage'");
      if (!schema.length) throw new Error("This backup does not contain Mole Tracker data.");
      const columns = candidate.exec("PRAGMA table_info(app_storage)")[0]?.values.map((row) => row[1]);
      if (!columns?.includes("key") || !columns.includes("value")) {
        throw new Error("This backup has an incompatible Mole Tracker schema.");
      }
      const previous = await getDatabase();
      await persistDatabase(candidate);
      previous.close();
      databasePromise = Promise.resolve(candidate);
    } catch (error) {
      candidate.close();
      throw error;
    }
  });
}
