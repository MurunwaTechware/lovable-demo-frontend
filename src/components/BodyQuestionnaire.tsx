import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Loader2, Ruler } from "lucide-react";

import { BodyMesh } from "@/components/BodyMesh";
import type {
  BackendMeasurementValue,
  BodyProfile,
  BodyProfileAnswers,
  BodyType,
  MeasurementKey,
} from "@/lib/api";
import {
  BODY_TYPES,
  MEASUREMENT_HINTS,
  MEASUREMENT_LIMITS,
  MORE_KEYS,
  MORE_MEASUREMENTS,
  SEXES,
  SOURCE_LABELS,
  allMeasurementKeys,
  baseBody,
  baseMeasurementsAt,
  measurementKeys,
  measurementName,
  meshFor,
  useSaveBodyProfile,
  type Sex,
} from "@/lib/body-profile";
import {
  BANDS,
  CUPS,
  DRESS_SIZES,
  JEANS_WAISTS,
  bustFromBra,
  cmToFeetInches,
  dressSizeLabel,
  feetInchesToCm,
  waistFromJeans,
  waistHipFromDressSize,
  type BandSystem,
  type Range,
} from "@/lib/body-sizes";

// The body questionnaire: base body (sex and build, shown as the mesh), height and weight, waist from a
// jeans or dress size, and bust from a bra size. It ends on the user's measurements (the main ones, and the
// rest the mesh viewer uses under "More measurements"), which they can edit,
// and saves them to their account. Used at the end of onboarding and on /body-setup, where it opens with
// the saved answers so it can be done again any number of times; each save replaces the last.
//
// Each measurement comes from the best source there is, best first:
//   typed in by the user here   ("manual")
//   worked out from a size      ("questionnaire": a range, e.g. the waist from a jeans size)
//   the chosen base body        ("base": that mesh's own measurement, scaled to the user's height)

type Step = "body" | "size" | "waist" | "bust" | "summary";
type WaistSystem = "jeans_inches" | "dress_size" | "skip";

export function BodyQuestionnaire({
  initial,
  onDone,
  onBack,
  doneLabel = "Save my body",
}: {
  initial?: BodyProfile | null;
  onDone: () => void;
  /** Back from the first step (in onboarding: to the previous page) */
  onBack?: () => void;
  doneLabel?: string;
}) {
  const [sex, setSex] = useState<Sex>(initial?.sex ?? "female");
  const [bodyType, setBodyType] = useState<BodyType>(initial?.body_type ?? "average");
  const [heightCm, setHeightCm] = useState<number>(
    initial?.measurements.height?.value ?? (initial?.sex === "male" ? 178 : 165),
  );
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [weight, setWeight] = useState(initial?.weight_kg ? String(initial.weight_kg) : "");
  const [waistSystem, setWaistSystem] = useState<WaistSystem>(
    initial?.waist?.system ?? "jeans_inches",
  );
  const [waistSize, setWaistSize] = useState<number | null>(initial?.waist?.size ?? null);
  const [braSkip, setBraSkip] = useState(initial ? !initial.bra : false);
  const [bandSystem, setBandSystem] = useState<BandSystem>(initial?.bra?.band_system ?? "inches");
  const [band, setBand] = useState<number | null>(initial?.bra?.band ?? null);
  const [cup, setCup] = useState<string | null>(initial?.bra?.cup ?? null);
  const [step, setStep] = useState<Step>("body");
  // Measurements the user typed in (as typed, so half-finished numbers can be edited), from a previous
  // save too. Height has its own question.
  const [overrides, setOverrides] = useState<Partial<Record<MeasurementKey, string>>>(() =>
    Object.fromEntries(
      Object.entries(initial?.measurements ?? {})
        .filter(([k, m]) => k !== "height" && m?.source === "manual")
        .map(([k, m]) => [k, String(m!.value)]),
    ),
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

  const steps: Step[] =
    sex === "female"
      ? ["body", "size", "waist", "bust", "summary"]
      : ["body", "size", "waist", "summary"];
  const at = steps.indexOf(step);
  const go = (delta: number) => {
    const next = steps[at + delta];
    if (next) setStep(next);
    else if (delta < 0) onBack?.();
  };

  // What the answers work out to
  const sized =
    waistSystem === "jeans_inches" && waistSize
      ? { waist: waistFromJeans(waistSize) }
      : waistSystem === "dress_size" && waistSize
        ? waistHipFromDressSize(waistSize)
        : null;
  const bra =
    sex === "female" && !braSkip && band && cup ? bustFromBra(band, bandSystem, cup) : null;
  const weightKg = weight ? Number(weight) : null;
  const weightOk = weightKg === null || (weightKg >= 25 && weightKg <= 300);
  const heightOk = heightCm >= 100 && heightCm <= 230;
  const base = baseMeasurementsAt(
    sex,
    bodyType,
    heightOk ? heightCm : baseBody(sex, bodyType).height,
  );
  const editableKeys = allMeasurementKeys(sex).filter((k) => k !== "height");
  const mainKeys = measurementKeys(sex).filter((k) => k !== "height");

  // What a measurement is without the user's own number: from a size, else from the base body
  const suggestion = (k: MeasurementKey): BackendMeasurementValue | null => {
    const fromSizes = (r: Range): BackendMeasurementValue => ({ ...r, source: "questionnaire" });
    if (k === "waist" && sized) return fromSizes(sized.waist);
    if (k === "hip" && sized && "hip" in sized) return fromSizes(sized.hip);
    if (k === "bust" && bra) return fromSizes(bra.bust);
    if (k === "underbust" && bra) return fromSizes(bra.underbust);
    const v = base.measurements[k];
    return v != null ? { value: v, source: "base" } : null;
  };
  const validOverride = (k: MeasurementKey, typed: string) => {
    const v = Number(typed);
    const [lo, hi] = MEASUREMENT_LIMITS[k];
    return typed.trim() !== "" && Number.isFinite(v) && v >= lo && v <= hi;
  };
  const overridesOk = editableKeys.every(
    (k) => overrides[k] === undefined || validOverride(k, overrides[k]!),
  );

  const answers = (): BodyProfileAnswers => {
    const measurements: BodyProfileAnswers["measurements"] = {
      height: { value: heightCm, source: "manual" }, // typed in, not worked out from a size
    };
    for (const k of editableKeys) {
      const typed = overrides[k];
      const m =
        typed !== undefined
          ? { value: Math.round(Number(typed) * 10) / 10, source: "manual" as const }
          : suggestion(k);
      if (m) measurements[k] = m;
    }
    return {
      sex,
      body_type: bodyType,
      weight_kg: weightKg,
      waist: waistSystem !== "skip" && waistSize ? { system: waistSystem, size: waistSize } : null,
      bra: bra && band && cup ? { band, band_system: bandSystem, cup } : null,
      measurements,
    };
  };

  const canContinue =
    step === "size"
      ? heightOk && weightOk
      : step === "waist"
        ? waistSystem === "skip" || !!waistSize
        : step === "bust"
          ? braSkip || !!bra
          : true;

  // One editable measurement on the last step: its name, where to measure, where the number came from
  const measurementRow = (k: MeasurementKey) => {
    const suggested = suggestion(k);
    const typed = overrides[k];
    const invalid = typed !== undefined && !validOverride(k, typed);
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
                    Use {suggested ? `${suggested.value} cm` : "suggestion"}
                  </button>
                </>
              ) : suggested ? (
                <>
                  {SOURCE_LABELS[suggested.source]}
                  {suggested.min != null && (
                    <span className="tabular-nums">
                      {" "}
                      · {suggested.min}–{suggested.max} cm
                    </span>
                  )}
                </>
              ) : null}
            </span>
          </span>
        </span>
        <label className="relative shrink-0">
          <span className="sr-only">{measurementName(k, sex)} in cm</span>
          <input
            type="number"
            inputMode="decimal"
            step={0.5}
            value={typed ?? (suggested ? String(suggested.value) : "")}
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
      {/* The base body, as it is with the answers so far */}
      <div className="relative bg-secondary/40 min-h-[320px] md:min-h-[600px]">
        <BodyMesh
          key={mesh.model}
          model={mesh.model}
          image={mesh.image}
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
        <div
          className="flex items-center gap-1.5"
          aria-label={`Question ${at + 1} of ${steps.length}`}
        >
          {steps.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${i === at ? "w-8 bg-[color:var(--plum)]" : i < at ? "w-4 bg-[color:var(--plum)]/50" : "w-4 bg-border"}`}
            />
          ))}
        </div>

        {step === "body" && (
          <section className="mt-6">
            <Kicker>Your body</Kicker>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              Which body is <span className="italic">closest</span> to yours?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This is the starting point for your twin. You'll fine-tune it with your sizes next.
            </p>
            <div
              className="mt-6 inline-flex rounded-full bg-secondary p-1 text-sm"
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
                  className={`rounded-full px-5 py-2 transition ${sex === s.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Build">
              {BODY_TYPES.map((t) => {
                const selected = t.id === bodyType;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setBodyType(t.id)}
                    className={`relative flex flex-col justify-start rounded-2xl border p-2 pb-3 text-left transition ${selected ? "border-[color:var(--plum)] bg-[color:var(--plum)]/5 ring-1 ring-[color:var(--plum)]" : "border-border hover:bg-accent"}`}
                  >
                    <img
                      src={meshFor(sex, t.id).image}
                      alt=""
                      className="mx-auto h-36 md:h-44 w-full object-contain"
                    />
                    <div className="mt-2 px-1 text-sm font-medium">{t.label}</div>
                    <div className="px-1 text-[11px] text-muted-foreground">{t.hint}</div>
                    {selected && (
                      <span className="absolute top-2 right-2 h-5 w-5 grid place-items-center rounded-full bg-[color:var(--plum)] text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <BaseNumbers sex={sex} bodyType={bodyType} />
          </section>
        )}

        {step === "size" && (
          <section className="mt-6">
            <Kicker>Height & weight</Kicker>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">How tall are you?</h2>
            <div className="mt-6 flex items-end gap-3 flex-wrap">
              {heightUnit === "cm" ? (
                <label className="block">
                  <span className="block text-sm font-medium mb-2">Height (cm)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={100}
                    max={230}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className={inputClass(!heightOk)}
                  />
                </label>
              ) : (
                <HeightFeet cm={heightCm} onChange={setHeightCm} />
              )}
              <UnitToggle
                value={heightUnit}
                options={[
                  ["cm", "cm"],
                  ["ft", "ft / in"],
                ]}
                onChange={(u) => setHeightUnit(u as "cm" | "ft")}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground tabular-nums">
              {heightOk
                ? `${cmToFeetInches(heightCm).feet}′${cmToFeetInches(heightCm).inches}″ · ${heightCm} cm`
                : "Enter a height between 100 and 230 cm."}
            </p>

            <label className="mt-8 block max-w-xs">
              <span className="block text-sm font-medium mb-2">
                Weight (kg) <span className="text-muted-foreground font-normal">· optional</span>
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={25}
                max={300}
                placeholder={`e.g. ${base.weightKg}`}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className={inputClass(!weightOk)}
              />
            </label>
            {!weightOk && (
              <p className="mt-1.5 text-xs text-[color:var(--plum)]">
                Enter a weight between 25 and 300 kg.
              </p>
            )}
          </section>
        )}

        {step === "waist" && (
          <section className="mt-6">
            <Kicker>Waist</Kicker>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              What size do you usually buy?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick the size that fits you in most stores. We'll work out your waist from it.
            </p>
            <div className="mt-6">
              <UnitToggle
                value={waistSystem}
                options={[
                  ["jeans_inches", "Jeans waist (W32)"],
                  ["dress_size", "Women's size (10 / 34)"],
                  ["skip", "Skip"],
                ]}
                onChange={(v) => {
                  setWaistSystem(v as WaistSystem);
                  setWaistSize(null);
                }}
              />
            </div>
            {waistSystem !== "skip" && (
              <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                {(waistSystem === "jeans_inches" ? JEANS_WAISTS : DRESS_SIZES).map((s) => (
                  <Chip key={s} selected={waistSize === s} onClick={() => setWaistSize(s)}>
                    {waistSystem === "jeans_inches" ? `W${s}` : dressSizeLabel(s)}
                  </Chip>
                ))}
              </div>
            )}
            {sized && (
              <Result>
                Waist about{" "}
                <b>
                  {sized.waist.min}–{sized.waist.max} cm
                </b>
                {"hip" in sized && (
                  <>
                    , hips about{" "}
                    <b>
                      {sized.hip.min}–{sized.hip.max} cm
                    </b>
                  </>
                )}
                .
              </Result>
            )}
          </section>
        )}

        {step === "bust" && (
          <section className="mt-6">
            <Kicker>Bust</Kicker>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">What's your bra size?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Band and cup, like 34C (or 75C on European labels).
            </p>
            <div className="mt-6">
              <UnitToggle
                value={braSkip ? "skip" : bandSystem}
                options={[
                  ["inches", "34C style"],
                  ["cm", "75C style"],
                  ["skip", "Skip"],
                ]}
                onChange={(v) => {
                  if (v === "skip") return setBraSkip(true);
                  setBraSkip(false);
                  setBandSystem(v as BandSystem);
                  setBand(null);
                  setCup(null);
                }}
              />
            </div>
            {!braSkip && (
              <>
                <div className="mt-5 text-sm font-medium">Band</div>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Band">
                  {BANDS[bandSystem].map((b) => (
                    <Chip key={b} selected={band === b} onClick={() => setBand(b)}>
                      {b}
                    </Chip>
                  ))}
                </div>
                <div className="mt-5 text-sm font-medium">Cup</div>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Cup">
                  {CUPS[bandSystem].map((c) => (
                    <Chip key={c} selected={cup === c} onClick={() => setCup(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </>
            )}
            {bra && (
              <Result>
                Bust about{" "}
                <b>
                  {bra.bust.min}–{bra.bust.max} cm
                </b>
                , underbust about{" "}
                <b>
                  {bra.underbust.min}–{bra.underbust.max} cm
                </b>
                .
              </Result>
            )}
          </section>
        )}

        {step === "summary" && (
          <section className="mt-6">
            <Kicker>Your measurements</Kicker>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              Here's your <span className="italic">base</span> twin.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              These start from the {BODY_TYPES.find((t) => t.id === bodyType)?.label.toLowerCase()}{" "}
              body at your height, with your sizes filled in. If you know a measurement, type it in.
            </p>
            <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
              <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="inline-flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-[color:var(--plum)]" /> Height
                </span>
                <span className="text-right">
                  <span className="font-medium tabular-nums">{heightCm} cm</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {SOURCE_LABELS.manual}
                  </span>
                </span>
              </li>
              {mainKeys.map(measurementRow)}
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
                    Neck, shoulders, arms and legs, from your base body · {MORE_KEYS.length}
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
                      <ul className="divide-y divide-border">{group.keys.map(measurementRow)}</ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {editableKeys.some(
              (k) => overrides[k] !== undefined && !validOverride(k, overrides[k]!),
            ) && (
              <p className="mt-3 text-xs text-[color:var(--plum)]" role="alert">
                Check the highlighted measurements: they look out of range
                {!showMore && MORE_KEYS.some((k) => overrides[k] !== undefined) && (
                  <> (some are under More measurements)</>
                )}
                .
              </p>
            )}
            {weightKg !== null && (
              <p className="mt-3 text-xs text-muted-foreground">Weight: {weightKg} kg</p>
            )}
            {save.isError && (
              <p className="mt-4 text-sm text-[color:var(--plum)]" role="alert">
                {save.error instanceof Error
                  ? save.error.message
                  : "Couldn't save. Please try again."}
              </p>
            )}
          </section>
        )}

        <div className="mt-10 md:mt-auto pt-6 flex items-center justify-between">
          {at > 0 || onBack ? (
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={save.isPending}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <span />
          )}
          {step === "summary" ? (
            <button
              type="button"
              onClick={() => save.mutate(answers(), { onSuccess: onDone })}
              disabled={save.isPending || !overridesOk}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium disabled:opacity-60"
            >
              {save.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {save.isPending ? "Saving…" : doneLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go(1)}
              disabled={!canContinue}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium disabled:opacity-40"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Bits ──────────────────────────────────────────────────────────────────────

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--plum)]">
      {children}
    </span>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`min-w-12 rounded-full border px-3.5 py-2 text-sm tabular-nums transition ${selected ? "border-[color:var(--plum)] bg-[color:var(--plum)] text-white" : "border-border hover:bg-accent"}`}
    >
      {children}
    </button>
  );
}

function UnitToggle({
  value,
  options,
  onChange,
}: {
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="inline-flex flex-wrap rounded-full bg-secondary p-1 text-xs sm:text-sm"
      role="radiogroup"
    >
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={`rounded-full px-3.5 py-1.5 transition ${value === id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Result({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 rounded-2xl bg-secondary/60 px-4 py-3 text-sm" aria-live="polite">
      {children}
    </p>
  );
}

function HeightFeet({ cm, onChange }: { cm: number; onChange: (cm: number) => void }) {
  const { feet, inches } = cmToFeetInches(cm);
  return (
    <div className="flex items-end gap-2">
      <label className="block">
        <span className="block text-sm font-medium mb-2">Feet</span>
        <select
          value={feet}
          onChange={(e) => onChange(feetInchesToCm(Number(e.target.value), inches))}
          className={inputClass(false)}
        >
          {[3, 4, 5, 6, 7].map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-2">Inches</span>
        <select
          value={inches}
          onChange={(e) => onChange(feetInchesToCm(feet, Number(e.target.value)))}
          className={inputClass(false)}
        >
          {Array.from({ length: 12 }, (_, i) => i).map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function inputClass(invalid: boolean) {
  return `w-32 h-12 rounded-xl border bg-background px-4 text-base outline-none transition focus:ring-2 focus:ring-ring ${invalid ? "border-[color:var(--plum)] bg-[color:var(--plum)]/5" : "border-border"}`;
}

/** The chosen base body's own measurements, as measured on its mesh */
function BaseNumbers({ sex, bodyType }: { sex: Sex; bodyType: BodyType }) {
  const body = baseBody(sex, bodyType);
  const keys = measurementKeys(sex).filter((k) => k !== "height" && body[k] != null);
  return (
    <div className="mt-5 rounded-2xl bg-secondary/60 px-4 py-3 text-xs" aria-live="polite">
      <div className="text-muted-foreground">
        This body at {Math.round(body.height)} cm, about {Math.round(body.weight_kg)} kg
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
        {keys.map((k) => (
          <span key={k} className="tabular-nums">
            {measurementName(k, sex)} <span className="font-medium">{body[k]} cm</span>
          </span>
        ))}
      </div>
      <div className="mt-1.5 text-muted-foreground">
        Plus {MORE_KEYS.length} more (neck, shoulders, arms, legs). All scaled to your height next,
        and you can change any of them at the end.
      </div>
    </div>
  );
}
