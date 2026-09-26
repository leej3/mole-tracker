import AsyncStorage from "@react-native-async-storage/async-storage";
import { Archive, Snapshot, STORAGE_KEYS } from "./model";
import { archiveFromRows, validateArchive } from "./validation";
const KEY = "@mole_tracker/snapshot-v1";
export async function readSnapshot(): Promise<Snapshot> {
  const value = await AsyncStorage.getItem(KEY);
  if (value) {
    const parsed = JSON.parse(value);
    return {
      data: validateArchive(parsed.data, true),
      revision: parsed.revision,
    };
  }
  const values = await AsyncStorage.multiGet([...STORAGE_KEYS]);
  return {
    data: archiveFromRows(
      new Map(values.filter((row): row is [string, string] => row[1] !== null)),
      true,
    ),
    revision: 0,
  };
}
export async function saveSnapshot(
  data: Archive,
  expectedRevision: number,
): Promise<number> {
  validateArchive(data, true);
  if ((await readSnapshot()).revision !== expectedRevision)
    throw new Error("History changed. Reload before saving again.");
  const revision = expectedRevision + 1;
  await AsyncStorage.setItem(KEY, JSON.stringify({ data, revision }));
  return revision;
}
