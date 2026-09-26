const KEY = "mole-tracker.sqlite";
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mole-tracker-storage", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("databases");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Browser storage could not be opened. Check that site storage is allowed.",
        ),
      );
  });
}
export async function readBytes(): Promise<{
  bytes?: Uint8Array;
  revision: number;
}> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("databases", "readonly");
    const store = tx.objectStore("databases");
    const bytes = store.get(KEY);
    const revision = store.get("revision");
    tx.oncomplete = () => {
      db.close();
      resolve({
        bytes: bytes.result ? new Uint8Array(bytes.result) : undefined,
        revision: revision.result ?? 0,
      });
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(
        new Error(
          "Your stored history could not be read. It has not been replaced.",
        ),
      );
    };
  });
}
export async function writeBytes(
  bytes: Uint8Array,
  expectedRevision: number,
): Promise<number> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("databases", "readwrite");
    const store = tx.objectStore("databases");
    let conflict = false;
    const request = store.get("revision");
    request.onsuccess = () => {
      if ((request.result ?? 0) !== expectedRevision) {
        conflict = true;
        tx.abort();
        return;
      }
      // Comparison and both writes share one IndexedDB transaction across tabs.
      store.put(bytes.slice().buffer, KEY);
      store.put(expectedRevision + 1, "revision");
    };
    tx.oncomplete = () => {
      db.close();
      resolve(expectedRevision + 1);
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(
        new Error(
          conflict
            ? "Another tab changed this history. Keep your draft, reload the latest history, then save again."
            : "The save did not complete. Your previous history is safe. Check available storage and try again.",
        ),
      );
    };
  });
}
