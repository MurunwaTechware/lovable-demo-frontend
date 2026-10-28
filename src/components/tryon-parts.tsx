import { Link } from "@tanstack/react-router";
import { Check, Download, ImageUp, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { saveTryOn } from "@/lib/api";
import { QUERY_KEYS, TRY_ON_PHOTO_LABELS, type TryOnPhotoKind } from "@/lib/twin-store";

// Pieces shared by the try-on page (routes/tryon.tsx) and the product try-on dialog
// (components/ProductTryOn.tsx): photo pickers, the before/after result, and the upload limits.

export const MAX_IMAGE_BYTES = 7 * 1024 * 1024; // per image, the backend's limit
export const MAX_TOTAL_BYTES = 14 * 1024 * 1024; // all uploads together
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Same slots, in the same order, as config.GARMENT_SLOTS
export const ITEM_SLOTS = [
  { slot: "top", label: "Top", hint: "Shirt, tee, hoodie" },
  { slot: "bottom", label: "Bottom", hint: "Pants, jeans, shorts" },
  { slot: "headwear", label: "Headwear", hint: "Cap, hat, beanie" },
  { slot: "eyewear", label: "Eyewear", hint: "Glasses, sunglasses" },
] as const;
export type ItemSlot = (typeof ITEM_SLOTS)[number]["slot"];

/** Slot names as shown to the user */
export const SLOT_LABEL: Record<ItemSlot, string> = {
  top: "Top",
  bottom: "Bottom",
  headwear: "Headwear",
  eyewear: "Eyewear",
};

// A photo picked for this try-on: one of the saved try-on photos, or a file uploaded here
export type Picked = { src: string; file: File | null; tag: string };

export type Result = { src: string; blob: Blob; modelText: string | null };
export type Run = {
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
export async function toFile(picked: Picked, name: string): Promise<File> {
  if (picked.file) return picked.file;
  const blob = await (await fetch(picked.src)).blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

/** A base64 image from the backend as a Blob, so it can be shown, downloaded and sent back on Save. */
export function base64ToBlob(data: string, mime: string) {
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

// ── Inputs ────────────────────────────────────────────────────────────────────

export function PersonPicker({
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

export function DropSlot({
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

export function Results({ run, job }: { run: Run; job?: string }) {
  const [current, setCurrent] = useState(0);
  const [pos, setPos] = useState(50);
  const [saving, setSaving] = useState(false);
  // Results already saved, so the same one isn't saved twice
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const result = run.results[current];
  const itemNames = run.items.map((s) => SLOT_LABEL[s]);

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
