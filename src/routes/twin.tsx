import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ScanLine,
  Ruler,
  Shirt,
  Info,
  Download,
  ArrowRight,
  AlertTriangle,
  Maximize2,
  Store,
  ChevronLeft,
  ChevronRight,
  ImageUp,
  UserRound,
  Check,
} from "lucide-react";

import twinImg from "@/assets/twin.jpg";
import { Nav } from "@/components/Nav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MEASUREMENT_GROUPS,
  SCAN_VIEW_LABELS,
  TRY_ON_PHOTO_KINDS,
  TRY_ON_PHOTO_LABELS,
  describeInputs,
  formatDate,
  useTwin,
  type MeasurementProfile,
  type SavedTryOn,
  type ScanPhoto,
  type TryOnPhotoKind,
  type TryOnPhotos,
} from "@/lib/twin-store";

export const Route = createFileRoute("/twin")({
  head: () => ({
    meta: [
      { title: "Your Digital Twin — Measurements & Try-ons · Mannequin AI" },
      {
        name: "description",
        content:
          "Your latest body measurements from your scan, earlier measurement profiles, and every virtual try-on you've saved.",
      },
      { property: "og:title", content: "Your Digital Twin · Mannequin AI" },
      {
        property: "og:description",
        content: "Your measurements and saved virtual try-ons in one place.",
      },
    ],
  }),
  component: TwinPage,
});

function TwinPage() {
  const { profiles, latest, tryOns, tryOnPhotos } = useTwin();
  const earlier = profiles.filter((p) => p !== latest);
  // The ready profile before the latest one, to show what changed since
  const previous = earlier.find((p) => p.status === "ready") ?? null;

  const [openTryOn, setOpenTryOn] = useState<SavedTryOn | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="mx-auto max-w-7xl px-6 pt-24 pb-24">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>Your Digital Twin</Kicker>
            <h1 className="mt-3 font-display text-4xl md:text-5xl">
              Your measurements. <span className="italic">Your looks.</span>
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              The latest measurements from your body scan, the profiles before it, and every try-on
              you've saved.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/stores"
              className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2 hover:bg-accent"
            >
              <Store className="h-4 w-4" /> Browse stores
            </Link>
            <Link
              to="/scan"
              className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2"
            >
              <ScanLine className="h-4 w-4" /> New scan
            </Link>
          </div>
        </div>

        {/* In-page sections */}
        <nav className="mt-8 flex flex-wrap gap-2 text-xs font-medium" aria-label="Sections">
          {[
            ["#measurements", "Latest measurements"],
            ["#tryon-photo", "Try-on photos"],
            ["#tryons", `Saved try-ons (${tryOns.length})`],
            ["#profiles", `Earlier profiles (${earlier.length})`],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-border bg-card px-4 py-2 hover:bg-accent"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Latest measurements */}
        <section id="measurements" className="mt-10 scroll-mt-24">
          <SectionTitle icon={<Ruler className="h-4 w-4" />} title="Latest measurements" />
          {latest ? <LatestCard profile={latest} previous={previous} /> : <EmptyMeasurements />}
        </section>

        {/* The person photo try-ons use by default */}
        <section id="tryon-photo" className="mt-20 scroll-mt-24">
          <SectionTitle
            icon={<UserRound className="h-4 w-4" />}
            title="Your try-on photos"
            hint="Every try-on uses these unless you choose others."
          />
          <TryOnPhotoCard initial={tryOnPhotos} />
        </section>

        {/* Saved try-ons */}
        <section id="tryons" className="mt-20 scroll-mt-24">
          <SectionTitle
            icon={<Shirt className="h-4 w-4" />}
            title="Saved try-ons"
            hint="Newest first. Open one to see it full size."
          />
          {tryOns.length ? (
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tryOns.map((t) => (
                <TryOnCard
                  key={t.savedId}
                  tryOn={t}
                  profiles={profiles}
                  onOpen={() => setOpenTryOn(t)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Shirt className="h-5 w-5" />}
              title="No saved try-ons yet"
              text="Try something on from any store, then save the result you like. It'll appear here."
              action={
                <Link
                  to="/stores"
                  className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2"
                >
                  <Store className="h-4 w-4" /> Browse stores
                </Link>
              }
            />
          )}
        </section>

        {/* Earlier profiles */}
        <section id="profiles" className="mt-20 scroll-mt-24">
          <SectionTitle
            icon={<ScanLine className="h-4 w-4" />}
            title="Earlier profiles"
            hint="Each scan makes a profile. Older ones stay here so you can see how things change."
          />
          {earlier.length ? (
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {earlier.map((p) => (
                <ProfileCard key={p.jobId} profile={p} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Your earlier scans will appear here.
            </p>
          )}
        </section>
      </main>

      <TryOnDialog tryOn={openTryOn} profiles={profiles} onClose={() => setOpenTryOn(null)} />
    </div>
  );
}

// ── Latest measurements ───────────────────────────────────────────────────────

function LatestCard({
  profile,
  previous,
}: {
  profile: MeasurementProfile;
  previous: MeasurementProfile | null;
}) {
  return (
    <div className="mt-6 grid lg:grid-cols-[340px_1fr] rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <ScanPhotos photos={profile.photos} date={formatDate(profile.created)} />

      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{describeInputs(profile.inputs)}</div>
            {profile.bodyShape && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip>{profile.bodyShape.build} build</Chip>
                <Chip>Torso {profile.bodyShape.torsoPercent}% of height</Chip>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/measurements"
              search={{ job: profile.jobId }}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2 hover:bg-accent"
            >
              <Ruler className="h-4 w-4" /> Full results
            </Link>
            <Link
              to="/stores"
              className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2"
            >
              Try clothes on <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {profile.measurementsCm && (
          <MeasurementGroups values={profile.measurementsCm} previous={previous?.measurementsCm} />
        )}

        {previous && (
          <p className="mt-4 text-xs text-muted-foreground">
            Small figures show the change since your scan on {formatDate(previous.created)}.
          </p>
        )}

        {!!profile.warnings?.length && (
          <div className="mt-6 rounded-2xl bg-secondary p-4 text-sm flex gap-3">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-[color:var(--plum)]" />
            <div>
              <div className="font-medium">What affected accuracy</div>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {profile.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          AI estimates from your photos, not tailor measurements. In centimetres.
        </p>
      </div>
    </div>
  );
}

function MeasurementGroups({
  values,
  previous,
}: {
  values: NonNullable<MeasurementProfile["measurementsCm"]>;
  previous?: MeasurementProfile["measurementsCm"];
}) {
  return (
    <div className="mt-8 grid md:grid-cols-3 gap-x-8 gap-y-6">
      {MEASUREMENT_GROUPS.map((g) => (
        <div key={g.title}>
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
            {g.title}
          </div>
          <dl className="mt-2">
            {g.keys.map(({ key, label }) => {
              const delta = previous ? Math.round((values[key] - previous[key]) * 10) / 10 : 0;
              return (
                <div
                  key={key}
                  className="flex items-baseline justify-between gap-3 py-2 border-b border-dashed border-border text-sm"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="tabular-nums">
                    <span className="font-medium">{values[key].toFixed(1)}</span>
                    <span className="text-muted-foreground"> cm</span>
                    {Math.abs(delta) >= 0.5 && (
                      <span className="ml-2 text-[11px] text-[color:var(--plum)]">
                        {delta > 0 ? "+" : "−"}
                        {Math.abs(delta).toFixed(1)}
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </div>
  );
}

function EmptyMeasurements() {
  return (
    <div className="mt-6 grid md:grid-cols-[280px_1fr] rounded-3xl border border-border bg-card overflow-hidden">
      <div
        className="relative aspect-[4/5] md:aspect-auto"
        style={{ background: "var(--gradient-plum)" }}
      >
        <img
          src={twinImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover mix-blend-screen opacity-90 blur-sm"
        />
      </div>
      <div className="p-8 flex flex-col justify-center">
        <h3 className="font-display text-2xl">No measurements yet</h3>
        <p className="mt-2 text-muted-foreground max-w-md">
          Take three photos (front, left and right) and your measurements will appear here.
        </p>
        <Link
          to="/scan"
          className="mt-6 self-start rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2"
        >
          <ScanLine className="h-4 w-4" /> Start scan
        </Link>
      </div>
    </div>
  );
}

function ScanPhotos({ photos, date }: { photos: ScanPhoto[]; date: string }) {
  return (
    <PhotoCarousel
      ariaLabel="The three photos from this scan"
      className="aspect-[3/4] lg:aspect-auto lg:min-h-[520px]"
      corner={date}
      slides={photos.map((p) => ({
        key: p.view,
        label: SCAN_VIEW_LABELS[p.view],
        content: (
          <img
            src={p.src}
            alt={`${SCAN_VIEW_LABELS[p.view]} photo from this scan`}
            draggable={false}
            className="h-full w-full object-cover"
          />
        ),
      }))}
    />
  );
}

type Slide = { key: string; label: string; content: React.ReactNode };

/** Photos side by side with arrows, dots, swipe and arrow keys. Pass index to control it from outside. */
function PhotoCarousel({
  slides,
  ariaLabel,
  className = "",
  corner,
  compact = false,
  index: controlled,
  onIndexChange,
}: {
  slides: Slide[];
  ariaLabel: string;
  className?: string;
  corner?: React.ReactNode;
  compact?: boolean;
  index?: number;
  onIndexChange?: (i: number) => void;
}) {
  const [own, setOwn] = useState(0);
  const index = controlled ?? own;
  const touchX = useRef<number | null>(null);
  const go = (i: number) => {
    const next = (i + slides.length) % slides.length;
    if (onIndexChange) onIndexChange(next);
    else setOwn(next);
  };
  const current = slides[index];
  const arrow = `absolute top-1/2 -translate-y-1/2 grid place-items-center rounded-full glass bg-white/80 text-foreground shadow-sm hover:bg-white ${
    compact ? "h-8 w-8" : "h-10 w-10"
  }`;

  return (
    <div
      className={`relative bg-secondary overflow-hidden select-none ${className}`}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? index + 1 : index - 1);
        touchX.current = null;
      }}
    >
      {/* All slides stay in the page and slide, so switching doesn't flash while an image loads */}
      <div
        className="absolute inset-0 flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div key={s.key} className="h-full w-full shrink-0" aria-hidden={i !== index}>
            {s.content}
          </div>
        ))}
      </div>

      {corner && (
        <div className="absolute top-3 left-3 glass bg-white/80 rounded-full px-3 py-1 text-[11px] font-medium text-foreground">
          {corner}
        </div>
      )}
      <div
        className="absolute top-3 right-3 glass bg-white/80 rounded-full px-3 py-1 text-[11px] font-medium text-foreground"
        aria-live="polite"
      >
        {current.label} · {index + 1}/{slides.length}
      </div>

      <button
        onClick={() => go(index - 1)}
        aria-label="Previous photo"
        className={`${arrow} left-3`}
      >
        <ChevronLeft className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </button>
      <button onClick={() => go(index + 1)} aria-label="Next photo" className={`${arrow} right-3`}>
        <ChevronRight className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </button>

      <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.key}
            onClick={() => go(i)}
            aria-label={`Show ${s.label.toLowerCase()} photo`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all shadow-sm ${i === index ? "w-6 bg-white" : "w-2 bg-white/55 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Try-on photos ─────────────────────────────────────────────────────────────

const MAX_PHOTO_BYTES = 7 * 1024 * 1024; // the backend's limit per image
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const PHOTO_GUIDE: Record<TryOnPhotoKind, { use: string; tips: string[] }> = {
  full_body: {
    use: "For clothes, shoes and bags",
    tips: [
      "Head to feet in the frame",
      "Standing straight, facing the camera",
      "Plain background and even light",
      "Fitted clothes, so garments sit right",
    ],
  },
  close_up: {
    use: "For hats, sunglasses and earrings",
    tips: [
      "Head and shoulders in the frame",
      "Facing the camera, hair off your face",
      "No hat or glasses on",
      "Even light, no strong shadows",
    ],
  },
};

function TryOnPhotoCard({ initial }: { initial: TryOnPhotos }) {
  // Demo: new photos are only shown on this page until it's reloaded. Saving them needs the backend.
  const [photos, setPhotos] = useState<TryOnPhotos>(initial);
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<TryOnPhotoKind, string>>>({});
  const input = useRef<HTMLInputElement>(null);
  const uploading = useRef<TryOnPhotoKind>("full_body");
  const objectUrls = useRef<Partial<Record<TryOnPhotoKind, string>>>({});

  useEffect(
    () => () => {
      Object.values(objectUrls.current).forEach((u) => u && URL.revokeObjectURL(u));
    },
    [],
  );

  const added = TRY_ON_PHOTO_KINDS.filter((k) => photos[k]).length;
  const show = (kind: TryOnPhotoKind) => setIndex(TRY_ON_PHOTO_KINDS.indexOf(kind));

  const pick = (kind: TryOnPhotoKind) => {
    uploading.current = kind;
    show(kind);
    input.current?.click();
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const kind = uploading.current;
    const fail = (message: string) => setErrors((e) => ({ ...e, [kind]: message }));
    if (!PHOTO_TYPES.includes(file.type)) return fail("Use a JPEG, PNG or WebP photo.");
    if (file.size > MAX_PHOTO_BYTES)
      return fail("That photo is over 7 MB. Resize it and try again.");
    setErrors((e) => ({ ...e, [kind]: undefined }));
    const old = objectUrls.current[kind];
    if (old) URL.revokeObjectURL(old);
    const url = URL.createObjectURL(file);
    objectUrls.current[kind] = url;
    setPhotos((p) => ({ ...p, [kind]: { src: url, updated: new Date().toISOString() } }));
  };

  return (
    <div className="mt-6 grid sm:grid-cols-[260px_1fr] gap-6 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <PhotoCarousel
        compact
        ariaLabel="Your try-on photos"
        className="aspect-[3/4] rounded-2xl"
        index={index}
        onIndexChange={setIndex}
        slides={TRY_ON_PHOTO_KINDS.map((kind) => {
          const photo = photos[kind];
          const label = TRY_ON_PHOTO_LABELS[kind];
          return {
            key: kind,
            label,
            content: photo ? (
              <img
                src={photo.src}
                alt={`Your ${label.toLowerCase()} try-on photo`}
                draggable={false}
                className="h-full w-full object-cover"
              />
            ) : (
              <button
                type="button"
                onClick={() => pick(kind)}
                className="h-full w-full grid place-items-center text-center p-4 text-sm text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-secondary/50 hover:bg-secondary transition"
              >
                <span>
                  <ImageUp className="mx-auto h-6 w-6 text-[color:var(--plum)]" />
                  <span className="mt-2 block font-medium text-foreground">
                    Add a {label.toLowerCase()} photo
                  </span>
                  JPEG, PNG or WebP, up to 7 MB
                </span>
              </button>
            ),
          };
        })}
      />

      <div className="flex flex-col min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl">
            {added === 2 ? "This is you in every try-on" : "Add two photos for the best try-ons"}
          </h3>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${added === 2 ? "bg-[color:var(--plum)]/10 text-[color:var(--plum)]" : "bg-secondary text-muted-foreground"}`}
          >
            {added} of 2 added
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          We recommend adding two photos: a close-up and a full body photo. Clothes go on your full
          body photo. Hats, sunglasses and earrings go on the close-up, where they're big enough to
          see. You can still pick different photos for a single try-on.
        </p>

        <div className="mt-5 grid md:grid-cols-2 gap-3">
          {TRY_ON_PHOTO_KINDS.map((kind, i) => {
            const photo = photos[kind];
            const label = TRY_ON_PHOTO_LABELS[kind];
            const guide = PHOTO_GUIDE[kind];
            const showing = i === index;
            return (
              <div
                key={kind}
                className={`rounded-2xl border p-4 flex flex-col transition ${showing ? "border-[color:var(--plum)]/50 bg-[color:var(--plum)]/5" : "border-border"}`}
              >
                <button
                  type="button"
                  onClick={() => show(kind)}
                  className="text-left"
                  aria-label={`Show your ${label.toLowerCase()} photo`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      {photo ? `Added ${formatDate(photo.updated)}` : "Not added yet"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{guide.use}</div>
                </button>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {guide.tips.map((tip) => (
                    <li key={tip} className="flex gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-[color:var(--plum)]" /> {tip}
                    </li>
                  ))}
                </ul>
                {errors[kind] && (
                  <p className="mt-3 text-sm text-[color:var(--plum)]" role="alert">
                    {errors[kind]}
                  </p>
                )}
                <div className="mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => pick(kind)}
                    className={`rounded-full px-4 py-2 text-sm font-medium inline-flex items-center gap-2 ${photo ? "border border-border bg-background hover:bg-accent" : "bg-primary text-primary-foreground"}`}
                  >
                    <ImageUp className="h-4 w-4" />{" "}
                    {photo ? `Replace ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

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
    </div>
  );
}

// ── Saved try-ons ─────────────────────────────────────────────────────────────

function TryOnCard({
  tryOn,
  profiles,
  onOpen,
}: {
  tryOn: SavedTryOn;
  profiles: MeasurementProfile[];
  onOpen: () => void;
}) {
  const profile = profiles.find((p) => p.jobId === tryOn.measurementProfile);
  return (
    <article className="group rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lux)] transition">
      <button
        onClick={onOpen}
        className="relative block w-full aspect-[3/4] overflow-hidden bg-secondary"
        aria-label="Open full size"
      >
        <img
          src={tryOn.result}
          alt="Saved try-on result"
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full glass bg-white/70 text-foreground opacity-0 group-hover:opacity-100 transition">
          <Maximize2 className="h-4 w-4" />
        </span>
      </button>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg">{formatDate(tryOn.saved)}</h3>
          <span className="text-xs text-muted-foreground">
            {tryOn.items.map((i) => i.category).join(" + ")}
          </span>
        </div>
        <MadeFrom tryOn={tryOn} />
        {profile && (
          <a
            href={profile.status === "ready" ? "#measurements" : "#profiles"}
            className="mt-3 inline-block text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
          >
            From your scan on {formatDate(profile.created)}
          </a>
        )}
      </div>
    </article>
  );
}

function MadeFrom({ tryOn, large = false }: { tryOn: SavedTryOn; large?: boolean }) {
  const size = large ? "h-16 w-16" : "h-12 w-12";
  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="text-xs text-muted-foreground mr-1">Made from</span>
      <img
        src={tryOn.person}
        alt="Person photo"
        title="Person photo"
        className={`${size} rounded-lg object-cover border border-border`}
      />
      {tryOn.items.map((i) => (
        <img
          key={i.image}
          src={i.image}
          alt={i.category}
          title={i.category}
          className={`${size} rounded-lg object-cover border border-border bg-secondary`}
        />
      ))}
    </div>
  );
}

function TryOnDialog({
  tryOn,
  profiles,
  onClose,
}: {
  tryOn: SavedTryOn | null;
  profiles: MeasurementProfile[];
  onClose: () => void;
}) {
  const profile = tryOn && profiles.find((p) => p.jobId === tryOn.measurementProfile);
  return (
    <Dialog open={!!tryOn} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden">
        {tryOn && (
          <div className="grid md:grid-cols-[1.2fr_1fr]">
            <div className="bg-secondary max-h-[80vh]">
              <img
                src={tryOn.result}
                alt="Saved try-on result"
                className="h-full w-full max-h-[80vh] object-contain"
              />
            </div>
            <div className="p-6 flex flex-col">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {tryOn.items.map((i) => i.category).join(" + ")}
                </DialogTitle>
                <DialogDescription>Saved {formatDate(tryOn.saved)}</DialogDescription>
              </DialogHeader>
              <MadeFrom tryOn={tryOn} large />
              {profile && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Made with your measurements from {formatDate(profile.created)}.
                </p>
              )}
              <a
                href={tryOn.result}
                download={`try-on-${tryOn.savedId}.jpg`}
                className="mt-auto pt-6 self-start inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4"
              >
                <Download className="h-4 w-4" /> Download
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Earlier profiles ──────────────────────────────────────────────────────────

function ProfileCard({ profile }: { profile: MeasurementProfile }) {
  const failed = profile.status === "failed";
  return (
    <article className="rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)]">
      <div className="relative aspect-[4/5] bg-secondary">
        <img
          src={profile.photos[0].src}
          alt="Front photo from this scan"
          loading="lazy"
          className={`h-full w-full object-cover ${failed ? "grayscale opacity-70" : ""}`}
        />
        {failed && (
          <div className="absolute top-3 left-3 rounded-full bg-background/90 px-3 py-1 text-[11px] font-medium inline-flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-[color:var(--plum)]" /> Measuring failed
          </div>
        )}
        {profile.status === "measuring" && (
          <div className="absolute top-3 left-3 rounded-full bg-background/90 px-3 py-1 text-[11px] font-medium">
            Measuring…
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg">{formatDate(profile.created)}</h3>
        <div className="mt-1 text-sm text-muted-foreground">{describeInputs(profile.inputs)}</div>
        {profile.bodyShape && (
          <div className="mt-1 text-sm text-muted-foreground">{profile.bodyShape.build} build</div>
        )}
        {failed && profile.error && (
          <p className="mt-2 text-sm text-muted-foreground">{profile.error}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {failed ? (
            <Link
              to="/scan"
              className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-medium inline-flex items-center gap-1.5"
            >
              <ScanLine className="h-3.5 w-3.5" /> Scan again
            </Link>
          ) : (
            <>
              <Link
                to="/measurements"
                search={{ job: profile.jobId }}
                className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-medium inline-flex items-center gap-1.5"
              >
                <Ruler className="h-3.5 w-3.5" /> Measurements
              </Link>
              <Link
                to="/stores"
                className="rounded-full border border-border px-4 py-2 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-accent"
              >
                <Shirt className="h-3.5 w-3.5" /> Try on
              </Link>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Small pieces ──────────────────────────────────────────────────────────────

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
      <span className="h-px w-6 bg-[color:var(--plum)]" /> {children}
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl md:text-3xl inline-flex items-center gap-3">
        <span
          className="h-9 w-9 rounded-full grid place-items-center text-white"
          style={{ background: "var(--gradient-plum)" }}
        >
          {icon}
        </span>
        {title}
      </h2>
      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{children}</span>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action: React.ReactNode;
}) {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
      <span className="mx-auto h-12 w-12 rounded-full grid place-items-center bg-secondary text-[color:var(--plum)]">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{text}</p>
      <div className="mt-6 flex justify-center">{action}</div>
    </div>
  );
}
