import { Loader2, Shirt, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  MAX_IMAGE_BYTES,
  MAX_TOTAL_BYTES,
  PHOTO_TYPES,
  PersonPicker,
  Results,
  base64ToBlob,
  toFile,
  type Picked,
  type Run,
} from "@/components/tryon-parts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateTryOn, getTryOnDefaults } from "@/lib/api";
import { productImageUrl, type ApiProductDetail } from "@/lib/products-api";
import { tryOnPlanFor, type TryOnPlan } from "@/lib/tryon-slot";
import {
  TRY_ON_PHOTO_KINDS,
  TRY_ON_PHOTO_LABELS,
  useTryOnPhotos,
  type TryOnPhotoKind,
} from "@/lib/twin-store";

/**
 * "Try it on" for a product page: a button that opens the try-on in a dialog. The slot (top or bottom)
 * and a hint for the model come from the product's category (lib/tryon-slot.ts), so there are no item
 * blocks to fill in: you choose your photo and which of the product's photos to use, then generate.
 * Kids' products get no button.
 */
export function ProductTryOn({ product }: { product: ApiProductDetail }) {
  const [open, setOpen] = useState(false);
  const plan = tryOnPlanFor(product);
  if (!plan) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-full border border-[color:var(--plum)] text-[color:var(--plum)] py-3.5 text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[color:var(--plum)]/5 transition"
      >
        <Sparkles className="h-4 w-4" /> Try it on
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 md:p-8">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl md:text-3xl">Try it on</DialogTitle>
            <DialogDescription>
              {product.brand ? `${product.brand} · ` : ""}
              {product.name} · goes on as your {plan.label}
            </DialogDescription>
          </DialogHeader>
          {/* Only mounted while open, so each time it opens it starts fresh */}
          <TryOnPanel product={product} plan={plan} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function TryOnPanel({ product, plan }: { product: ApiProductDetail; plan: TryOnPlan }) {
  const { slot } = plan;
  const { photos: tryOnPhotos } = useTryOnPhotos(); // null until loaded
  const defaults = useQuery({ queryKey: ["tryon-defaults"], queryFn: getTryOnDefaults });

  // The product's own photos. The products API serves the n-th one, so this is its index in that list.
  const images = product.images ?? [];
  const [imageIdx, setImageIdx] = useState(0);

  // Their try-on photos (each is theirs, or a sample where they have none). Until they choose,
  // the full body photo is used, once it has loaded.
  const saved = tryOnPhotos ? TRY_ON_PHOTO_KINDS : [];
  const [chosen, setChosen] = useState<TryOnPhotoKind | "upload" | null>(null);
  const personSource = chosen ?? (tryOnPhotos ? "full_body" : null);
  const [uploadedPerson, setUploadedPerson] = useState<Picked | null>(null);
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({ text: "" });
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<Run | null>(null);

  const objectUrls = useRef<string[]>([]);
  const resultRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (run) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [run]);
  useEffect(() => () => objectUrls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const person: Picked | null =
    personSource === "upload"
      ? uploadedPerson
      : personSource && tryOnPhotos
        ? {
            src: tryOnPhotos[personSource].src,
            file: null,
            tag:
              tryOnPhotos[personSource].source === "sample"
                ? `Sample ${TRY_ON_PHOTO_LABELS[personSource].toLowerCase()} photo`
                : `Your ${TRY_ON_PHOTO_LABELS[personSource].toLowerCase()} photo`,
          }
        : null;
  const canGenerate = !!person && images.length > 0 && !busy;

  const acceptPerson = (file: File | undefined) => {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setStatus({ text: "Your photo must be a JPEG, PNG or WebP.", error: true });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setStatus({ text: "That image is over 7 MB. Resize it and try again.", error: true });
      return;
    }
    setStatus({ text: "" });
    const src = URL.createObjectURL(file);
    objectUrls.current.push(src);
    setUploadedPerson({ src, file, tag: "Uploaded photo" });
    setChosen("upload");
  };

  const generate = async () => {
    if (!person) return;
    setBusy(true);
    const started = Date.now();
    const tick = setInterval(
      () => setStatus({ text: `Generating… ${Math.round((Date.now() - started) / 1000)}s` }),
      500,
    );
    try {
      // The chosen product photo, as a file to upload
      const photoRes = await fetch(productImageUrl(product.id, imageIdx));
      if (!photoRes.ok) {
        const detail = await photoRes.json().then(
          (d) => d?.detail,
          () => null,
        );
        throw new Error(
          typeof detail === "string"
            ? detail
            : "Couldn't load the product photo. Is the products service running?",
        );
      }
      const photoBlob = await photoRes.blob();
      const item = new File([photoBlob], `${slot}.jpg`, { type: photoBlob.type || "image/jpeg" });
      const personFile = await toFile(person, "person.jpg");
      if (personFile.size + item.size > MAX_TOTAL_BYTES) {
        throw new Error("The photos together are over 14 MB. Use a smaller photo of yourself.");
      }

      // The backend's default rules, plus what the garment is (from its category) so the model knows.
      // The prompt can't be left empty to mean "the defaults" here: it would then lose them.
      const rules = defaults.data?.prompt ?? (await getTryOnDefaults()).prompt;
      const sent = {
        person: personFile,
        items: { [slot]: item },
        prompt: `${rules} ${plan.promptHint}`,
      };
      const form = new FormData();
      form.append("person", sent.person);
      form.append(slot, item);
      form.append("prompt", sent.prompt);
      form.append("count", "1");

      const payload = await generateTryOn(form);
      const ok = payload.results.flatMap((r) => (r.ok ? [r] : []));
      const failed = payload.results.flatMap((r) => (r.ok ? [] : [r]));
      const results = ok.map((r) => {
        const blob = base64ToBlob(r.data, r.mime_type);
        const src = URL.createObjectURL(blob);
        objectUrls.current.push(src);
        return { src, blob, modelText: r.model_text };
      });
      setRun({
        id: Date.now(),
        results,
        failed: failed.length ? { count: failed.length, error: failed[0].error } : null,
        model: payload.model,
        personSrc: person.src,
        items: [slot],
        sent,
      });
      setStatus({ text: `Done in ${Math.round((Date.now() - started) / 1000)}s.` });
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : "Try-on failed.", error: true });
    } finally {
      clearInterval(tick);
      setBusy(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
      {/* Inputs */}
      <section className="space-y-5" aria-label="Photos">
        <PersonPicker
          person={person}
          source={personSource}
          saved={saved}
          savedSrc={(k) => tryOnPhotos?.[k].src ?? ""}
          onUseSaved={setChosen}
          onUpload={acceptPerson}
        />

        <div>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Shirt className="h-4 w-4 text-[color:var(--plum)]" /> Product photo
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{plan.photoHint}</p>
          {images.length > 0 ? (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {images.slice(0, 8).map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImageIdx(i)}
                  aria-pressed={i === imageIdx}
                  aria-label={`Use product photo ${i + 1}`}
                  className={`relative aspect-[4/5] rounded-xl overflow-hidden bg-secondary transition ${
                    i === imageIdx
                      ? "ring-2 ring-[color:var(--plum)] ring-offset-2 ring-offset-background"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[color:var(--plum)]">
              This product has no photos to try on.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void generate()}
          disabled={!canGenerate}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {run ? "Generate again" : "Generate try-on"}
        </button>
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
        className="rounded-3xl border border-border bg-card p-4 md:p-5 min-h-[420px] grid place-items-center"
      >
        {busy ? (
          <div className="text-center text-muted-foreground">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[color:var(--plum)]" />
            <p className="mt-4">Putting it on you… this usually takes 10–30 seconds.</p>
          </div>
        ) : run ? (
          <Results key={run.id} run={run} />
        ) : (
          <p className="max-w-xs text-center text-muted-foreground">
            Pick your photo and the product photo that shows it best, then generate. The result
            appears here with a slider to compare it against your photo.
          </p>
        )}
      </section>
    </div>
  );
}
