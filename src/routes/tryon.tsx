import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { Nav } from "@/components/Nav";
import {
  DropSlot,
  ITEM_SLOTS,
  MAX_IMAGE_BYTES,
  MAX_TOTAL_BYTES,
  PHOTO_TYPES,
  PersonPicker,
  Results,
  base64ToBlob,
  toFile,
  type ItemSlot,
  type Picked,
  type Run,
} from "@/components/tryon-parts";
import { generateTryOn, getTryOnDefaults } from "@/lib/api";
import {
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

const MAX_RESULTS = 4;

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
