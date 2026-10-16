// Data for the /twin page: the user's measurement profiles and saved try-ons.
//
// MOCK DATA until the backend is connected. The shapes mirror the backend's responses, so wiring it up
// means replacing useTwin() with fetches and keeping the page as it is:
//   GET /me/measurement-profiles      → MeasurementProfile[] (without measurementsCm and warnings)
//   GET /measurements_data/{job_id}   → measurementsCm, warnings (the profile's measurement.json)
//   GET /me/saved-tryons              → SavedTryOn[]
//   try-on photos                     → not in the backend yet (see TryOnPhotos)
// Field names are camelCased here; the backend sends snake_case (job_id, measurements_cm, ...).

import heroImg from "@/assets/hero.jpg";
import signupImg from "@/assets/signup-visual.jpg";
import coatImg from "@/assets/p1.jpg";
import closeUpImg from "@/assets/tryon-closeup.jpg";

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
  };
  bodyShape?: { build: string; torsoPercent: number };
  measurementsCm?: Record<MeasurementKey, number>;
  warnings?: string[]; // what made the estimate less certain, from the model
  photos: ScanPhoto[]; // always the three views, in the order they were taken
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

// The demo uses one image for all three views; the backend serves front.*, left.* and right.*
const scanPhotos = (src: string): ScanPhoto[] =>
  (["front", "left", "right"] as const).map((view) => ({ view, src }));

// Sample people and numbers only, not anyone's real measurements
const PROFILES: MeasurementProfile[] = [
  {
    jobId: "20261012-091522-4c7a21",
    created: "2026-10-12T09:15:22",
    status: "ready",
    inputs: { heightCm: 168, weightKg: 61, gender: "female", age: 27 },
    bodyShape: { build: "Slim", torsoPercent: 49 },
    measurementsCm: {
      neck_circ: 33.5,
      shoulder_breadth: 39.0,
      bust_chest_circ: 88.0,
      waist_circ: 70.5,
      hip_circ: 95.0,
      thigh_circ: 54.0,
      calf_circ: 35.5,
      bicep_circ: 27.0,
      forearm_circ: 23.5,
      wrist_circ: 15.0,
      ankle_circ: 21.5,
      upper_arm_length: 31.5,
      lower_arm_length: 25.0,
      upper_leg_length: 44.0,
      lower_leg_length: 41.5,
      nape_to_waist: 40.5,
    },
    warnings: ["The jacket hides the waist, so the waist estimate is less precise."],
    photos: scanPhotos(heroImg),
  },
  {
    jobId: "20261008-085204-a1b2c3",
    created: "2026-10-08T08:52:04",
    status: "ready",
    inputs: { heightCm: 168, weightKg: 62, gender: "female", age: 27 },
    bodyShape: { build: "Average", torsoPercent: 50 },
    measurementsCm: {
      neck_circ: 34.0,
      shoulder_breadth: 39.5,
      bust_chest_circ: 89.5,
      waist_circ: 72.0,
      hip_circ: 96.0,
      thigh_circ: 55.0,
      calf_circ: 36.0,
      bicep_circ: 27.5,
      forearm_circ: 24.0,
      wrist_circ: 15.0,
      ankle_circ: 21.5,
      upper_arm_length: 31.5,
      lower_arm_length: 25.0,
      upper_leg_length: 44.0,
      lower_leg_length: 41.5,
      nape_to_waist: 40.5,
    },
    warnings: [],
    photos: scanPhotos(heroImg),
  },
  {
    jobId: "20261005-174410-9b41ee",
    created: "2026-10-05T17:44:10",
    status: "failed",
    error: "The model blocked these photos for safety reasons. Try different photos.",
    inputs: { heightCm: 168, weightKg: 62, gender: "female", age: 27 },
    photos: scanPhotos(heroImg),
  },
];

const TRYONS: SavedTryOn[] = [
  {
    savedId: "20261012-093112-c19d72",
    saved: "2026-10-12T09:31:12",
    measurementProfile: "20261012-091522-4c7a21",
    result: signupImg,
    person: heroImg,
    items: [{ category: "Outerwear", image: coatImg }],
  },
];

// The close-up is cropped from the same sample photo for the demo
const TRY_ON_PHOTOS: TryOnPhotos = {
  full_body: { src: heroImg, updated: "2026-10-12T09:20:00" },
  close_up: { src: closeUpImg, updated: "2026-10-12T09:21:00" },
};

const newestFirst = <T>(items: T[], key: (t: T) => string) =>
  [...items].sort((a, b) => key(b).localeCompare(key(a)));

export function useTwin() {
  const profiles = newestFirst(PROFILES, (p) => p.created);
  return {
    profiles,
    latest: profiles.find((p) => p.status === "ready") ?? null,
    tryOns: newestFirst(TRYONS, (t) => t.saved),
    tryOnPhotos: TRY_ON_PHOTOS,
  };
}

/** One profile by job ID, as GET /measurements_data/{job_id} would return it. undefined if it isn't theirs. */
export function getProfile(jobId: string): MeasurementProfile | undefined {
  return PROFILES.find((p) => p.jobId === jobId);
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
  const gender =
    i.gender === "neutral" ? "Gender not given" : i.gender[0].toUpperCase() + i.gender.slice(1);
  return `${i.heightCm} cm · ${i.weightKg} kg · ${gender} · ${i.age} years`;
}
