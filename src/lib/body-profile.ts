// The user's body profile, their twin (backend: GET/PUT /me/body-profile), from the body questionnaire or
// a scan and adjusted in the twin page's editor, and the base body meshes it picks from. The meshes are Anny bodies (public/meshes): one per sex and build, each
// with its own measurements (base-bodies.json, made by scripts/measure_base_bodies.py).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import baseBodies from "@/lib/base-bodies.json";
import {
  getBodyProfile,
  saveBodyProfile,
  type AboutYou,
  type BackendMeasurement,
  type BackendMeasurementValue,
  type BodyProfile,
  type BodyProfileAnswers,
  type BodyType,
  type MeasurementKey,
} from "@/lib/api";
import { bustFromBra, waistFromJeans, waistHipFromDressSize, type Range } from "@/lib/body-sizes";

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
  upper_arm_length: "Upper arm",
  lower_arm_length: "Lower arm",
  upper_leg_length: "Upper leg",
  lower_leg_length: "Lower leg",
  nape_to_waist: "Nape to waist",
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
  upper_arm_length: "Shoulder tip to the elbow",
  lower_arm_length: "Elbow to the wrist",
  upper_leg_length: "Top of the leg (the hip joint) to the knee",
  lower_leg_length: "Knee to the ankle",
  nape_to_waist: "Back of the neck down to your natural waist",
};

/** The main measurements, the ones clothing sizes go by, in display order (no underbust for men) */
export function measurementKeys(sex: Sex): MeasurementKey[] {
  return sex === "female"
    ? ["height", "bust", "underbust", "waist", "hip", "inside_leg"]
    : ["height", "bust", "waist", "hip", "inside_leg"];
}

/**
 * The rest of the measurements: the mesh viewer's (as SMPL-Anthropometry takes them) and the scan's
 * lengths, grouped like the scan page. Every base body has them all; they start from it, scaled to the
 * user's height, and a scan replaces every one it estimates.
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
  // The scan's lengths, which are also Anny's own length controls
  {
    title: "Lengths",
    keys: [
      "upper_arm_length",
      "lower_arm_length",
      "upper_leg_length",
      "lower_leg_length",
      "nape_to_waist",
    ],
  },
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
  upper_arm_length: [15, 50],
  lower_arm_length: [15, 45],
  upper_leg_length: [25, 70],
  lower_leg_length: [25, 65],
  nape_to_waist: [25, 65],
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

// ── Where each measurement comes from ─────────────────────────────────────────
// Best first: typed in by the user ("manual"), the scan ("scan"), worked out from a clothing size
// ("questionnaire": a range), the chosen base body scaled to the user's height ("base"). The body
// questionnaire, a new scan and the twin page's editor all build the profile's measurements this way,
// so what the user typed in themselves always carries over.

type Measurements = Partial<Record<MeasurementKey, number>>;

export type MeasurementInputs = {
  sex: Sex;
  bodyType: BodyType;
  heightCm: number;
  waist: BodyProfileAnswers["waist"];
  bra: BodyProfileAnswers["bra"];
  /** From the scan the profile is based on, if any */
  scan?: Measurements;
};

/** What each measurement is without the user's own number */
export function suggestionsFor(inputs: MeasurementInputs) {
  const { sex, bodyType, heightCm, waist, bra, scan } = inputs;
  const sized = !waist
    ? null
    : waist.system === "jeans_inches"
      ? { waist: waistFromJeans(waist.size) }
      : waistHipFromDressSize(waist.size);
  const bust = sex === "female" && bra ? bustFromBra(bra.band, bra.band_system, bra.cup) : null;
  const base = baseMeasurementsAt(sex, bodyType, heightCm).measurements;
  const fromSizes = (r: Range): BackendMeasurementValue => ({ ...r, source: "questionnaire" });

  const out: Partial<Record<MeasurementKey, BackendMeasurementValue>> = {};
  for (const k of allMeasurementKeys(sex)) {
    if (k === "height") continue;
    const scanned = scan?.[k];
    if (scanned != null) out[k] = { value: scanned, source: "scan" };
    else if (k === "waist" && sized) out[k] = fromSizes(sized.waist);
    else if (k === "hip" && sized && "hip" in sized) out[k] = fromSizes(sized.hip);
    else if (k === "bust" && bust) out[k] = fromSizes(bust.bust);
    else if (k === "underbust" && bust) out[k] = fromSizes(bust.underbust);
    else if (base[k] != null) out[k] = { value: base[k]!, source: "base" };
  }
  return out;
}

/** The profile's measurements: height, then for the rest the user's own number, else the suggestion */
export function buildMeasurements(inputs: MeasurementInputs, manual: Measurements) {
  const measurements: BodyProfileAnswers["measurements"] = {
    height: { value: inputs.heightCm, source: "manual" }, // always typed in by the user
  };
  const suggested = suggestionsFor(inputs);
  for (const k of allMeasurementKeys(inputs.sex)) {
    if (k === "height") continue;
    const own = manual[k];
    const m = own != null ? { value: own, source: "manual" as const } : suggested[k];
    if (m) measurements[k] = m;
  }
  return measurements;
}

/** The numbers the user typed in themselves (not height, which every save sets) */
export function manualMeasurements(profile: BodyProfile | null | undefined): Measurements {
  const out: Measurements = {};
  for (const [k, m] of Object.entries(profile?.measurements ?? {})) {
    if (k !== "height" && m?.source === "manual") out[k as MeasurementKey] = m.value;
  }
  return out;
}

/** The profile's numbers that came from its scan */
export function scanMeasurementsOf(profile: BodyProfile | null | undefined): Measurements {
  const out: Measurements = {};
  for (const [k, m] of Object.entries(profile?.measurements ?? {})) {
    if (m?.source === "scan") out[k as MeasurementKey] = m.value;
  }
  return out;
}

// ── From a scan ───────────────────────────────────────────────────────────────

// The scan's names (gemini_client.Measurements) for the profile's measurements: every one the scan
// estimates. Arm length is its upper and lower arm together.
const FROM_SCAN: Partial<Record<MeasurementKey, string>> = {
  neck: "neck_circ",
  shoulder_breadth: "shoulder_breadth",
  bust: "bust_chest_circ",
  waist: "waist_circ",
  hip: "hip_circ",
  thigh: "thigh_circ",
  calf: "calf_circ",
  bicep: "bicep_circ",
  forearm: "forearm_circ",
  wrist: "wrist_circ",
  ankle: "ankle_circ",
  upper_arm_length: "upper_arm_length",
  lower_arm_length: "lower_arm_length",
  upper_leg_length: "upper_leg_length",
  lower_leg_length: "lower_leg_length",
  nape_to_waist: "nape_to_waist",
};

/** A scan's numbers as the profile's measurements, rounded to 0.5 cm; any out of range are left out */
export function measurementsFromScan(cm: Record<string, number>): Measurements {
  const out: Measurements = {};
  const put = (k: MeasurementKey, v: number | undefined) => {
    const [lo, hi] = MEASUREMENT_LIMITS[k];
    if (v != null && Number.isFinite(v) && v >= lo && v <= hi) out[k] = Math.round(v * 2) / 2;
  };
  for (const [k, name] of Object.entries(FROM_SCAN)) put(k as MeasurementKey, cm[name!]);
  if (cm.upper_arm_length != null && cm.lower_arm_length != null)
    put("arm_length", cm.upper_arm_length + cm.lower_arm_length);
  return out;
}

/** The base body whose bust, waist and hips (at this height) are nearest these */
export function closestBodyType(sex: Sex, heightCm: number, m: Measurements): BodyType {
  let best: BodyType = "average";
  let bestError = Infinity;
  for (const t of BODY_TYPES) {
    const base = baseMeasurementsAt(sex, t.id, heightCm).measurements;
    let error = 0;
    for (const k of ["bust", "waist", "hip"] as const) {
      if (m[k] != null && base[k] != null) error += ((m[k]! - base[k]!) / base[k]!) ** 2;
    }
    if (error < bestError) [best, bestError] = [t.id, error];
  }
  return best;
}

/**
 * A finished scan as the user's twin: its measurements, the base body nearest them (filling in what the
 * scan doesn't measure), the height and weight entered for it, and anything the user typed in before.
 */
export function profileFromScan(
  scan: BackendMeasurement,
  existing: BodyProfile | null | undefined,
  about: AboutYou | null | undefined,
): BodyProfileAnswers {
  const g = scan.inputs.gender;
  const sex: Sex = g === "female" || g === "male" ? g : (existing?.sex ?? about?.sex ?? "female");
  const heightCm = scan.inputs.height_cm;
  const scanned = measurementsFromScan(scan.measurements_cm);
  const bodyType = closestBodyType(sex, heightCm, scanned);
  const waist = existing?.waist ?? null;
  const bra = sex === "female" ? (existing?.bra ?? null) : null;
  return {
    sex,
    body_type: bodyType,
    weight_kg: scan.inputs.weight_kg,
    waist,
    bra,
    measurements: buildMeasurements(
      { sex, bodyType, heightCm, waist, bra, scan: scanned },
      manualMeasurements(existing),
    ),
    scan_job: scan.job_id,
  };
}
