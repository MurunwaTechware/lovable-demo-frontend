// Reshaping a base body to the user's measurements, live in the browser.
//
// Each base body's GLB carries Anny's measurement sliders as morph targets ("waist+" is the waist slider
// fully up, "waist-" fully down), and body-shapes.json says how many cm each one changes each
// measurement on that body (both made by scripts/build_body_shapes.py). Anny's sliders are linear on
// each side of 0 and add up exactly, so blending them here gives the same body Anny would make.
//
// fitShape works out the slider settings that bring every measurement as close as it can to the user's
// numbers. Sliders stay within Anny's range (-1..1), so a number further than a slider reaches is as
// close as the twin gets; `predicted` says where each one lands.

import shapes from "@/lib/body-shapes.json";
import type { BodyType, MeasurementKey } from "@/lib/api";
import { baseBody, type Sex } from "@/lib/body-profile";

type Effects = Partial<Record<MeasurementKey, number>>;
const SHAPES = shapes as unknown as {
  sliders: string[];
  effects: Record<string, Record<string, Effects>>;
};

/** Morph target name → how far it's applied (0..1), for BodyMesh */
export type ShapeWeights = Record<string, number>;

export type FittedShape = {
  weights: ShapeWeights;
  /** Where each measurement lands on the reshaped twin, in cm at the user's height */
  predicted: Partial<Record<MeasurementKey, number>>;
};

const ROUNDS = 60;
const STAY_PUT = 0.02; // prefers leaving a slider at 0 when moving it hardly helps
const HEIGHT_COUNTS = 4; // height counts most, so the legs and torso trade off around it

/**
 * How much a cm off counts, by where the number came from. A number the user typed counts most: it's on
 * purpose, and the twin should give way elsewhere for it. A scan's next. A clothing size is a rough range,
 * so it gives way to both. The base body's own suggestions hardly count at all, so they simply follow
 * (pushing the waist out also moves the underbust, and that's fine when nobody gave an underbust).
 */
export const SOURCE_COUNTS = { manual: 3, scan: 1, questionnaire: 0.7, base: 0.1 } as const;

/**
 * The slider settings for these measurements (cm, at the user's height). Measurements are scaled to the
 * base body's height first, the same height correction the suggestions use, then matched.
 */
export function fitShape(
  sex: Sex,
  bodyType: BodyType,
  targets: Partial<Record<MeasurementKey, number>>,
  /** How much each measurement counts (SOURCE_COUNTS); 1 when not given */
  counts: Partial<Record<MeasurementKey, number>> = {},
): FittedShape {
  const base = baseBody(sex, bodyType);
  const effects = SHAPES.effects[`${sex}_${bodyType}`];
  const heightCm = targets.height ?? base.height;
  const scale = heightCm / base.height;

  // The goals, at the base body's height
  const keys = (Object.keys(targets) as MeasurementKey[]).filter(
    (k) => base[k] != null && targets[k] != null,
  );
  const goal: Partial<Record<MeasurementKey, number>> = {};
  for (const k of keys) goal[k] = k === "height" ? base.height : targets[k]! / scale;

  const importance = (k: MeasurementKey) => (k === "height" ? HEIGHT_COUNTS : (counts[k] ?? 1));
  const w: Record<string, number> = Object.fromEntries(SHAPES.sliders.map((s) => [s, 0]));
  const effect = (slider: string, amount: number): Effects =>
    effects[`${slider}${amount >= 0 ? "+" : "-"}`] ?? {};
  const predictAt = (k: MeasurementKey) => {
    let v = base[k]!;
    for (const s of SHAPES.sliders) {
      if (w[s] !== 0) v += (effect(s, w[s])[k] ?? 0) * Math.abs(w[s]);
    }
    return v;
  };

  // Coordinate descent: one slider at a time, each the best it can be given the others
  for (let round = 0; round < ROUNDS; round++) {
    let moved = 0;
    for (const s of SHAPES.sliders) {
      const before = w[s];
      // What's left for this slider to fix, without its own part
      const residual: Partial<Record<MeasurementKey, number>> = {};
      for (const k of keys) {
        const own = (effect(s, before)[k] ?? 0) * Math.abs(before);
        residual[k] = predictAt(k) - own - goal[k]!;
      }
      let best = { amount: 0, cost: Infinity };
      for (const side of [1, -1]) {
        const e = effects[`${s}${side > 0 ? "+" : "-"}`] ?? {};
        let num = 0;
        let den = STAY_PUT;
        for (const k of keys) {
          const ek = e[k] ?? 0;
          const imp = importance(k);
          num += imp * residual[k]! * ek;
          den += imp * ek * ek;
        }
        const a = Math.min(1, Math.max(0, -num / den)); // how far along this side, 0..1
        let cost = STAY_PUT * a * a;
        for (const k of keys) {
          const imp = importance(k);
          cost += imp * (residual[k]! + a * (e[k] ?? 0)) ** 2;
        }
        if (cost < best.cost) best = { amount: side * a, cost };
      }
      w[s] = best.amount;
      moved = Math.max(moved, Math.abs(w[s] - before));
    }
    if (moved < 1e-4) break;
  }

  const weights: ShapeWeights = {};
  for (const s of SHAPES.sliders) {
    if (w[s] > 0) weights[`${s}+`] = w[s];
    else if (w[s] < 0) weights[`${s}-`] = -w[s];
  }
  const predicted: Partial<Record<MeasurementKey, number>> = {};
  for (const k of keys) predicted[k] = Math.round(predictAt(k) * scale * 2) / 2;
  return { weights, predicted };
}
