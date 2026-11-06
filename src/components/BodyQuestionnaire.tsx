import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

import { BodyMesh } from "@/components/BodyMesh";
import {
  Chip,
  HeightField,
  Kicker,
  Result,
  UnitToggle,
  WeightField,
} from "@/components/body-form-bits";
import { heightOk, weightOk } from "@/lib/body-form";
import { useKeepAboutYouInStep } from "@/lib/about-you";
import type { AboutYou, BodyProfile, BodyProfileAnswers, BodyType } from "@/lib/api";
import {
  BODY_TYPES,
  MORE_KEYS,
  SEXES,
  baseBody,
  baseMeasurementsAt,
  buildMeasurements,
  manualMeasurements,
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
  dressSizeLabel,
  waistFromJeans,
  waistHipFromDressSize,
  type BandSystem,
} from "@/lib/body-sizes";

// The body questionnaire, one of the two ways to set up a twin (the other is the scan): the base body
// (sex and build, shown as the mesh), the waist from a jeans or dress size, and the bust from a bra size.
// Height and weight come from onboarding's "About you" (asked here only when there's none yet). It saves
// the twin and goes on to the twin page, where the measurements can be checked and changed (the editor).
// Opens with the saved answers, so it can be done again any number of times; each save replaces the last
// but keeps the numbers the user typed in themselves.

type Step = "body" | "size" | "waist" | "bust";
type WaistSystem = "jeans_inches" | "dress_size" | "skip";

export function BodyQuestionnaire({
  initial,
  about,
  onDone,
  onBack,
  doneLabel = "Save my twin",
}: {
  initial?: BodyProfile | null;
  about?: AboutYou | null;
  onDone: () => void;
  /** Back from the first step */
  onBack?: () => void;
  doneLabel?: string;
}) {
  // Sex, height and weight from whichever was saved last: "About you" (e.g. just changed in onboarding)
  // or the twin. Saving the twin updates "About you" too, so normally they agree.
  const aboutIsNewer = !!about && (!initial || about.updated_at >= initial.updated_at);
  const fromTwin = {
    sex: initial?.sex ?? null,
    height: initial?.measurements.height?.value ?? null,
    weight: initial?.weight_kg ?? null,
  };
  const fromAbout = {
    sex: about?.sex ?? null,
    height: about?.height_cm ?? null,
    weight: about?.weight_kg ?? null,
  };
  const [first, second] = aboutIsNewer ? [fromAbout, fromTwin] : [fromTwin, fromAbout];
  const [sex, setSex] = useState<Sex>(first.sex ?? second.sex ?? "female");
  const [bodyType, setBodyType] = useState<BodyType>(initial?.body_type ?? "average");
  const knownHeight = first.height ?? second.height;
  const [heightCm, setHeightCm] = useState<number>(knownHeight ?? (sex === "male" ? 178 : 165));
  const [weight, setWeight] = useState(() => {
    const kg = first.weight ?? second.weight;
    return kg ? String(kg) : "";
  });
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
  const keepAboutYouInStep = useKeepAboutYouInStep();

  // Height and weight were asked in onboarding; only ask here if they weren't
  const [askSize] = useState(knownHeight === null);
  const steps: Step[] = [
    "body",
    ...(askSize ? (["size"] as const) : []),
    "waist",
    ...(sex === "female" ? (["bust"] as const) : []),
  ];
  const at = steps.indexOf(step);
  const last = at === steps.length - 1;
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
  const weightKg = weight.trim() ? Number(weight) : null;
  const base = baseMeasurementsAt(
    sex,
    bodyType,
    heightOk(heightCm) ? heightCm : baseBody(sex, bodyType).height,
  );

  const answers = (): BodyProfileAnswers => {
    const waist =
      waistSystem !== "skip" && waistSize ? { system: waistSystem, size: waistSize } : null;
    const braAnswer = bra && band && cup ? { band, band_system: bandSystem, cup } : null;
    return {
      sex,
      body_type: bodyType,
      weight_kg: weightKg,
      waist,
      bra: braAnswer,
      // From the answers now, not an earlier scan; what the user typed in themselves stays
      measurements: buildMeasurements(
        { sex, bodyType, heightCm, waist, bra: braAnswer },
        manualMeasurements(initial),
      ),
      scan_job: null,
    };
  };

  const canContinue =
    step === "size"
      ? heightOk(heightCm) && weightOk(weight)
      : step === "waist"
        ? waistSystem === "skip" || !!waistSize
        : step === "bust"
          ? braSkip || !!bra
          : true;

  const finish = () =>
    save.mutate(answers(), {
      onSuccess: () => {
        keepAboutYouInStep(sex, heightCm, weightKg);
        onDone();
      },
    });

  const mesh = meshFor(sex, bodyType);

  return (
    <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* The base body, as it is with the answers so far */}
      <div className="relative bg-secondary/40 h-[360px] md:h-auto md:min-h-[560px]">
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
              This is the starting point for your twin. Your sizes fine-tune it next.
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
            <BaseNumbers
              sex={sex}
              heightCm={heightOk(heightCm) ? heightCm : null}
              measurements={base.measurements}
              weightKg={base.weightKg}
            />
          </section>
        )}

        {step === "size" && (
          <section className="mt-6">
            <Kicker>Height & weight</Kicker>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">How tall are you?</h2>
            <div className="mt-6">
              <HeightField cm={heightCm} onChange={setHeightCm} />
            </div>
            <div className="mt-8">
              <WeightField
                value={weight}
                onChange={setWeight}
                placeholder={`e.g. ${base.weightKg}`}
              />
            </div>
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

        {last && (
          <p className="mt-6 text-xs text-muted-foreground">
            Saving makes your twin from these answers. You can check and change every measurement on
            your twin page afterwards.
          </p>
        )}
        {save.isError && (
          <p className="mt-4 text-sm text-[color:var(--plum)]" role="alert">
            {save.error instanceof Error ? save.error.message : "Couldn't save. Please try again."}
          </p>
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
          {last ? (
            <button
              type="button"
              onClick={finish}
              disabled={save.isPending || !canContinue}
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

/** The chosen base body's main measurements, at the user's height when it's known */
function BaseNumbers({
  sex,
  heightCm,
  measurements,
  weightKg,
}: {
  sex: Sex;
  heightCm: number | null;
  measurements: ReturnType<typeof baseMeasurementsAt>["measurements"];
  weightKg: number;
}) {
  const keys = measurementKeys(sex).filter((k) => k !== "height" && measurements[k] != null);
  return (
    <div className="mt-5 rounded-2xl bg-secondary/60 px-4 py-3 text-xs" aria-live="polite">
      <div className="text-muted-foreground">
        {heightCm ? `This body at your height, ${heightCm} cm` : "This body"}, about {weightKg} kg
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
        {keys.map((k) => (
          <span key={k} className="tabular-nums">
            {measurementName(k, sex)} <span className="font-medium">{measurements[k]} cm</span>
          </span>
        ))}
      </div>
      <div className="mt-1.5 text-muted-foreground">
        Plus {MORE_KEYS.length} more (neck, shoulders, arms, legs, lengths). You can change any of
        them on your twin page.
      </div>
    </div>
  );
}
