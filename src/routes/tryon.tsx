import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Download, ImageUp, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Nav } from "@/components/Nav";
import { generateTryOn, getTryOnDefaults, saveTryOn } from "@/lib/api";
import {
  QUERY_KEYS,
  TRY_ON_PHOTO_KINDS,
  TRY_ON_PHOTO_LABELS,
  useTryOnPhotos,
  type TryOnPhotoKind,
} from "@/lib/twin-store";

// The virtual try-on page, recreated from the backend's /tryon page (static/index.html):
//   GET  /defaults       → the default rules for the textarea
//   POST /try-on         → person + item photos + rules + count → results (base64 images). Nothing is kept.
//   POST /try-on/save    → the chosen result plus what it was made from, into the user's saved try-ons
export const Route = createFileRoute("/tryon")({
  validateSearch: (search: Record<string, unknown>): { job?: string } => ({
    job: typeof search.job === "string" ? search.job : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Virtual try-on · Mannequin AI" },
      {
        name: "description",
        content:
          "Put clothes, headwear and eyewear on your own photo and compare before and after.",
      },
    ],
  }),
  component: TryOnPage,
});

// Same as the backend's prompts.DEFAULT_RULES, shown until GET /defaults answers.
// What to replace is added by the backend from the items sent.
const DEFAULT_RULES =
  "Preserve all facial features, facial expression, hairstyle, skin tone, body proportions, pose, and " +
  "background exactly. Reproduce each item's colour, print, graphics, shape, and cut " +
  "faithfully. The item photos are references only: take nothing from them except " +
  "the specified item, and never let the people wearing them influence the result. " +
  "The only person in the output is the one from the person photo. Change nothing else " +
  "in the image.";

const MAX_IMAGE_BYTES = 7 * 1024 * 1024; // per image, the backend's limit
const MAX_TOTAL_BYTES = 14 * 1024 * 1024; // all uploads together
const MAX_RESULTS = 4;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Same slots, in the same order, as config.GARMENT_SLOTS
const ITEM_SLOTS = [
  { slot: "top", label: "Top", hint: "Shirt, tee, hoodie" },
  { slot: "bottom", label: "Bottom", hint: "Pants, jeans, shorts" },
  { slot: "headwear", label: "Headwear", hint: "Cap, hat, beanie" },
  { slot: "eyewear", label: "Eyewear", hint: "Glasses, sunglasses" },
] as const;
type ItemSlot = (typeof ITEM_SLOTS)[number]["slot"];

// A photo picked for this try-on: one of the saved try-on photos, or a file uploaded here
type Picked = { src: string; file: File | null; tag: string };

type Result = { src: string; blob: Blob; modelText: string | null };
type Run = {
  id: number;
  results: Result[];
  failed: { count: number; error: string } | null; // variations the model didn't return
  model: string;
  personSrc: string;
  items: ItemSlot[];
  // A snapshot of what was sent, so Save sends exactly what these results were made from
  sent: { person: File; items: Partial<Record<ItemSlot, File>>; prompt: string };
};

/** The photo as a file to upload. Saved try-on photos are addresses, so they're fetched first. */
async function toFile(picked: Picked, name: string): Promise<File> {
  if (picked.file) return picked.file;
  const blob = await (await fetch(picked.src)).blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

/** A base64 image from the backend as a Blob, so it can be shown, downloaded and sent back on Save. */
function base64ToBlob(data: string, mime: string) {
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

function TryOnPage() {
  const { job } = Route.useSearch();
  const tryOnPhotos = useTryOnPhotos();
  const defaults = useQuery({ queryKey: ["tryon-defaults"], queryFn: getTryOnDefaults });
  const defaultRules = defaults.data?.prompt ?? DEFAULT_RULES;
  const maxResults = defaults.data?.max_outputs ?? MAX_RESULTS;

  // Start with the user's saved full body photo, as the twin page promises
  const saved = TRY_ON_PHOTO_KINDS.filter((k) => tryOnPhotos[k]);
  const [personSource, setPersonSource] = useState<TryOnPhotoKind | "upload" | null>(
    saved[0] ?? null,
  );
  const [uploadedPerson, setUploadedPerson] = useState<Picked | null>(null);
  const [items, setItems] = useState<Partial<Record<ItemSlot, Picked>>>({});
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [count, setCount] = useState(1);
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({ text: "" });
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<Run | null>(null);

  const objectUrls = useRef<string[]>([]);
  const resultRef = useRef<HTMLElement>(null);
  // On phones the result sits below the form, so bring it into view when it arrives
  useEffect(() => {
    if (run) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [run]);
  useEffect(() => () => objectUrls.current.forEach((u) => URL.revokeObjectURL(u)), []);
  // Use the backend's rules once they arrive, unless the user has already started editing
  useEffect(() => {
    if (defaults.data) setRules((r) => (r === DEFAULT_RULES ? defaults.data.prompt : r));
  }, [defaults.data]);

  const person: Picked | null =
    personSource === "upload"
      ? uploadedPerson
      : personSource && tryOnPhotos[personSource]
        ? {
            src: tryOnPhotos[personSource]!.src,
            file: null,
            tag: `Your ${TRY_ON_PHOTO_LABELS[personSource].toLowerCase()} photo`,
          }
        : null;
  const chosenItems = ITEM_SLOTS.filter(({ slot }) => items[slot]).map(({ slot }) => slot);
  const canGenerate = !!person && chosenItems.length > 0 && !busy;

  /** Checks a dropped or chosen file and returns it as a preview, or null with the error shown. */
  const accept = (file: File | undefined, name: string, tag: string): Picked | null => {
    if (!file) return null;
    if (!PHOTO_TYPES.includes(file.type)) {
      setStatus({ text: `${name} photo must be a JPEG, PNG or WebP.`, error: true });
      return null;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setStatus({ text: "That image is over 7 MB. Resize it and try again.", error: true });
      return null;
    }
    setStatus({ text: "" });
    const src = URL.createObjectURL(file);
    objectUrls.current.push(src);
    return { src, file, tag };
  };

  const generate = async () => {
    if (!person) return;
    const uploads = [person, ...chosenItems.map((s) => items[s]!)];
    const total = uploads.reduce((sum, p) => sum + (p.file?.size ?? 0), 0);
    if (total > MAX_TOTAL_BYTES) {
      setStatus({
        text: "The photos together are over 14 MB. Resize one or more and try again.",
        error: true,
      });
      return;
    }

    setBusy(true);
    const started = Date.now();
    const tick = setInterval(
      () => setStatus({ text: `Generating… ${Math.round((Date.now() - started) / 1000)}s` }),
      500,
    );
    try {
      const sent = {
        person: await toFile(person, "person.jpg"),
        items: Object.fromEntries(
          chosenItems.map((s) => [s, items[s]!.file!]),
        ) as Run["sent"]["items"],
        prompt: rules,
      };
      const form = new FormData();
      form.append("person", sent.person);
      for (const [slot, file] of Object.entries(sent.items)) form.append(slot, file);
      form.append("prompt", sent.prompt);
      form.append("count", String(count));

      const payload = await generateTryOn(form);
      const ok = payload.results.flatMap((r) => (r.ok ? [r] : []));
      const failed = payload.results.flatMap((r) => (r.ok ? [] : [r]));
      const results = ok.map((r) => {
        const blob = base64ToBlob(r.data, r.mime_type);
        const src = URL.createObjectURL(blob);
        objectUrls.current.push(src);
        return { src, blob, modelText: r.model_text };
      });
      const seconds = Math.round((Date.now() - started) / 1000);
      setRun({
        id: Date.now(),
        results,
        failed: failed.length ? { count: failed.length, error: failed[0].error } : null,
        model: payload.model,
        personSrc: person.src,
        items: chosenItems,
        sent,
      });
      setStatus({ text: `Done in ${seconds}s.` });
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : "Try-on failed.", error: true });
    } finally {
      clearInterval(tick);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
        {job && (
          <div className="mb-3">
            <Link
              to="/measurements"
              search={{ job }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to measurements
            </Link>
          </div>
        )}
        <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
          <span className="h-px w-6 bg-[color:var(--plum)]" /> Your Digital Twin
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Virtual try-on</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Choose a photo of yourself, then add any mix of a top, a bottom, headwear and eyewear.
          Adjust the rules if you want, and generate.
        </p>

        <div className="mt-10 grid lg:grid-cols-[360px_1fr] gap-8 items-start">
          {/* Inputs */}
          <section className="space-y-5" aria-label="Photos and settings">
            <PersonPicker
              person={person}
              source={personSource}
              saved={saved}
              savedSrc={(k) => tryOnPhotos[k]?.src ?? ""}
              onUseSaved={setPersonSource}
              onUpload={(file) => {
                const picked = accept(file, "Person", "Uploaded photo");
                if (picked) {
                  setUploadedPerson(picked);
                  setPersonSource("upload");
                }
              }}
            />

            <div className="grid grid-cols-2 gap-3">
              {ITEM_SLOTS.map(({ slot, label, hint }) => (
                <DropSlot
                  key={slot}
                  label={label}
                  hint={hint}
                  picked={items[slot] ?? null}
                  square
                  onFile={(file) => {
                    const picked = accept(file, label, label);
                    if (picked) setItems((it) => ({ ...it, [slot]: picked }));
                  }}
                  onRemove={() =>
                    setItems((it) => {
                      const next = { ...it };
                      delete next[slot];
                      return next;
                    })
                  }
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Add at least one. For a bottom, the person photo needs to show their legs; for
              headwear or eyewear, their face.
            </p>

            <div>
              <label htmlFor="rules" className="block text-sm font-medium">
                Rules for every try-on
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                What to replace is added automatically from the items you add.
              </p>
              <textarea
                id="rules"
                rows={6}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring resize-y"
              />
              <button
                type="button"
                onClick={() => setRules(defaultRules)}
                disabled={rules === defaultRules}
                className="mt-1 text-sm text-[color:var(--plum)] hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                Reset to default
              </button>
            </div>

            <div className="flex gap-3">
              <select
                aria-label="Number of variations"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="h-12 rounded-full border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {Array.from({ length: maxResults }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "result" : "results"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void generate()}
                disabled={!canGenerate}
                className="flex-1 h-12 rounded-full bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate try-on
              </button>
            </div>
            <p
              role="status"
              aria-live="polite"
              className={`min-h-6 text-sm ${status.error ? "text-[color:var(--plum)]" : "text-muted-foreground"}`}
            >
              {status.text}
            </p>
          </section>

          {/* Result */}
          <section
            ref={resultRef}
            aria-label="Result"
            className="rounded-3xl border border-border bg-card p-4 md:p-6 shadow-[var(--shadow-card)] min-h-[480px] grid place-items-center"
          >
            {busy ? (
              <div className="text-center text-muted-foreground">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[color:var(--plum)]" />
                <p className="mt-4">Putting it on you… this usually takes 10–30 seconds.</p>
              </div>
            ) : run ? (
              <Results key={run.id} run={run} job={job} />
            ) : (
              <p className="max-w-xs text-center text-muted-foreground">
                Choose a photo of yourself and at least one item, then generate. The result appears
                here with a slider to compare it against your photo.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// ── Inputs ────────────────────────────────────────────────────────────────────

function PersonPicker({
  person,
  source,
  saved,
  savedSrc,
  onUseSaved,
  onUpload,
}: {
  person: Picked | null;
  source: TryOnPhotoKind | "upload" | null;
  saved: TryOnPhotoKind[];
  savedSrc: (k: TryOnPhotoKind) => string;
  onUseSaved: (k: TryOnPhotoKind) => void;
  onUpload: (file: File | undefined) => void;
}) {
  return (
    <div>
      <DropSlot
        label="Person photo"
        hint="Drop or click to choose. JPEG, PNG or WebP, under 7 MB."
        picked={person}
        onFile={onUpload}
      />
      {saved.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Your photos:</span>
          {saved.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onUseSaved(k)}
              aria-pressed={source === k}
              aria-label={`Use your ${TRY_ON_PHOTO_LABELS[k].toLowerCase()} photo`}
              title={`Use your ${TRY_ON_PHOTO_LABELS[k].toLowerCase()} photo`}
              className={`relative h-14 w-11 rounded-lg overflow-hidden border-2 transition ${
                source === k
                  ? "border-[color:var(--plum)]"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={savedSrc(k)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          <Link
            to="/twin"
            hash="tryon-photo"
            className="ml-auto text-xs text-[color:var(--plum)] hover:underline"
          >
            Manage
          </Link>
        </div>
      )}
    </div>
  );
}

function DropSlot({
  label,
  hint,
  picked,
  square = false,
  onFile,
  onRemove,
}: {
  label: string;
  hint: string;
  picked: Picked | null;
  square?: boolean;
  onFile: (file: File | undefined) => void;
  onRemove?: () => void;
}) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`relative ${square ? "aspect-square" : "aspect-[4/3]"} rounded-2xl overflow-hidden border-2 transition focus-within:ring-2 focus-within:ring-ring ${
        picked
          ? "border-solid border-border bg-secondary"
          : `border-dashed bg-card ${over ? "border-[color:var(--plum)]" : "border-border hover:border-[color:var(--plum)]/60"}`
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFile(e.dataTransfer.files[0]);
      }}
    >
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="absolute inset-0 grid place-items-center p-3 text-center outline-none"
        aria-label={picked ? `Replace ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
      >
        {picked ? (
          <img src={picked.src} alt="" className="absolute inset-0 h-full w-full object-contain" />
        ) : (
          <span>
            <ImageUp className="mx-auto h-5 w-5 text-[color:var(--plum)]" />
            <span className="mt-1.5 block text-sm font-medium">{label}</span>
            <span className="block text-xs text-muted-foreground">{hint}</span>
          </span>
        )}
      </button>
      {picked && (
        <span className="absolute left-2 top-2 rounded-full glass bg-white/85 px-2.5 py-0.5 text-[11px] font-medium text-foreground pointer-events-none">
          {picked.tag}
        </span>
      )}
      {picked && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label.toLowerCase()}`}
          className="absolute right-2 top-2 h-7 w-7 grid place-items-center rounded-full bg-foreground/80 text-background hover:bg-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
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
  );
}

// ── Results ───────────────────────────────────────────────────────────────────

function Results({ run, job }: { run: Run; job?: string }) {
  const [current, setCurrent] = useState(0);
  const [pos, setPos] = useState(50);
  const [saving, setSaving] = useState(false);
  // Results already saved, so the same one isn't saved twice
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const result = run.results[current];
  const itemNames = run.items.map((s) => ITEM_SLOTS.find((i) => i.slot === s)!.label);

  // Generating keeps nothing on the server, so Save sends the chosen result back with what it was
  // made from, and the measurement profile (job) the page was opened from
  const save = async () => {
    const i = current;
    setSaving(true);
    setSaveError(null);
    try {
      const form = new FormData();
      form.append("result", new File([result.blob], "result", { type: result.blob.type }));
      form.append("person", run.sent.person);
      for (const [slot, file] of Object.entries(run.sent.items)) form.append(slot, file);
      form.append("prompt", run.sent.prompt);
      if (job) form.append("job", job);
      await saveTryOn(form);
      setSaved((s) => new Set(s).add(i));
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.savedTryOns });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  const isSaved = saved.has(current);

  return (
    <div className="w-full">
      {/* Before / after: drag across to compare */}
      <div className="relative w-full h-[min(72vh,640px)] select-none touch-none rounded-2xl overflow-hidden bg-secondary">
        <img
          src={run.personSrc}
          alt="Your original photo"
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain"
        />
        <img
          src={result.src}
          alt="Try-on result"
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain bg-secondary"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)] pointer-events-none"
          style={{ left: `${pos}%` }}
        >
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white border-2 border-[color:var(--plum)] shadow" />
        </div>
        <span className="absolute bottom-3 left-3 rounded-full glass bg-white/85 px-3 py-1 text-[11px] font-medium text-foreground pointer-events-none">
          Original
        </span>
        <span className="absolute bottom-3 right-3 rounded-full glass bg-white/85 px-3 py-1 text-[11px] font-medium text-foreground pointer-events-none">
          Try-on
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Compare your original photo and the try-on"
          className="absolute inset-0 h-full w-full opacity-0 cursor-ew-resize m-0"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        {run.results.length > 1 ? (
          <div className="flex gap-2" role="group" aria-label="Variations">
            {run.results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-pressed={i === current}
                aria-label={`Show result ${i + 1}`}
                className={`h-[72px] w-14 rounded-lg overflow-hidden border-2 transition ${
                  i === current
                    ? "border-[color:var(--plum)]"
                    : "border-border opacity-70 hover:opacity-100"
                }`}
              >
                <img src={r.src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <span className="text-sm text-muted-foreground">
          {itemNames.join(" + ")} · {run.model}
        </span>
        <div className="flex items-center gap-4">
          <a
            href={result.src}
            download={`tryon-result-${current + 1}.${result.blob.type.split("/")[1] ?? "png"}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--plum)] hover:underline"
          >
            <Download className="h-4 w-4" /> Download
          </a>
          <button
            type="button"
            onClick={() => void save()}
            disabled={isSaved || saving}
            className="rounded-full bg-primary text-primary-foreground px-5 h-10 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : isSaved ? (
              <>
                <Check className="h-4 w-4" /> Saved
              </>
            ) : (
              "Save to my account"
            )}
          </button>
        </div>
      </div>
      {isSaved && (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          Saved{job ? " with this measurement profile" : ""}. Find it in{" "}
          <Link to="/twin" hash="tryons" className="text-[color:var(--plum)] hover:underline">
            Your twin → Saved try-ons
          </Link>
          .
        </p>
      )}
      {saveError && (
        <p className="mt-3 text-sm text-[color:var(--plum)]" role="alert">
          {saveError}
        </p>
      )}
      {result.modelText && (
        <p className="mt-2 text-xs text-muted-foreground">Model said: {result.modelText}</p>
      )}
      {run.failed && (
        <p className="mt-2 text-sm text-[color:var(--plum)]">
          {run.failed.count} of {run.failed.count + run.results.length} variations failed:{" "}
          {run.failed.error}
        </p>
      )}
    </div>
  );
}
