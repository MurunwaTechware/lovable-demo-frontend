import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, Loader2, X, ArrowRight } from "lucide-react";

import { Nav } from "@/components/Nav";
import { useQueryClient } from "@tanstack/react-query";

import { uploadScan, watchJob } from "@/lib/api";
import { QUERY_KEYS, SCAN_VIEW_LABELS, type ScanView } from "@/lib/twin-store";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Body scan — Upload your photos · Mannequin AI" },
      {
        name: "description",
        content:
          "Upload three photos (front, left side, right side) and your details to get your body measurements.",
      },
      { property: "og:title", content: "Body scan · Mannequin AI" },
      {
        property: "og:description",
        content: "Three photos and a few details. Your Digital Twin does the rest.",
      },
    ],
  }),
  component: ScanPage,
});

// Same limits as the backend's /process_upload, so a demo upload would also pass there
const VIEWS: ScanView[] = ["front", "left", "right"];
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 7 * 1024 * 1024;
const MAX_TOTAL_BYTES = 14 * 1024 * 1024;
const FEET = [3, 4, 5, 6, 7];
const INCHES = Array.from({ length: 12 }, (_, i) => i);

type Photo = { file: File; url: string };
type Errors = Partial<Record<ScanView | "gender" | "weight" | "age" | "form", string>>;

function ScanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const stopWatching = useRef<(() => void) | null>(null);
  useEffect(() => () => stopWatching.current?.(), []);
  const [photos, setPhotos] = useState<Partial<Record<ScanView, Photo>>>({});
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(8);
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [measuring, setMeasuring] = useState(false);

  const heightCm = Math.round((feet * 12 + inches) * 2.54);

  // Release the previews when leaving the page
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(
    () => () => Object.values(photosRef.current).forEach((p) => p && URL.revokeObjectURL(p.url)),
    [],
  );

  const clearError = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));

  const setPhoto = (view: ScanView, file: File | undefined) => {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type))
      return setErrors((e) => ({ ...e, [view]: "Use a JPEG, PNG or WebP photo." }));
    if (file.size > MAX_PHOTO_BYTES)
      return setErrors((e) => ({ ...e, [view]: "Over 7 MB. Resize it and try again." }));
    setPhotos((p) => {
      if (p[view]) URL.revokeObjectURL(p[view]!.url);
      return { ...p, [view]: { file, url: URL.createObjectURL(file) } };
    });
    clearError(view);
  };

  const removePhoto = (view: ScanView) =>
    setPhotos((p) => {
      if (p[view]) URL.revokeObjectURL(p[view]!.url);
      const next = { ...p };
      delete next[view];
      return next;
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found: Errors = {};
    for (const v of VIEWS) if (!photos[v]) found[v] = "Add this photo.";
    const total = Object.values(photos).reduce((s, p) => s + (p?.file.size ?? 0), 0);
    if (!found.front && !found.left && !found.right && total > MAX_TOTAL_BYTES)
      found.form = "The photos together are over 14 MB. Resize one or more and try again.";
    if (!gender) found.gender = "Please select an option.";
    const w = Number(weight);
    if (!weight || !(w >= 30 && w <= 200)) found.weight = "Enter a weight between 30 and 200 kg.";
    const a = Number(age);
    if (!age || !Number.isInteger(a) || a < 1 || a > 120)
      found.age = "Enter an age between 1 and 120.";
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      document
        .querySelector("[data-invalid='true']")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    void startMeasuring(w, a);
  };

  // Sends the photos and details to POST /process_upload, waits on /job_events/<job> for the result,
  // then opens /measurements?job=<job>. Measuring itself takes about 30 seconds.
  const startMeasuring = async (weightKg: number, ageYears: number) => {
    const fail = (message: string) => {
      setMeasuring(false);
      setErrors({ form: message });
      setTimeout(
        () =>
          document
            .querySelector("[data-invalid='true']")
            ?.scrollIntoView({ behavior: "smooth", block: "center" }),
        0,
      );
    };

    const form = new FormData();
    for (const v of VIEWS) form.append(v, photos[v]!.file);
    form.append("height_cm", String(heightCm));
    form.append("weight_kg", String(weightKg));
    form.append("gender", gender);
    form.append("age", String(ageYears));

    setMeasuring(true);
    let jobId: string;
    try {
      ({ job_id: jobId } = await uploadScan(form));
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
    stopWatching.current = watchJob(jobId, {
      ready: () => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles });
        // A new finished scan can be the full body try-on photo (when the user hasn't added their own)
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tryOnPhotos });
        navigate({ to: "/measurements", search: { job: jobId } });
      },
      failed: (message) => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles });
        fail(message);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="mx-auto max-w-5xl px-6 pt-24 pb-24">
        <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
          <span className="h-px w-6 bg-[color:var(--plum)]" /> Body scan
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Upload your photos</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Provide three photos of yourself: front, left side and right side. Then enter your
          details.
        </p>

        <form
          onSubmit={submit}
          noValidate
          className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-card)]"
        >
          {/* Photos */}
          <h2 className="font-display text-2xl">Photos</h2>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {[
              "Whole body in frame, head to feet",
              "Fitted clothes",
              "Plain wall and even light",
              "Arms slightly away from your sides",
            ].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-[color:var(--plum)]" /> {t}
              </li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-3 gap-3 md:gap-5">
            {VIEWS.map((v) => (
              <PhotoSlot
                key={v}
                view={v}
                photo={photos[v]}
                error={errors[v]}
                onFile={(f) => setPhoto(v, f)}
                onRemove={() => removePhoto(v)}
              />
            ))}
          </div>

          {/* Height */}
          <h2 className="mt-12 font-display text-2xl">Height</h2>
          <div className="mt-4 flex flex-col items-center">
            <div className="relative flex items-center gap-2">
              {/* The band across the middle marks the selected row */}
              <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 border-y border-border" />
              <Wheel values={FEET} value={feet} onChange={setFeet} label="Feet" />
              <span className="w-10 text-muted-foreground">ft</span>
              <Wheel values={INCHES} value={inches} onChange={setInches} label="Inches" />
              <span className="w-10 text-muted-foreground">in</span>
            </div>
            <div className="mt-3 text-sm text-muted-foreground tabular-nums">
              {feet}′{inches}″ · {heightCm} cm
            </div>
          </div>

          {/* Details */}
          <div className="mt-12 grid sm:grid-cols-3 gap-5">
            <Field label="Gender" error={errors.gender}>
              <select
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  clearError("gender");
                }}
                className={inputClass(!!errors.gender)}
                aria-invalid={!!errors.gender}
              >
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutral">Neutral / Prefer not to say</option>
              </select>
            </Field>
            <Field label="Weight (kg)" error={errors.weight}>
              <input
                type="number"
                inputMode="decimal"
                min={30}
                max={200}
                step={0.1}
                placeholder="e.g. 72"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  clearError("weight");
                }}
                className={inputClass(!!errors.weight)}
                aria-invalid={!!errors.weight}
              />
            </Field>
            <Field label="Age (years)" error={errors.age}>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                step={1}
                placeholder="e.g. 30"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  clearError("age");
                }}
                className={inputClass(!!errors.age)}
                aria-invalid={!!errors.age}
              />
            </Field>
          </div>

          {errors.form && (
            <p
              className="mt-6 rounded-2xl bg-secondary px-4 py-3 text-sm text-[color:var(--plum)]"
              role="alert"
              data-invalid="true"
            >
              {errors.form}
            </p>
          )}

          <button
            type="submit"
            disabled={measuring}
            className="mt-10 w-full rounded-full bg-primary text-primary-foreground py-4 text-base font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Your photos are only used to estimate your measurements and stay private to your
            account.
          </p>
        </form>
      </main>

      {measuring && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/90 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="text-center px-6">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[color:var(--plum)]" />
            <div className="mt-4 font-display text-2xl">Measuring from your photos…</div>
            <p className="mt-2 text-sm text-muted-foreground">This can take a minute.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Photo slot ────────────────────────────────────────────────────────────────

function PhotoSlot({
  view,
  photo,
  error,
  onFile,
  onRemove,
}: {
  view: ScanView;
  photo?: Photo;
  error?: string;
  onFile: (f: File | undefined) => void;
  onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const label = SCAN_VIEW_LABELS[view];

  return (
    <div data-invalid={!!error}>
      <div
        role="button"
        tabIndex={0}
        aria-label={
          photo ? `Replace ${label.toLowerCase()} photo` : `Upload ${label.toLowerCase()} photo`
        }
        onClick={() => input.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            input.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFile(e.dataTransfer.files?.[0]);
        }}
        className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition outline-none focus-visible:ring-2 focus-visible:ring-ring
          ${photo ? "border border-border" : "border-2 border-dashed"}
          ${
            error
              ? "border-[color:var(--plum)] bg-[color:var(--plum)]/5"
              : dragging
                ? "border-[color:var(--plum)] bg-accent"
                : photo
                  ? ""
                  : "border-border bg-secondary/40 hover:bg-secondary hover:border-[color:var(--plum)]/50"
          }`}
      >
        {photo ? (
          <>
            <img
              src={photo.url}
              alt={`${label} photo`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute bottom-2 left-2 rounded-full bg-black/70 text-white px-3 py-1 text-xs font-medium">
              {label}
            </span>
            <button
              type="button"
              aria-label={`Remove ${label.toLowerCase()} photo`}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
            {view === "front" ? (
              <Camera className="h-6 w-6 text-[color:var(--plum)]" />
            ) : (
              <ImagePlus className="h-6 w-6 text-[color:var(--plum)]" />
            )}
            <div className="mt-2 font-medium text-sm md:text-base">{label}</div>
            <div className="text-xs md:text-sm text-muted-foreground">
              <span className="sm:hidden">Tap to add</span>
              <span className="hidden sm:inline">Click or drop to upload</span>
            </div>
          </div>
        )}
        <input
          ref={input}
          type="file"
          accept={PHOTO_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-2 text-xs text-[color:var(--plum)]">{error}</p>}
    </div>
  );
}

// ── Height wheel (scroll and snap, like an iOS picker) ────────────────────────

const ROW = 48; // px per row; five rows show at once

function Wheel({
  values,
  value,
  onChange,
  label,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [live, setLive] = useState(values.indexOf(value)); // the row in the middle while scrolling

  // Start on the given value (once; after that the wheel owns the scroll position)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = values.indexOf(value) * ROW;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollTo = (i: number) => {
    const idx = Math.max(0, Math.min(values.length - 1, i));
    ref.current?.scrollTo({ top: idx * ROW, behavior: "smooth" });
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      aria-activedescendant={`${label}-${values[live]}`}
      tabIndex={0}
      onScroll={(e) => {
        const idx = Math.max(
          0,
          Math.min(values.length - 1, Math.round(e.currentTarget.scrollTop / ROW)),
        );
        setLive(idx);
        clearTimeout(settle.current);
        settle.current = setTimeout(() => onChange(values[idx]), 120);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          scrollTo(live - 1);
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          scrollTo(live + 1);
        }
      }}
      className="relative w-20 overflow-y-scroll snap-y snap-mandatory outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg
        [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ height: ROW * 5, paddingBlock: ROW * 2 }}
    >
      {values.map((v, i) => {
        const distance = Math.abs(i - live);
        return (
          <div
            key={v}
            id={`${label}-${v}`}
            role="option"
            aria-selected={i === live}
            onClick={() => scrollTo(i)}
            className="snap-center grid place-items-center tabular-nums cursor-pointer transition-all"
            style={{
              height: ROW,
              fontSize: i === live ? 34 : 26,
              fontWeight: i === live ? 500 : 300,
              opacity: [1, 0.45, 0.15][Math.min(distance, 2)],
            }}
          >
            {v}
          </div>
        );
      })}
    </div>
  );
}

// ── Form bits ─────────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" data-invalid={!!error}>
      <span className="block text-sm font-medium mb-2">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-[color:var(--plum)]">{error}</span>}
    </label>
  );
}

function inputClass(invalid: boolean) {
  return `w-full h-12 rounded-xl border bg-background px-4 text-base outline-none transition focus:ring-2 focus:ring-ring
    ${invalid ? "border-[color:var(--plum)] bg-[color:var(--plum)]/5" : "border-border"}`;
}
