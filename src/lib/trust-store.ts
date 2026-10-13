import { useSyncExternalStore } from "react";

export type ConsentRecord = {
  id: string;
  label: string;
  acceptedAt: string;
  version: string;
};

export type PrivacyPrefs = {
  profileVisibility: "only-me" | "friends" | "specific" | "retailers" | "nobody";
  allowAiRecs: boolean;
  allowMarketing: boolean;
  allowRetailerSuggestions: boolean;
  twoFactor: boolean;
};

export type TrustState = {
  onboarded: boolean;
  ageVerified: boolean;
  isMinor: boolean;
  parentPending: boolean;
  dob: { day: string; month: string; year: string } | null;
  consents: ConsentRecord[];
  prefs: PrivacyPrefs;
  blocked: string[];
};

const STORAGE_KEY = "mannequin.trust.v1";

const defaultState: TrustState = {
  onboarded: false,
  ageVerified: false,
  isMinor: false,
  parentPending: false,
  dob: null,
  consents: [],
  prefs: {
    profileVisibility: "only-me",
    allowAiRecs: true,
    allowMarketing: false,
    allowRetailerSuggestions: true,
    twoFactor: false,
  },
  blocked: [],
};

let state: TrustState = defaultState;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...defaultState, ...JSON.parse(raw) };
  } catch { /* ignore */ }
}

const persist = () => {
  if (typeof window !== "undefined") {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }
  listeners.forEach((l) => l());
};

export const trustStore = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  getSnapshot: () => state,
  getServerSnapshot: () => defaultState,
  setDob(dob: { day: string; month: string; year: string }) {
    const year = parseInt(dob.year, 10);
    const month = parseInt(dob.month, 10);
    const day = parseInt(dob.day, 10);
    let isMinor = false;
    if (year && month && day) {
      const birth = new Date(year, month - 1, day);
      const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000);
      isMinor = age < 18;
    }
    state = { ...state, dob, isMinor, ageVerified: !isMinor, parentPending: isMinor };
    persist();
  },
  acceptConsents(items: { id: string; label: string }[], version = "1.0") {
    const now = new Date().toISOString();
    const map = new Map(state.consents.map((c) => [c.id, c]));
    items.forEach((i) => map.set(i.id, { ...i, acceptedAt: now, version }));
    state = { ...state, consents: Array.from(map.values()) };
    persist();
  },
  completeOnboarding() {
    state = { ...state, onboarded: true };
    persist();
  },
  setPref<K extends keyof PrivacyPrefs>(key: K, value: PrivacyPrefs[K]) {
    state = { ...state, prefs: { ...state.prefs, [key]: value } };
    persist();
  },
  block(name: string) {
    if (state.blocked.includes(name)) return;
    state = { ...state, blocked: [...state.blocked, name] };
    persist();
  },
  unblock(name: string) {
    state = { ...state, blocked: state.blocked.filter((n) => n !== name) };
    persist();
  },
  reset() { state = defaultState; persist(); },
  exportData() {
    return JSON.stringify(state, null, 2);
  },
};

export function useTrust() {
  return useSyncExternalStore(trustStore.subscribe, trustStore.getSnapshot, trustStore.getServerSnapshot);
}
