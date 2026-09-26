import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { readSnapshot, saveSnapshot } from "@/lib/storage";
import {
  Archive,
  BodyType,
  Mole,
  MolePhoto,
  MoleUpdateLog,
  Profile,
  emptyArchive,
  Snapshot,
} from "@/lib/model";
export type {
  Account,
  BodyType,
  BodyView,
  SymptomFlag,
  Profile,
  Mole,
  MolePhoto,
  MoleUpdateLog,
  ABCDESnapshot,
} from "@/lib/model";
type NewMole = Omit<
  Mole,
  "id" | "createdAt" | "updatedAt" | "photos" | "updateLog"
>;
type NewProfile = Omit<Profile, "id" | "createdAt">;
export interface LocationDraft {
  x: number;
  y: number;
  region: string;
  view: "front" | "back";
}
interface AppContextType extends Archive {
  activeProfileId: string | null;
  isLoading: boolean;
  loadError: string | null;
  saveError: string | null;
  isSaving: boolean;
  reload: () => Promise<void>;
  clearSaveError: () => void;
  draftLocation: LocationDraft | null;
  setDraftLocation: (value: LocationDraft | null) => void;
  setActiveProfile: (id: string) => Promise<void>;
  createProfile: (profile: NewProfile) => Promise<Profile>;
  startProfile: (profile: NewProfile) => Promise<void>;
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  createMole: (mole: NewMole, note?: string, photo?: string) => Promise<Mole>;
  updateMole: (id: string, updates: Partial<Mole>) => Promise<void>;
  deleteMole: (id: string) => Promise<void>;
  addMolePhoto: (
    id: string,
    photo: Omit<MolePhoto, "id" | "moleId">,
  ) => Promise<void>;
  deleteMolePhoto: (id: string, photoId: string) => Promise<void>;
  addUpdateLog: (
    id: string,
    log: Omit<MoleUpdateLog, "id" | "moleId">,
  ) => Promise<void>;
  completeOnboarding: (bodyType: BodyType) => Promise<void>;
  acceptDisclaimer: () => Promise<void>;
  getMolesForProfile: (id: string) => Mole[];
  getMoleById: (id: string) => Mole | undefined;
}
const Context = createContext<AppContextType | null>(null);
const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "The operation could not be completed. Please try again.";
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(emptyArchive);
  const current = useRef<Snapshot | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef(0);
  const [isLoading, setLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftLocation, setDraftLocation] = useState<LocationDraft | null>(
    null,
  );
  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    await queue.current.catch(() => undefined);
    try {
      const snapshot = await readSnapshot();
      current.current = snapshot;
      setData(snapshot.data);
      setSaveError(null);
    } catch (error) {
      current.current = null;
      setLoadError(message(error));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  const change = useCallback(
    <T,>(operation: (next: Archive) => T): Promise<T> => {
      pending.current++;
      setSaving(true);
      const result = queue.current
        .then(async () => {
          if (!current.current)
            throw new Error(
              "History is not available. Reload it before saving.",
            );
          const next: Archive = JSON.parse(
            JSON.stringify(current.current.data),
          );
          const value = operation(next);
          const revision = await saveSnapshot(next, current.current.revision);
          // Visible state changes only after the complete snapshot is committed.
          current.current = { data: next, revision };
          setData(next);
          setSaveError(null);
          return value;
        })
        .catch((error) => {
          setSaveError(message(error));
          throw error;
        })
        .finally(() => {
          pending.current--;
          setSaving(pending.current > 0);
        });
      queue.current = result.catch(() => undefined);
      return result;
    },
    [],
  );
  const find = (next: Archive, id: string) => {
    const mole = next.moles.find((m) => m.id === id);
    if (!mole) throw new Error("This record no longer exists.");
    return mole;
  };
  const profile = (next: Archive, input: NewProfile) => {
    const value = {
      ...input,
      name: input.name.trim(),
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    next.profiles.push(value);
    next.account.activeProfileId = value.id;
    return value;
  };
  const value: AppContextType = {
    ...data,
    activeProfileId:
      data.account.activeProfileId ?? data.profiles[0]?.id ?? null,
    isLoading,
    isSaving,
    loadError,
    saveError,
    reload,
    clearSaveError: () => setSaveError(null),
    draftLocation,
    setDraftLocation,
    setActiveProfile: (id) =>
      change((next) => {
        if (!next.profiles.some((p) => p.id === id))
          throw new Error("Profile no longer exists.");
        next.account.activeProfileId = id;
      }),
    createProfile: (input) => change((next) => profile(next, input)),
    startProfile: (input) =>
      change((next) => {
        profile(next, input);
        next.account.onboardingComplete = true;
        next.account.disclaimerAccepted = true;
      }),
    updateProfile: (id, updates) =>
      change((next) => {
        const p = next.profiles.find((p) => p.id === id);
        if (!p) throw new Error("Profile no longer exists.");
        Object.assign(p, updates, { id });
      }),
    deleteProfile: (id) =>
      change((next) => {
        next.profiles = next.profiles.filter((p) => p.id !== id);
        next.moles = next.moles.filter((m) => m.profileId !== id);
        if (next.account.activeProfileId === id)
          next.account.activeProfileId = next.profiles[0]?.id;
        if (!next.profiles.length) next.account.onboardingComplete = false;
      }),
    createMole: (input, note, photo) =>
      change((next) => {
        const id = uid(),
          now = new Date().toISOString();
        const mole: Mole = {
          ...input,
          id,
          createdAt: now,
          updatedAt: now,
          photos: photo
            ? [{ id: uid(), moleId: id, localUri: photo, capturedAt: now }]
            : [],
          updateLog: [
            {
              id: uid(),
              moleId: id,
              timestamp: now,
              note: note || "Record started",
              sizeMm: input.latestSizeMm,
              symptomChanges: input.symptomFlags,
            },
          ],
        };
        next.moles.push(mole);
        return mole;
      }),
    updateMole: (id, updates) =>
      change((next) => {
        Object.assign(find(next, id), updates, {
          id,
          updatedAt: new Date().toISOString(),
        });
      }),
    deleteMole: (id) =>
      change((next) => {
        next.moles = next.moles.filter((m) => m.id !== id);
      }),
    addMolePhoto: (id, photo) =>
      change((next) => {
        const m = find(next, id);
        m.photos.push({ ...photo, id: uid(), moleId: id });
        m.updatedAt = new Date().toISOString();
      }),
    deleteMolePhoto: (id, photoId) =>
      change((next) => {
        const m = find(next, id);
        m.photos = m.photos.filter((p) => p.id !== photoId);
        m.updatedAt = new Date().toISOString();
      }),
    addUpdateLog: (id, log) =>
      change((next) => {
        const m = find(next, id);
        m.updateLog.push({ ...log, id: uid(), moleId: id });
        m.updatedAt = new Date().toISOString();
        const dated = [...m.updateLog].sort(
          (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
        );
        m.latestSizeMm = dated.find(
          (entry) => entry.sizeMm !== undefined,
        )?.sizeMm;
        m.symptomFlags =
          dated.find((entry) => entry.symptomChanges !== undefined)
            ?.symptomChanges ?? m.symptomFlags;
      }),
    completeOnboarding: () =>
      change((next) => {
        next.account.onboardingComplete = true;
        next.account.disclaimerAccepted = true;
      }),
    acceptDisclaimer: () =>
      change((next) => {
        next.account.disclaimerAccepted = true;
      }),
    getMolesForProfile: (id) => data.moles.filter((m) => m.profileId === id),
    getMoleById: (id) => data.moles.find((m) => m.id === id),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error("useApp requires AppProvider");
  return context;
}
