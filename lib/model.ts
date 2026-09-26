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

export interface Archive {
  account: Account;
  profiles: Profile[];
  moles: Mole[];
}
export const STORAGE_KEYS = [
  "@mole_tracker/account",
  "@mole_tracker/profiles",
  "@mole_tracker/moles",
] as const;
export function emptyArchive(): Archive {
  return {
    account: {
      onboardingComplete: false,
      disclaimerAccepted: false,
      reminderMonthlyEnabled: false,
      passcodeEnabled: false,
    },
    profiles: [],
    moles: [],
  };
}
export interface Snapshot {
  data: Archive;
  revision: number;
}
