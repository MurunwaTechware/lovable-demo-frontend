import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Ruler } from "lucide-react";

import { BodyMesh } from "@/components/BodyMesh";
import type { BodyProfile, BodyProfileAnswers, BodyType } from "@/lib/api";
import {
  BODY_TYPES,
  MEASUREMENT_NAMES,
  SEXES,
  SOURCE_LABELS,
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
// jeans or dress size, and bust from a bra size. It ends on a summary of the starting measurements and
// saves them to the user's account. Used at the end of onboarding and on /body-setup, where it opens
// with the saved answers so it can be done again any number of times; each save replaces the last.

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

  const answers = (): BodyProfileAnswers => {
    const fromSizes = (r: Range) => ({ ...r, source: "questionnaire" as const });
    return {
      sex,
      body_type: bodyType,
      weight_kg: weightKg,
      waist: waistSystem !== "skip" && waistSize ? { system: waistSystem, size: waistSize } : null,
      bra: bra && band && cup ? { band, band_system: bandSystem, cup } : null,
      measurements: {
        height: { value: heightCm, source: "manual" }, // typed in, not worked out from a size
        ...(sized ? { waist: fromSizes(sized.waist) } : {}),
        ...(sized && "hip" in sized ? { hip: fromSizes(sized.hip) } : {}),
        ...(bra ? { underbust: fromSizes(bra.underbust), bust: fromSizes(bra.bust) } : {}),
      },
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
                placeholder="e.g. 68"
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
            <Kicker>Your starting point</Kicker>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              Here's your <span className="italic">base</span> twin.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sizes vary between stores, so these are ranges. A scan, or your own tape measure, will
              make them exact later.
            </p>
            <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
              {(Object.keys(MEASUREMENT_NAMES) as (keyof typeof MEASUREMENT_NAMES)[])
                .filter((k) => sex === "female" || (k !== "bust" && k !== "underbust"))
                .map((k) => {
                  const m = answers().measurements[k];
                  return (
                    <li
                      key={k}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-[color:var(--plum)]" />{" "}
                        {MEASUREMENT_NAMES[k]}
                      </span>
                      {m ? (
                        <span className="text-right">
                          <span className="font-medium tabular-nums">
                            {m.min != null ? `${m.min}–${m.max} cm` : `${m.value} cm`}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            {SOURCE_LABELS[m.source]}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not given</span>
                      )}
                    </li>
                  );
                })}
            </ul>
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
              disabled={save.isPending}
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
