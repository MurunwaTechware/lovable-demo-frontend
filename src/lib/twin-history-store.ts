import { useSyncExternalStore } from "react";

export type TwinMeasurements = {
  height: number;
  chest: number;
  waist: number;
  hip: number;
  inseam: number;
  weight?: number;
};

export type TwinSnapshot = {
  id: string;
  label: string;
  date: string; // ISO
  goal: "cutting" | "bulking" | "maintain" | "recomp" | "other";
  note?: string;
  measurements: TwinMeasurements;
};

type HistoryState = {
  snapshots: TwinSnapshot[];
  activeId: string | null;
};

const STORAGE_KEY = "mannequin.twinHistory.v1";
const ACTIVE_KEY = "mannequin.activeMeasurements";

const seed: TwinSnapshot[] = [
  {
    id: "seed-1",
    label: "Baseline scan",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 210).toISOString(),
    goal: "maintain",
    note: "First body scan — starting point.",
    measurements: { height: 172, chest: 96, waist: 84, hip: 100, inseam: 80, weight: 82 },
  },
  {
    id: "seed-2",
    label: "Cut · week 8",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    goal: "cutting",
    note: "Down 5 kg — waist visibly leaner.",
    measurements: { height: 172, chest: 94, waist: 78, hip: 97, inseam: 80, weight: 77 },
  },
  {
    id: "seed-3",
    label: "Gym · lean bulk",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    goal: "bulking",
    note: "Chest & shoulders up after strength block.",
    measurements: { height: 172, chest: 100, waist: 80, hip: 99, inseam: 80, weight: 80 },
  },
];

const defaultState: HistoryState = { snapshots: seed, activeId: "seed-3" };

let state: HistoryState = defaultState;
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
    const active = state.snapshots.find((s) => s.id === state.activeId);
    if (active) {
      try { localStorage.setItem(ACTIVE_KEY, JSON.stringify(active.measurements)); } catch { /* ignore */ }
    }
  }
  listeners.forEach((l) => l());
};

export const twinHistoryStore = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  getSnapshot: () => state,
  getServerSnapshot: () => defaultState,
  add(snap: Omit<TwinSnapshot, "id" | "date"> & { date?: string }) {
    const id = `snap-${Date.now()}`;
    const entry: TwinSnapshot = { id, date: snap.date ?? new Date().toISOString(), ...snap };
    state = { snapshots: [...state.snapshots, entry], activeId: id };
    persist();
    return id;
  },
  update(id: string, patch: Partial<TwinSnapshot>) {
    state = {
      ...state,
      snapshots: state.snapshots.map((s) => (s.id === id ? { ...s, ...patch, measurements: { ...s.measurements, ...(patch.measurements ?? {}) } } : s)),
    };
    persist();
  },
  remove(id: string) {
    const next = state.snapshots.filter((s) => s.id !== id);
    state = { snapshots: next, activeId: state.activeId === id ? (next[next.length - 1]?.id ?? null) : state.activeId };
    persist();
  },
  activate(id: string) {
    state = { ...state, activeId: id };
    persist();
  },
};

export function useTwinHistory() {
  return useSyncExternalStore(twinHistoryStore.subscribe, twinHistoryStore.getSnapshot, twinHistoryStore.getServerSnapshot);
}

export function goalTint(goal: TwinSnapshot["goal"]): string {
  switch (goal) {
    case "cutting": return "#60a5fa";
    case "bulking": return "#f472b6";
    case "maintain": return "#a78bfa";
    case "recomp": return "#e8b872";
    default: return "#c084fc";
  }
}
