// The user's body profile from the onboarding questionnaire (backend: GET/PUT /me/body-profile), and the
// base body meshes it picks from. The meshes are Anny bodies (public/meshes): one per sex and build, each
// with its own measurements (base-bodies.json, made by scripts/measure_base_bodies.py).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import baseBodies from "@/lib/base-bodies.json";
import {
  getBodyProfile,
  saveBodyProfile,
  type BodyProfile,
  type BodyProfileAnswers,
  type BodyType,
  type MeasurementKey,
} from "@/lib/api";

export type Sex = BodyProfileAnswers["sex"];

export const BODY_TYPES: { id: BodyType; label: string; hint: string }[] = [
  { id: "slim", label: "Slim", hint: "Lean, narrower frame" },
  { id: "average", label: "Average", hint: "In between" },
  { id: "fuller", label: "Fuller", hint: "Broader, more volume" },
];

export const SEXES: { id: Sex; label: string }[] = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
];

/** The 3D model (GLB) and its picture for one sex and build */
export const meshFor = (sex: Sex, type: BodyType) => ({
  model: `/meshes/${sex}_${type}.glb`,
  image: `/meshes/${sex}_${type}.webp`,
});

export const BODY_PROFILE_KEY = ["body-profile"] as const;

export function useBodyProfile() {
  return useQuery<BodyProfile | null>({
    queryKey: BODY_PROFILE_KEY,
    queryFn: getBodyProfile,
    retry: 1,
  });
}

export function useSaveBodyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveBodyProfile,
    onSuccess: (profile) => queryClient.setQueryData(BODY_PROFILE_KEY, profile),
  });
}

export const MEASUREMENT_NAMES: Record<MeasurementKey, string> = {
  height: "Height",
  bust: "Bust",
  underbust: "Underbust",
  waist: "Waist",
  hip: "Hips",
  inside_leg: "Inside leg",
  head: "Head",
  neck: "Neck",
  shoulder_breadth: "Shoulder width",
  arm_length: "Arm length",
  bicep: "Bicep",
  forearm: "Forearm",
  wrist: "Wrist",
  shoulder_to_crotch: "Shoulder to crotch",
  thigh: "Thigh",
  calf: "Calf",
  ankle: "Ankle",
};

/** Where to put the tape, for someone measuring themselves */
export const MEASUREMENT_HINTS: Record<MeasurementKey, string> = {
  height: "Standing straight, without shoes",
  bust: "Round the fullest part",
  underbust: "Round your ribs, just under the bust",
  waist: "Round the narrowest part",
  hip: "Round the widest part of your seat",
  inside_leg: "Crotch to the floor",
  head: "Round your forehead, above the ears",
  neck: "Round the middle of your neck",
  shoulder_breadth: "Straight across, shoulder tip to shoulder tip",
  arm_length: "Shoulder tip, over the elbow, to the wrist",
  bicep: "Relaxed, halfway between shoulder and elbow",
  forearm: "Round the widest part, below the elbow",
  wrist: "Just above the hand",
  shoulder_to_crotch: "Top of the shoulder straight down to the crotch",
  thigh: "Round the widest part, just below the crotch",
  calf: "Round the widest part",
  ankle: "Round the narrowest part, above the ankle bone",
};

/** The main measurements, the ones clothing sizes go by, in display order (no underbust for men) */
export function measurementKeys(sex: Sex): MeasurementKey[] {
  return sex === "female"
    ? ["height", "bust", "underbust", "waist", "hip", "inside_leg"]
    : ["height", "bust", "waist", "hip", "inside_leg"];
}

/**
 * The rest of the measurements the mesh viewer works with (as SMPL-Anthropometry takes them), grouped
 * like the scan page. Every base body has them all; they start from it, scaled to the user's height.
 */
export const MORE_MEASUREMENTS: { title: string; keys: MeasurementKey[] }[] = [
  {
    title: "Upper body",
    keys: [
      "head",
      "neck",
      "shoulder_breadth",
      "arm_length",
      "bicep",
      "forearm",
      "wrist",
      "shoulder_to_crotch",
    ],
  },
  { title: "Lower body", keys: ["thigh", "calf", "ankle"] },
];
export const MORE_KEYS: MeasurementKey[] = MORE_MEASUREMENTS.flatMap((g) => g.keys);

/** Every measurement this body has: the main ones, then the rest */
export const allMeasurementKeys = (sex: Sex) => [...measurementKeys(sex), ...MORE_KEYS];

export const measurementName = (key: MeasurementKey, sex: Sex) =>
  key === "bust" && sex === "male" ? "Chest" : MEASUREMENT_NAMES[key];

// Believable ranges in cm, the same as the backend's (body_profile.py LIMITS), so a typo is caught here
// rather than on save. Generous on purpose: they stop typos and nonsense, not unusual bodies.
export const MEASUREMENT_LIMITS: Record<MeasurementKey, [number, number]> = {
  height: [100, 230],
  bust: [50, 200],
  underbust: [45, 180],
  waist: [40, 200],
  hip: [50, 220],
  inside_leg: [40, 120],
  head: [40, 70],
  neck: [20, 70],
  shoulder_breadth: [20, 70],
  arm_length: [30, 100],
  bicep: [12, 70],
  forearm: [12, 60],
  wrist: [8, 35],
  shoulder_to_crotch: [30, 100],
  thigh: [25, 110],
  calf: [15, 75],
  ankle: [10, 45],
};

export const SOURCE_LABELS = {
  base: "From your base body",
  questionnaire: "From your clothing sizes",
  scan: "From your scan",
  manual: "Entered by you",
} as const;

// ── The base bodies' own measurements ─────────────────────────────────────────

type BaseBody = Partial<Record<MeasurementKey, number>> & { height: number; weight_kg: number };
const BASE = baseBodies as Record<`${Sex}_${BodyType}`, BaseBody>;

/** The base body as measured, at its own height (157 cm female, 169 cm male) */
export const baseBody = (sex: Sex, type: BodyType) => BASE[`${sex}_${type}`];

/**
 * The base body's measurements for someone of this height: everything scaled in proportion, the same
 * height correction the mesh pipeline uses. Weight scales with volume (height cubed).
 */
export function baseMeasurementsAt(sex: Sex, type: BodyType, heightCm: number) {
  const body = baseBody(sex, type);
  const k = heightCm / body.height;
  const round = (cm: number) => Math.round(cm * 2) / 2;
  const measurements: Partial<Record<MeasurementKey, number>> = {};
  for (const key of allMeasurementKeys(sex)) {
    const v = body[key];
    if (key !== "height" && v != null) measurements[key] = round(v * k);
  }
  return { measurements, weightKg: Math.round(body.weight_kg * k ** 3) };
}
