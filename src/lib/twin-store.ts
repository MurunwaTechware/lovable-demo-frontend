// Data for the /twin, /measurements and /scan pages: the user's measurement profiles and saved try-ons,
// fetched from the backend (lib/api.ts) and turned into the app's camelCase types:
//   GET /me/measurement-profiles      → MeasurementProfile[] (without measurementsCm and warnings)
//   GET /measurements_data/{job_id}   → measurementsCm, warnings (the profile's measurement.json)
//   GET /me/saved-tryons              → SavedTryOn[]
//   try-on photos                     → MOCK: not in the backend yet (see TryOnPhotos)

import { useQueries, useQuery } from "@tanstack/react-query";

import personImg from "@/assets/tryon-person.jpg";
import closeUpImg from "@/assets/tryon-closeup.jpg";
import {
  getMeasurement,
  getProfiles,
  getSavedTryOns,
  type BackendMeasurement,
  type BackendProfile,
  type BackendSavedTryOn,
} from "@/lib/api";

export type MeasurementKey =
  | "neck_circ"
  | "shoulder_breadth"
  | "bust_chest_circ"
  | "waist_circ"
  | "hip_circ"
  | "thigh_circ"
  | "calf_circ"
  | "bicep_circ"
  | "forearm_circ"
  | "wrist_circ"
  | "ankle_circ"
  | "upper_arm_length"
  | "lower_arm_length"
  | "upper_leg_length"
  | "lower_leg_length"
  | "nape_to_waist";

export type MeasurementProfile = {
  jobId: string; // also the folder name; starts with when it was made
  created: string; // ISO date-time
  status: "ready" | "failed" | "measuring";
  error?: string; // only when status is "failed"
  inputs: {
    heightCm: number;
    weightKg: number;
    gender: "male" | "female" | "neutral";
    age: number;
  } | null; // null only if the job's inputs.json couldn't be read
  bodyShape?: { build: string; torsoPercent: number };
  measurementsCm?: Record<MeasurementKey, number>;
  warnings?: string[]; // what made the estimate less certain, from the model
  photos: ScanPhoto[]; // the views the backend has, in the order they were taken
};

export type ScanView = "front" | "left" | "right";
export type ScanPhoto = { view: ScanView; src: string };

export const SCAN_VIEW_LABELS: Record<ScanView, string> = {
  front: "Front",
  left: "Left side",
  right: "Right side",
};

// The person photos try-ons use unless the user picks others. Two are recommended: a full body photo for
// clothes and shoes, and a close-up so hats, sunglasses and earrings are big enough to see. The try-on uses
// the close-up when every item is worn on the head or neck, and the full body photo otherwise.
export type TryOnPhoto = { src: string; updated: string };
export type TryOnPhotoKind = "full_body" | "close_up";
export type TryOnPhotos = Record<TryOnPhotoKind, TryOnPhoto | null>; // null until they add one

export const TRY_ON_PHOTO_KINDS: TryOnPhotoKind[] = ["full_body", "close_up"];
export const TRY_ON_PHOTO_LABELS: Record<TryOnPhotoKind, string> = {
  full_body: "Full body",
  close_up: "Close-up",
};

export type TryOnItem = { category: string; image: string };

export type SavedTryOn = {
  savedId: string;
  saved: string; // ISO date-time
  measurementProfile: string | null; // job ID of the profile it came from, if any
  result: string; // the image the user chose to keep
  person: string; // the person photo it was made from
  items: TryOnItem[]; // the garments it was made from
};

// Full names, in the order the measurements page lists them (same as the backend's results page)
export const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  neck_circ: "Neck circumference",
  shoulder_breadth: "Shoulder breadth",
  bust_chest_circ: "Bust / chest",
  waist_circ: "Waist circumference",
  hip_circ: "Hip circumference",
  thigh_circ: "Thigh circumference",
  calf_circ: "Calf circumference",
  bicep_circ: "Bicep circumference",
  forearm_circ: "Forearm circumference",
  wrist_circ: "Wrist circumference",
  ankle_circ: "Ankle circumference",
  upper_arm_length: "Upper arm length",
  lower_arm_length: "Lower arm length",
  upper_leg_length: "Upper leg length",
  lower_leg_length: "Lower leg length",
  nape_to_waist: "Nape to waist",
};

// Grouped for display; labels as the user should see them
export const MEASUREMENT_GROUPS: {
  title: string;
  keys: { key: MeasurementKey; label: string }[];
}[] = [
  {
    title: "Upper body",
    keys: [
      { key: "neck_circ", label: "Neck" },
      { key: "shoulder_breadth", label: "Shoulder width" },
      { key: "bust_chest_circ", label: "Chest" },
      { key: "bicep_circ", label: "Bicep" },
      { key: "forearm_circ", label: "Forearm" },
      { key: "wrist_circ", label: "Wrist" },
    ],
  },
  {
    title: "Lower body",
    keys: [
      { key: "waist_circ", label: "Waist" },
      { key: "hip_circ", label: "Hips" },
      { key: "thigh_circ", label: "Thigh" },
      { key: "calf_circ", label: "Calf" },
      { key: "ankle_circ", label: "Ankle" },
    ],
  },
  {
    title: "Lengths",
    keys: [
      { key: "nape_to_waist", label: "Nape to waist" },
      { key: "upper_arm_length", label: "Upper arm" },
      { key: "lower_arm_length", label: "Lower arm" },
      { key: "upper_leg_length", label: "Upper leg" },
      { key: "lower_leg_length", label: "Lower leg" },
    ],
  },
];

// ── From the backend's shapes ─────────────────────────────────────────────────

const SCAN_VIEWS: ScanView[] = ["front", "left", "right"];

// Garment slots as the try-on page names them
const SLOT_LABELS: Record<string, string> = {
  top: "Top",
  bottom: "Bottom",
  headwear: "Headwear",
  eyewear: "Eyewear",
};

function toInputs(i: BackendProfile["inputs"]): MeasurementProfile["inputs"] {
  if (!i) return null;
  return {
    heightCm: i.height_cm,
    weightKg: i.weight_kg,
    gender: i.gender as "male" | "female" | "neutral",
    age: i.age,
  };
}

function toProfile(p: BackendProfile, m?: BackendMeasurement): MeasurementProfile {
  const photos = SCAN_VIEWS.flatMap((view) => {
    const src = p.photos?.[view] ?? (view === "front" ? p.photo : null);
    return src ? [{ view, src }] : [];
  });
  const shape = m?.body_shape ?? p.body_shape;
  return {
    jobId: p.job_id,
    created: p.created,
    status: p.status,
    error: p.error ?? undefined,
    inputs: toInputs(p.inputs ?? m?.inputs ?? null),
    bodyShape: shape ? { build: shape.build, torsoPercent: shape.torso_percent } : undefined,
    measurementsCm: m?.measurements_cm as MeasurementProfile["measurementsCm"],
    warnings: m?.warnings,
    photos,
  };
}

function toSavedTryOn(t: BackendSavedTryOn): SavedTryOn {
  return {
    savedId: t.saved_id,
    saved: t.saved,
    measurementProfile: t.measurement_profile,
    result: t.result ?? "",
    person: t.person ?? "",
    items: Object.entries(t.garments).map(([slot, image]) => ({
      category: SLOT_LABELS[slot] ?? slot,
      image,
    })),
  };
}

// Query keys, so pages can refresh a list after changing it (a new scan, a saved try-on)
export const QUERY_KEYS = {
  profiles: ["measurement-profiles"] as const,
  savedTryOns: ["saved-tryons"] as const,
  measurement: (jobId: string) => ["measurement", jobId] as const,
};

// One retry, not the default three: if the backend is down, say so within a couple of seconds
const RETRY = 1;

const measurementQuery = (jobId: string) => ({
  retry: RETRY,
  queryKey: QUERY_KEYS.measurement(jobId),
  queryFn: () => getMeasurement(jobId),
  staleTime: Infinity, // a profile's measurements never change once written
});

// MOCK until the backend can store them. Sample photos from the backend's test-images folder (ChatGPT).
const TRY_ON_PHOTOS: TryOnPhotos = {
  full_body: { src: personImg, updated: "2026-10-12T09:20:00" },
  close_up: { src: closeUpImg, updated: "2026-10-12T09:21:00" },
};

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : null);

/** Everything the /twin page shows. Measurements are fetched for the latest two ready profiles. */
export function useTwin() {
  const profilesQ = useQuery({ queryKey: QUERY_KEYS.profiles, queryFn: getProfiles, retry: RETRY });
  const tryOnsQ = useQuery({
    queryKey: QUERY_KEYS.savedTryOns,
    queryFn: getSavedTryOns,
    retry: RETRY,
  });
  const list = profilesQ.data ?? [];
  // The latest ready profile, and the one before it to show what changed
  const ready = list.filter((p) => p.status === "ready").slice(0, 2);
  const measurements = useQueries({ queries: ready.map((p) => measurementQuery(p.job_id)) });

  const byJob = new Map<string, BackendMeasurement>();
  measurements.forEach((q, i) => q.data && byJob.set(ready[i].job_id, q.data));
  const profiles = list.map((p) => toProfile(p, byJob.get(p.job_id)));

  return {
    profiles,
    latest: profiles.find((p) => p.status === "ready") ?? null,
    tryOns: (tryOnsQ.data ?? []).map(toSavedTryOn),
    tryOnPhotos: TRY_ON_PHOTOS,
    isLoading: profilesQ.isLoading || tryOnsQ.isLoading || measurements.some((q) => q.isLoading),
    error: errorMessage(
      profilesQ.error ?? tryOnsQ.error ?? measurements.find((q) => q.error)?.error,
    ),
  };
}

/**
 * One profile with its measurements, for /measurements. Without a job ID: the latest ready one.
 * undefined once loaded means it doesn't exist, or belongs to someone else.
 * While a job is still measuring, the list refreshes every few seconds.
 */
export function useMeasurementProfile(jobId?: string) {
  const profilesQ = useQuery({
    queryKey: QUERY_KEYS.profiles,
    queryFn: getProfiles,
    retry: RETRY,
    refetchInterval: (q) =>
      q.state.data?.some((p) => p.status === "measuring" && (!jobId || p.job_id === jobId))
        ? 5000
        : false,
  });
  const list = profilesQ.data ?? [];
  const target = jobId
    ? list.find((p) => p.job_id === jobId)
    : list.find((p) => p.status === "ready");
  const measurementQ = useQuery({
    ...measurementQuery(target?.job_id ?? ""),
    enabled: target?.status === "ready",
  });
  return {
    profile: target ? toProfile(target, measurementQ.data) : undefined,
    isLoading: profilesQ.isLoading || (target?.status === "ready" && measurementQ.isLoading),
    error: errorMessage(profilesQ.error ?? measurementQ.error),
  };
}

/** The user's saved try-on photos (MOCK, see TRY_ON_PHOTOS) */
export function useTryOnPhotos() {
  return TRY_ON_PHOTOS;
}

export function feetInches(cm: number) {
  const totalIn = cm / 2.54;
  let ft = Math.floor(totalIn / 12);
  let inches = Math.round(totalIn - ft * 12);
  if (inches === 12) {
    ft += 1;
    inches = 0;
  }
  return `${ft}′${inches}″`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function describeInputs(i: MeasurementProfile["inputs"]) {
  if (!i) return "Details not available";
  const gender =
    i.gender === "neutral" ? "Gender not given" : i.gender[0].toUpperCase() + i.gender.slice(1);
  return `${i.heightCm} cm · ${i.weightKg} kg · ${gender} · ${i.age} years`;
}
