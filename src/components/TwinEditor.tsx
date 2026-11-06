import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, Loader2, Ruler } from "lucide-react";

import { BodyMesh } from "@/components/BodyMesh";
import { HeightField, Kicker, WeightField } from "@/components/body-form-bits";
import { heightOk, weightOk } from "@/lib/body-form";
import { useKeepAboutYouInStep } from "@/lib/about-you";
import type { BodyProfile, BodyType, MeasurementKey } from "@/lib/api";
import { SOURCE_COUNTS, fitShape } from "@/lib/body-shapes";
import {
  BODY_TYPES,
  MEASUREMENT_HINTS,
  MEASUREMENT_LIMITS,
  MORE_KEYS,
  MORE_MEASUREMENTS,
  SEXES,
  SOURCE_LABELS,
  allMeasurementKeys,
  baseMeasurementsAt,
  buildMeasurements,
  manualMeasurements,
  measurementKeys,
  measurementName,
  meshFor,
  scanMeasurementsOf,
  suggestionsFor,
  useSaveBodyProfile,
  type Sex,
} from "@/lib/body-profile";

// The twin editor (the mesh viewer screen), on the twin page's "Edit": the twin's mesh next to every
// measurement, each showing where it came from (the scan, a clothing size, the base body) and editable.
// A number typed in here is the user's own and stays through a new scan or questionnaire. The base body
// (sex and build) and the height can be changed too; the suggestions follow them.
//
// The mesh follows the numbers as they're typed: the base body reshaped with Anny's measurement sliders
// (lib/body-shapes.ts). Where a number is further than Anny's sliders reach, the row says where the twin
// lands instead.

export function TwinEditor({ profile, onDone }: { profile: BodyProfile; onDone: () => void }) {
  const [sex, setSex] = useState<Sex>(profile.sex);
  const [bodyType, setBodyType] = useState<BodyType>(profile.body_type);
  const [heightCm, setHeightCm] = useState(profile.measurements.height?.value ?? 165);
  const [weight, setWeight] = useState(profile.weight_kg ? String(profile.weight_kg) : "");
  // The user's own numbers, as typed (so half-finished ones can be edited)
  const [overrides, setOverrides] = useState<Partial<Record<MeasurementKey, string>>>(() =>
    Object.fromEntries(Object.entries(manualMeasurements(profile)).map(([k, v]) => [k, String(v)])),
  );
  const setOverride = (k: MeasurementKey, v: string | undefined) =>
    setOverrides((o) => {
      const next = { ...o };
      if (v === undefined) delete next[k];
      else next[k] = v;
      return next;
    });
  // "More measurements" starts open when the user has typed one of them in before
  const [showMore, setShowMore] = useState(() => MORE_KEYS.some((k) => overrides[k] !== undefined));
  const save = useSaveBodyProfile();
  const keepAboutYouInStep = useKeepAboutYouInStep();

  const scan = scanMeasurementsOf(profile);
  const bra = sex === "female" ? profile.bra : null;
  const inputs = {
    sex,
    bodyType,
    heightCm: heightOk(heightCm) ? heightCm : (profile.measurements.height?.value ?? 165),
    waist: profile.waist,
    bra,
    scan,
  };
  const suggested = suggestionsFor(inputs);
  const editableKeys = allMeasurementKeys(sex).filter((k) => k !== "height");
  const mainKeys = measurementKeys(sex).filter((k) => k !== "height");

  const validOverride = (k: MeasurementKey, typed: string) => {
    const v = Number(typed);
    const [lo, hi] = MEASUREMENT_LIMITS[k];
    return typed.trim() !== "" && Number.isFinite(v) && v >= lo && v <= hi;
  };
  const anyInvalid = editableKeys.some(
    (k) => overrides[k] !== undefined && !validOverride(k, overrides[k]!),
  );
  const canSave = !anyInvalid && heightOk(heightCm) && weightOk(weight) && !save.isPending;
  const weightKg = weight.trim() ? Number(weight) : null;

  const submit = () => {
    const manual: Partial<Record<MeasurementKey, number>> = {};
    for (const k of editableKeys) {
      const typed = overrides[k];
      if (typed !== undefined) manual[k] = Math.round(Number(typed) * 10) / 10;
    }
    save.mutate(
      {
        sex,
        body_type: bodyType,
        weight_kg: weightKg,
        waist: profile.waist,
        bra,
        measurements: buildMeasurements({ ...inputs, heightCm }, manual),
        scan_job: profile.scan_job ?? null,
      },
      {
        onSuccess: () => {
          keepAboutYouInStep(sex, heightCm, weightKg);
          onDone();
        },
      },
    );
  };

  // The twin's shape for the numbers as they are now: each typed number (when it's valid), else the
  // suggestion. Refitted on every change; it's a few milliseconds.
  const targetsKey = JSON.stringify([sex, bodyType, heightCm, overrides, suggested]);
  const fitted = useMemo(() => {
    const targets: Partial<Record<MeasurementKey, number>> = {
      height: heightOk(heightCm) ? heightCm : inputs.heightCm,
    };
    const counts: Partial<Record<MeasurementKey, number>> = {};
    for (const k of editableKeys) {
      const typed = overrides[k];
      if (typed !== undefined && validOverride(k, typed)) {
        targets[k] = Number(typed);
        counts[k] = SOURCE_COUNTS.manual;
      } else if (suggested[k]) {
        targets[k] = suggested[k]!.value;
        counts[k] = SOURCE_COUNTS[suggested[k]!.source];
      }
    }
    return { targets, counts, ...fitShape(sex, bodyType, targets, counts) };
  }, [targetsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // The next build up (for numbers the twin can't reach) or down (for ones it can't get under)
  const nextBuild = (bigger: boolean): BodyType | null => {
    const order: BodyType[] = ["slim", "average", "fuller"];
    return order[order.indexOf(bodyType) + (bigger ? 1 : -1)] ?? null;
  };

  const row = (k: MeasurementKey) => {
    const s = suggested[k];
    const typed = overrides[k];
    const invalid = typed !== undefined && !validOverride(k, typed);
    // How far the reshaped twin is from this number, when it's more than a centimetre
    const lands = fitted.predicted[k];
    // Only for numbers someone gave (typed, scanned, from a size): the base body's own suggestions just
    // follow the rest. A number from a clothing size is a range, so landing anywhere in it is fine; a
    // typed or scanned one is exact, so more than a centimetre off is worth saying (a centimetre is within
    // tape-measure error, and the twin's numbers are rounded to half a centimetre).
    const given = (fitted.counts[k] ?? 0) > SOURCE_COUNTS.base;
    const range = typed === undefined && s?.min != null && s?.max != null ? s : null;
    const off =
      given &&
      lands != null &&
      fitted.targets[k] != null &&
      (range ? lands < range.min! || lands > range.max! : Math.abs(lands - fitted.targets[k]!) > 1);
    // Which way it's out: the twin can't get as big as asked (true), or as small
    const tooSmall = off && lands! < fitted.targets[k]!;
    // Its own slider all the way (a real limit of this body), or held back by the other numbers
    const atLimit = (fitted.weights[`${k}${tooSmall ? "+" : "-"}`] ?? 0) > 0.99;
    const [lo, hi] = MEASUREMENT_LIMITS[k];
    return (
      <li key={k} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
        <span className="flex items-start gap-2 min-w-0">
          <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--plum)]" />
          <span className="min-w-0">
            <span className="block">{measurementName(k, sex)}</span>
            <span className="block text-[11px] text-muted-foreground leading-snug">
              {MEASUREMENT_HINTS[k]}
            </span>
            <span className="block text-[11px] text-muted-foreground leading-snug">
              {typed !== undefined ? (
                <>
                  {invalid ? `Between ${lo} and ${hi} cm` : SOURCE_LABELS.manual} ·{" "}
                  <button
                    type="button"
                    onClick={() => setOverride(k, undefined)}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Use {s ? `${s.value} cm` : "suggestion"}
                  </button>
                </>
              ) : s ? (
                <>
                  {SOURCE_LABELS[s.source]}
                  {s.min != null && (
                    <span className="tabular-nums">
                      {" "}
                      · {s.min}–{s.max} cm
                    </span>
                  )}
                </>
              ) : null}
            </span>
            {off && (
              <span className="block text-[11px] text-[color:var(--plum)] leading-snug tabular-nums">
                {range
                  ? `Your twin gets to ${lands} cm, outside your size's ${range.min}–${range.max} cm`
                  : atLimit
                    ? `Your twin gets to ${lands} cm: as far as this body goes`
                    : `Your twin gets to ${lands} cm, balancing this against your other measurements`}
                {nextBuild(tooSmall) && (
                  <>
                    {" "}
                    ·{" "}
                    <button
                      type="button"
                      onClick={() => setBodyType(nextBuild(tooSmall)!)}
                      className="underline underline-offset-2"
                    >
                      Try {BODY_TYPES.find((t) => t.id === nextBuild(tooSmall))?.label}
                    </button>
                  </>
                )}
              </span>
            )}
          </span>
        </span>
        <label className="relative shrink-0">
          <span className="sr-only">{measurementName(k, sex)} in cm</span>
          <input
            type="number"
            inputMode="decimal"
            step={0.5}
            value={typed ?? (s ? String(s.value) : "")}
            onChange={(e) => setOverride(k, e.target.value)}
            aria-invalid={invalid}
            className={`w-24 h-10 rounded-xl border bg-background pl-3 pr-9 text-right tabular-nums outline-none transition focus:ring-2 focus:ring-ring ${invalid ? "border-[color:var(--plum)] bg-[color:var(--plum)]/5" : typed !== undefined ? "border-[color:var(--plum)]/60" : "border-border"}`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            cm
          </span>
        </label>
      </li>
    );
  };

  const mesh = meshFor(sex, bodyType);

  return (
    <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* A fixed height, kept in view while the measurements scroll past, so the body can be watched
          changing (on phones too, above the list); the column's own height grows with "More
          measurements" and would make the camera zoom in */}
      <div className="sticky top-16 z-10 bg-secondary h-[36svh] min-h-[220px] md:top-20 md:bg-secondary/40 md:self-start md:h-[calc(100svh-7rem)] md:min-h-[520px] md:max-h-[760px]">
        <BodyMesh
          key={mesh.model}
          model={mesh.model}
          image={mesh.image}
          shape={fitted.weights}
          className="absolute inset-0"
        />
        <div className="absolute top-4 left-4 rounded-full bg-card/90 px-3 py-1 text-[11px] font-medium shadow-sm">
          {SEXES.find((s) => s.id === sex)?.label} ·{" "}
          {BODY_TYPES.find((t) => t.id === bodyType)?.label}
        </div>
        <div className="absolute bottom-4 inset-x-4 text-center text-[11px] text-muted-foreground">
          Drag to turn
        </div>
      </div>

      <div className="p-6 md:p-10 flex flex-col">
        <Kicker>Your measurements</Kicker>
        <h2 className="mt-2 font-display text-3xl md:text-4xl">
          Fine-tune your <span className="italic">twin</span>.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {profile.scan_job
            ? "These come from your scan, with your base body filling in the rest."
            : "These come from your sizes and your base body at your height."}{" "}
          If you know a measurement, type it in: it stays yours, even after a new scan.
        </p>

        {/* Base body */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div
            className="inline-flex rounded-full bg-secondary p-1 text-sm"
            role="radiogroup"
            aria-label="Base body"
          >
            {SEXES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={sex === s.id}
                onClick={() => setSex(s.id)}
                className={`rounded-full px-4 py-1.5 transition ${sex === s.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div
            className="inline-flex rounded-full bg-secondary p-1 text-sm"
            role="radiogroup"
            aria-label="Build"
          >
            {BODY_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={bodyType === t.id}
                onClick={() => setBodyType(t.id)}
                className={`rounded-full px-4 py-1.5 transition ${bodyType === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-6">
          <HeightField cm={heightCm} onChange={setHeightCm} />
          <WeightField
            value={weight}
            onChange={setWeight}
            placeholder={`e.g. ${baseMeasurementsAt(sex, bodyType, inputs.heightCm).weightKg}`}
          />
        </div>

        <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
          {mainKeys.map(row)}
        </ul>

        <div className="mt-4 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
            aria-controls="more-measurements"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm"
          >
            <span>
              <span className="font-medium">More measurements</span>
              <span className="block text-[11px] text-muted-foreground">
                Neck, shoulders, arms, legs and lengths · {MORE_KEYS.length}
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition ${showMore ? "rotate-180" : ""}`}
            />
          </button>
          {showMore && (
            <div id="more-measurements" className="border-t border-border">
              {MORE_MEASUREMENTS.map((group) => (
                <div key={group.title}>
                  <div className="px-4 pt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {group.title}
                  </div>
                  <ul className="divide-y divide-border">{group.keys.map(row)}</ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {anyInvalid && (
          <p className="mt-3 text-xs text-[color:var(--plum)]" role="alert">
            Check the highlighted measurements: they look out of range
            {!showMore && MORE_KEYS.some((k) => overrides[k] !== undefined) && (
              <> (some are under More measurements)</>
            )}
            .
          </p>
        )}
        {save.isError && (
          <p className="mt-4 text-sm text-[color:var(--plum)]" role="alert">
            {save.error instanceof Error ? save.error.message : "Couldn't save. Please try again."}
          </p>
        )}

        <div className="mt-10 pt-6 flex items-center justify-between">
          <Link to="/twin" className="text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </Link>
          <button
            type="button"
            onClick={submit}
            disabled={!canSave}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium disabled:opacity-60"
          >
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
