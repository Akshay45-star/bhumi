import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id:        string;
  name:      string;
  phone:     string;
  email?:    string;
  avatarUrl?: string;
  createdAt: string;
}

export interface CheckIn {
  id:        string;
  userId:    string;
  videoUri:  string;
  duration:  number;
  prompt:    string;
  dayNumber: number;
  createdAt: string;
}

export interface MilestoneMessage {
  id:          string;
  userId:      string;
  title:       string;
  recipient:   string;
  videoUri?:   string;
  textContent?: string;
  triggerType: "date" | "event" | "manual";
  triggerValue?: string;
  isRecorded:  boolean;
  createdAt:   string;
}

export interface Asset {
  id:         string;
  userId:     string;
  name:       string;
  type:       "bank" | "investment" | "property" | "crypto" | "insurance" | "other";
  value?:     number;
  currency:   string;
  institution?: string;
  accountNumber?: string;
  beneficiaryId?: string;
  linkStatus: "linked" | "manual" | "not_added";
  createdAt:  string;
}

export interface LegacyHealthScore {
  total:         number;
  assetsMapped:  number;
  beneficiaries: number;
  willCreated:   number;
  emergencyFund: number;
}

// ─── App Store ────────────────────────────────────────────────────────────────

interface AppState {
  // Auth
  user:      User | null;
  authToken: string | null;
  setUser:   (user: User | null) => void;
  setToken:  (token: string | null) => void;
  signOut:   () => void;

  // Check-ins
  checkins:      CheckIn[];
  streak:        number;
  totalDays:     number;
  setCheckins:   (checkins: CheckIn[]) => void;
  addCheckin:    (checkin: CheckIn) => void;

  // Milestone messages
  messages:       MilestoneMessage[];
  setMessages:    (messages: MilestoneMessage[]) => void;
  addMessage:     (message: MilestoneMessage) => void;
  updateMessage:  (id: string, updates: Partial<MilestoneMessage>) => void;

  // Assets
  assets:      Asset[];
  setAssets:   (assets: Asset[]) => void;
  addAsset:    (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;

  // Health score
  healthScore:    LegacyHealthScore;
  setHealthScore: (score: LegacyHealthScore) => void;

  // UI state
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  user:      null,
  authToken: null,
  setUser:   (user)  => set({ user }),
  setToken:  (token) => set({ authToken: token }),
  signOut:   () => set({ user: null, authToken: null }),

  // Check-ins
  checkins:  [],
  streak:    0,
  totalDays: 0,
  setCheckins: (checkins) => set({
    checkins,
    totalDays: checkins.length,
    streak:    calculateStreak(checkins),
  }),
  addCheckin: (checkin) => {
    const updated = [checkin, ...get().checkins];
    set({
      checkins:  updated,
      totalDays: updated.length,
      streak:    calculateStreak(updated),
    });
  },

  // Messages
  messages:      [],
  setMessages:   (messages)        => set({ messages }),
  addMessage:    (message)         => set((s) => ({ messages: [message, ...s.messages] })),
  updateMessage: (id, updates)     => set((s) => ({
    messages: s.messages.map((m) => m.id === id ? { ...m, ...updates } : m),
  })),

  // Assets
  assets:      [],
  setAssets:   (assets)        => set({ assets }),
  addAsset:    (asset)         => set((s) => ({ assets: [asset, ...s.assets] })),
  updateAsset: (id, updates)   => set((s) => ({
    assets: s.assets.map((a) => a.id === id ? { ...a, ...updates } : a),
  })),

  // Health score
  healthScore: { total: 0, assetsMapped: 0, beneficiaries: 0, willCreated: 0, emergencyFund: 0 },
  setHealthScore: (healthScore) => set({ healthScore }),

  // UI
  onboardingComplete:    false,
  setOnboardingComplete: (v) => set({ onboardingComplete: v }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calculateStreak(checkins: CheckIn[]): number {
  if (checkins.length === 0) return 0;
  const sorted = [...checkins].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);
  for (const checkin of sorted) {
    const date = new Date(checkin.createdAt);
    date.setHours(0, 0, 0, 0);
    const diff = (current.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 1) {
      streak++;
      current = date;
    } else {
      break;
    }
  }
  return streak;
}
