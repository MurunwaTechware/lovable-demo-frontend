import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Info, Loader2, ScanLine, Upload } from "lucide-react";

import { Nav } from "@/components/Nav";
import {
  MEASUREMENT_LABELS,
  feetInches,
  formatDate,
  getProfile,
  useTwin,
  type MeasurementKey,
  type MeasurementProfile,
} from "@/lib/twin-store";

// The results page after a scan, recreated from the backend's /measurements?job=<id> page.
// Demo: the profile comes from the mock data in twin-store. With the backend it's GET /measurements_data/{job}.
export const Route = createFileRoute("/measurements")({
  validateSearch: (search: Record<string, unknown>): { job?: string } => ({
    job: typeof search.job === "string" ? search.job : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your measurements · Mannequin AI" },
      {
        name: "description",
        content: "Your body measurements, estimated by AI from your photos and details.",
      },
    ],
  }),
  component: MeasurementsPage,
});

function MeasurementsPage() {
  const { job } = Route.useSearch();
  const { latest } = useTwin();
  // No job in the address: show the latest profile, like opening "your measurements"
  const profile = job ? getProfile(job) : (latest ?? undefined);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-4xl px-6 pt-24 pb-24">
        <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
          <span className="h-px w-6 bg-[color:var(--plum)]" /> Your Digital Twin
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Your measurements</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Estimated by AI from your photos and details. Treat them as close estimates, not tailor
          measurements.
        </p>

        <div className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-card)]">
          {!profile ? (
            <Notice
              icon={<ScanLine className="h-5 w-5" />}
              title={job ? "We couldn't find that scan" : "No measurements yet"}
              text={
                job
                  ? "It may have been removed, or it belongs to a different account."
                  : "Upload your photos to get your measurements."
              }
            />
          ) : profile.status === "failed" ? (
            <Notice
              icon={<AlertTriangle className="h-5 w-5" />}
              title="Measuring didn't work this time"
              text={profile.error ?? "Something went wrong. Please try again with new photos."}
            />
          ) : profile.status === "measuring" || !profile.measurementsCm || !profile.bodyShape ? (
            <div className="py-16 text-center text-muted-foreground">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[color:var(--plum)]" />
              <p className="mt-4">Still measuring from your photos…</p>
            </div>
          ) : (
            <Results
              profile={profile}
              measurements={profile.measurementsCm}
              bodyShape={profile.bodyShape}
            />
          )}

          <div className="mt-10 grid sm:grid-cols-2 gap-3">
            <Link
              to="/scan"
              className="rounded-full border border-border bg-secondary hover:bg-accent py-3.5 text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" /> Upload again
            </Link>
            {profile?.status === "ready" ? (
              <Link
                to="/stores"
                className="rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-medium inline-flex items-center justify-center gap-2"
              >
                Continue to try-on <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/twin"
                className="rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-medium inline-flex items-center justify-center gap-2"
              >
                Go to your twin <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Results({
  profile,
  measurements,
  bodyShape,
}: {
  profile: MeasurementProfile;
  measurements: Record<MeasurementKey, number>;
  bodyShape: NonNullable<MeasurementProfile["bodyShape"]>;
}) {
  const { heightCm, weightKg, gender, age } = profile.inputs;
  const summary: [string, string, string?][] = [
    ["Height", feetInches(heightCm), `${heightCm} cm`],
    ["Weight", `${Math.round(weightKg)} kg`],
    ["Gender", gender === "neutral" ? "Not given" : gender[0].toUpperCase() + gender.slice(1)],
    ["Age", `${age} yrs`],
  ];

  return (
    <>
      <div className="text-sm text-muted-foreground">Scan from {formatDate(profile.created)}</div>

      {/* What they entered */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {summary.map(([label, value, sub]) => (
          <div key={label} className="rounded-2xl bg-secondary px-4 py-3.5">
            <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {label}
            </div>
            <div className="mt-1 font-display text-2xl">{value}</div>
            {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
          </div>
        ))}
      </div>

      {/* The model's own notes on what made estimates less reliable */}
      {!!profile.warnings?.length && (
        <div className="mt-6 rounded-2xl border border-[color:var(--gold)]/50 bg-[color:var(--gold)]/10 p-4 text-sm flex gap-3">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-[color:var(--plum)]" />
          <div>
            <div className="font-medium">Less certain estimates</div>
            <ul className="mt-1 list-disc pl-5 space-y-0.5 text-muted-foreground">
              {profile.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <SectionTitle>Body shape</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-2">
        <Row name="Build" value={bodyShape.build} />
        <Row
          name="Proportions"
          value={`${bodyShape.torsoPercent}% torso · ${100 - bodyShape.torsoPercent}% legs`}
        />
      </div>

      <SectionTitle>Detailed measurements</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-2">
        {(Object.keys(MEASUREMENT_LABELS) as MeasurementKey[])
          .filter((k) => k in measurements)
          .map((k) => (
            <Row key={k} name={MEASUREMENT_LABELS[k]} value={`${measurements[k].toFixed(1)} cm`} />
          ))}
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-3 text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">
      {children}
    </h2>
  );
}

function Row({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 rounded-xl bg-secondary/50 px-4 py-3 text-sm">
      <span>{name}</span>
      <span className="font-medium tabular-nums text-[color:var(--plum)] text-right">{value}</span>
    </div>
  );
}

function Notice({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="py-10 text-center">
      <span className="mx-auto h-12 w-12 rounded-full grid place-items-center bg-secondary text-[color:var(--plum)]">
        {icon}
      </span>
      <h2 className="mt-4 font-display text-2xl">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{text}</p>
    </div>
  );
}
