import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type BodyType = "male" | "female";
export type BodyView = "front" | "back" | "left" | "right";
export type SymptomFlag =
  | "itching"
  | "bleeding"
  | "pain"
  | "crusting"
  | "rapid_growth"
  | "color_darkening"
  | "irregular_border"
  | "raised"
  | "none";

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  relationship?: string;
  birthYear?: number;
  bodyType: BodyType;
  createdAt: string;
}

export interface ABCDESnapshot {
  asymmetry?: string;
  border?: string;
  color?: string;
  diameter?: string;
  evolution?: string;
}

export interface MolePhoto {
  id: string;
  moleId: string;
  localUri: string;
  capturedAt: string;
  notes?: string;
  angleTag?: string;
}

export interface MoleUpdateLog {
  id: string;
  moleId: string;
  timestamp: string;
  sizeMm?: number;
  symptomChanges?: SymptomFlag[];
  note?: string;
  abcdeSnapshot?: ABCDESnapshot;
  aiScoreSnapshot?: number;
}

export interface Mole {
  id: string;
  profileId: string;
  defaultName: string;
  customName?: string;
  bodyView: BodyView;
  bodyRegion: string;
  bodyX: number;
  bodyY: number;
  bodyZ: number;
  firstNoticedDate: string;
  latestSizeMm?: number;
  sizeEstimateNote?: string;
  colorNotes?: string;
  borderNotes?: string;
  shapeNotes?: string;
  symptomFlags: SymptomFlag[];
  reminderDays?: number;
  aiConcernScore?: number;
  abcdeSummary?: ABCDESnapshot;
  photos: MolePhoto[];
  updateLog: MoleUpdateLog[];
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  onboardingComplete: boolean;
  disclaimerAccepted: boolean;
  reminderMonthlyEnabled: boolean;
  passcodeEnabled: boolean;
  activeProfileId?: string;
}

interface AppState {
  account: Account;
  profiles: Profile[];
  moles: Mole[];
  activeProfileId: string | null;
  isLoading: boolean;
}

interface AppContextType extends AppState {
  setActiveProfile: (id: string) => void;
  createProfile: (
    profile: Omit<Profile, "id" | "createdAt">
  ) => Promise<Profile>;
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  createMole: (mole: Omit<Mole, "id" | "createdAt" | "updatedAt" | "photos" | "updateLog">) => Promise<Mole>;
  updateMole: (id: string, updates: Partial<Mole>) => Promise<void>;
  deleteMole: (id: string) => Promise<void>;
  addMolePhoto: (
    moleId: string,
    photo: Omit<MolePhoto, "id" | "moleId">
  ) => Promise<void>;
  deleteMolePhoto: (moleId: string, photoId: string) => Promise<void>;
  addUpdateLog: (
    moleId: string,
    log: Omit<MoleUpdateLog, "id" | "moleId">
  ) => Promise<void>;
  completeOnboarding: (bodyType: BodyType) => Promise<void>;
  acceptDisclaimer: () => Promise<void>;
  getMolesForProfile: (profileId: string) => Mole[];
  getMoleById: (id: string) => Mole | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  ACCOUNT: "@mole_tracker/account",
  PROFILES: "@mole_tracker/profiles",
  MOLES: "@mole_tracker/moles",
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const DEMO_PROFILE_ID = "demo-profile-1";
const DEMO_MOLE_1_ID = "demo-mole-1";
const DEMO_MOLE_2_ID = "demo-mole-2";

const DEFAULT_ACCOUNT: Account = {
  onboardingComplete: false,
  disclaimerAccepted: false,
  reminderMonthlyEnabled: true,
  passcodeEnabled: false,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    account: DEFAULT_ACCOUNT,
    profiles: [],
    moles: [],
    activeProfileId: null,
    isLoading: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountStr, profilesStr, molesStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCOUNT),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILES),
        AsyncStorage.getItem(STORAGE_KEYS.MOLES),
      ]);

      const account: Account = accountStr
        ? JSON.parse(accountStr)
        : DEFAULT_ACCOUNT;
      const profiles: Profile[] = profilesStr ? JSON.parse(profilesStr) : [];
      const rawMoles: Mole[] = molesStr ? JSON.parse(molesStr) : [];
      const moles: Mole[] = rawMoles.map((m) => ({
        ...m,
        bodyZ: m.bodyZ ?? 0,
      }));

      if (!accountStr) {
        const demoNow = new Date().toISOString();
        const demoProfiles: Profile[] = [
          {
            id: DEMO_PROFILE_ID,
            name: "Alex",
            avatar: "person.circle",
            relationship: "Myself",
            birthYear: 1988,
            bodyType: "male",
            createdAt: demoNow,
          },
        ];
        const demoMoles: Mole[] = [
          {
            id: DEMO_MOLE_1_ID,
            profileId: DEMO_PROFILE_ID,
            defaultName: "Left shoulder mole 01",
            customName: "Shoulder spot",
            bodyView: "back",
            bodyRegion: "left_shoulder",
            bodyX: 0.45,
            bodyY: 0.38,
            bodyZ: 0,
            firstNoticedDate: "2023-06-15",
            latestSizeMm: 4,
            colorNotes: "Light brown, uniform",
            borderNotes: "Well-defined, smooth edges",
            shapeNotes: "Round, regular",
            symptomFlags: ["none"],
            aiConcernScore: 1,
            abcdeSummary: {
              asymmetry: "Symmetrical",
              border: "Regular, well-defined border",
              color: "Uniform light brown",
              diameter: "~4mm, within normal range",
              evolution: "No change observed",
            },
            photos: [],
            updateLog: [
              {
                id: "log-1",
                moleId: DEMO_MOLE_1_ID,
                timestamp: "2023-06-15T10:00:00.000Z",
                sizeMm: 4,
                note: "First noticed, no symptoms",
                aiScoreSnapshot: 1,
              },
            ],
            reminderDays: 90,
            createdAt: "2023-06-15T10:00:00.000Z",
            updatedAt: "2023-06-15T10:00:00.000Z",
          },
          {
            id: DEMO_MOLE_2_ID,
            profileId: DEMO_PROFILE_ID,
            defaultName: "Left forearm mole 01",
            bodyView: "front",
            bodyRegion: "left_forearm",
            bodyX: 0.52,
            bodyY: 0.40,
            bodyZ: 0,
            firstNoticedDate: "2024-01-10",
            latestSizeMm: 6,
            colorNotes: "Mixed brown tones",
            borderNotes: "Slightly irregular",
            shapeNotes: "Oval",
            symptomFlags: ["itching"],
            aiConcernScore: 3,
            abcdeSummary: {
              asymmetry: "Slight asymmetry noted",
              border: "Mildly irregular on one side",
              color: "Mixed brown shades",
              diameter: "~6mm, pencil eraser size",
              evolution: "Itching started recently",
            },
            photos: [],
            updateLog: [
              {
                id: "log-2",
                moleId: DEMO_MOLE_2_ID,
                timestamp: "2024-01-10T14:30:00.000Z",
                sizeMm: 5,
                note: "First noticed",
                aiScoreSnapshot: 2,
              },
              {
                id: "log-3",
                moleId: DEMO_MOLE_2_ID,
                timestamp: "2024-06-01T09:00:00.000Z",
                sizeMm: 6,
                symptomChanges: ["itching"],
                note: "Slight growth, started itching",
                aiScoreSnapshot: 3,
              },
            ],
            reminderDays: 30,
            createdAt: "2024-01-10T14:30:00.000Z",
            updatedAt: "2024-06-01T09:00:00.000Z",
          },
        ];

        setState({
          account: DEFAULT_ACCOUNT,
          profiles: demoProfiles,
          moles: demoMoles,
          activeProfileId: DEMO_PROFILE_ID,
          isLoading: false,
        });
      } else {
        setState({
          account,
          profiles,
          moles,
          activeProfileId: account.activeProfileId || profiles[0]?.id || null,
          isLoading: false,
        });
      }
    } catch (e) {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const saveAccount = async (account: Account) => {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(account));
  };

  const saveProfiles = async (profiles: Profile[]) => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.PROFILES,
      JSON.stringify(profiles)
    );
  };

  const saveMoles = async (moles: Mole[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.MOLES, JSON.stringify(moles));
  };

  const setActiveProfile = useCallback((id: string) => {
    setState((prev) => {
      const newAccount = { ...prev.account, activeProfileId: id };
      saveAccount(newAccount);
      return { ...prev, account: newAccount, activeProfileId: id };
    });
  }, []);

  const createProfile = useCallback(
    async (profile: Omit<Profile, "id" | "createdAt">): Promise<Profile> => {
      const newProfile: Profile = {
        ...profile,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setState((prev) => {
        const newProfiles = [...prev.profiles, newProfile];
        saveProfiles(newProfiles);
        const newAccount = {
          ...prev.account,
          activeProfileId: newProfile.id,
        };
        saveAccount(newAccount);
        return {
          ...prev,
          profiles: newProfiles,
          activeProfileId: newProfile.id,
          account: newAccount,
        };
      });
      return newProfile;
    },
    []
  );

  const updateProfile = useCallback(
    async (id: string, updates: Partial<Profile>) => {
      setState((prev) => {
        const newProfiles = prev.profiles.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        );
        saveProfiles(newProfiles);
        return { ...prev, profiles: newProfiles };
      });
    },
    []
  );

  const deleteProfile = useCallback(async (id: string) => {
    setState((prev) => {
      const newProfiles = prev.profiles.filter((p) => p.id !== id);
      const newMoles = prev.moles.filter((m) => m.profileId !== id);
      saveProfiles(newProfiles);
      saveMoles(newMoles);
      const newActiveId =
        prev.activeProfileId === id
          ? newProfiles[0]?.id || null
          : prev.activeProfileId;
      const newAccount = { ...prev.account, activeProfileId: newActiveId ?? undefined };
      saveAccount(newAccount);
      return {
        ...prev,
        profiles: newProfiles,
        moles: newMoles,
        activeProfileId: newActiveId,
        account: newAccount,
      };
    });
  }, []);

  const createMole = useCallback(
    async (mole: Omit<Mole, "id" | "createdAt" | "updatedAt" | "photos" | "updateLog">): Promise<Mole> => {
      const now = new Date().toISOString();
      const newMole: Mole = {
        ...mole,
        id: generateId(),
        photos: [],
        updateLog: [],
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => {
        const newMoles = [...prev.moles, newMole];
        saveMoles(newMoles);
        return { ...prev, moles: newMoles };
      });
      return newMole;
    },
    []
  );

  const updateMole = useCallback(async (id: string, updates: Partial<Mole>) => {
    setState((prev) => {
      const newMoles = prev.moles.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      );
      saveMoles(newMoles);
      return { ...prev, moles: newMoles };
    });
  }, []);

  const deleteMole = useCallback(async (id: string) => {
    setState((prev) => {
      const newMoles = prev.moles.filter((m) => m.id !== id);
      saveMoles(newMoles);
      return { ...prev, moles: newMoles };
    });
  }, []);

  const addMolePhoto = useCallback(
    async (moleId: string, photo: Omit<MolePhoto, "id" | "moleId">) => {
      const newPhoto: MolePhoto = {
        ...photo,
        id: generateId(),
        moleId,
      };
      setState((prev) => {
        const newMoles = prev.moles.map((m) =>
          m.id === moleId
            ? {
                ...m,
                photos: [...m.photos, newPhoto],
                updatedAt: new Date().toISOString(),
              }
            : m
        );
        saveMoles(newMoles);
        return { ...prev, moles: newMoles };
      });
    },
    []
  );

  const deleteMolePhoto = useCallback(
    async (moleId: string, photoId: string) => {
      setState((prev) => {
        const newMoles = prev.moles.map((m) =>
          m.id === moleId
            ? {
                ...m,
                photos: m.photos.filter((p) => p.id !== photoId),
                updatedAt: new Date().toISOString(),
              }
            : m
        );
        saveMoles(newMoles);
        return { ...prev, moles: newMoles };
      });
    },
    []
  );

  const addUpdateLog = useCallback(
    async (moleId: string, log: Omit<MoleUpdateLog, "id" | "moleId">) => {
      const newLog: MoleUpdateLog = {
        ...log,
        id: generateId(),
        moleId,
      };
      setState((prev) => {
        const newMoles = prev.moles.map((m) =>
          m.id === moleId
            ? {
                ...m,
                updateLog: [...m.updateLog, newLog],
                updatedAt: new Date().toISOString(),
              }
            : m
        );
        saveMoles(newMoles);
        return { ...prev, moles: newMoles };
      });
    },
    []
  );

  const completeOnboarding = useCallback(async (bodyType: BodyType) => {
    setState((prev) => {
      const newAccount = {
        ...prev.account,
        onboardingComplete: true,
        disclaimerAccepted: true,
      };
      saveAccount(newAccount);
      return { ...prev, account: newAccount };
    });
  }, []);

  const acceptDisclaimer = useCallback(async () => {
    setState((prev) => {
      const newAccount = { ...prev.account, disclaimerAccepted: true };
      saveAccount(newAccount);
      return { ...prev, account: newAccount };
    });
  }, []);

  const getMolesForProfile = useCallback(
    (profileId: string) => {
      return state.moles.filter((m) => m.profileId === profileId);
    },
    [state.moles]
  );

  const getMoleById = useCallback(
    (id: string) => {
      return state.moles.find((m) => m.id === id);
    },
    [state.moles]
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        setActiveProfile,
        createProfile,
        updateProfile,
        deleteProfile,
        createMole,
        updateMole,
        deleteMole,
        addMolePhoto,
        deleteMolePhoto,
        addUpdateLog,
        completeOnboarding,
        acceptDisclaimer,
        getMolesForProfile,
        getMoleById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
