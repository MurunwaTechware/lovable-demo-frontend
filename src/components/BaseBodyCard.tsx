import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  Loader2,
  PencilRuler,
  Ruler,
  ScanLine,
  SlidersHorizontal,
} from "lucide-react";

import { BodyMesh } from "@/components/BodyMesh";
import type { MeasurementKey } from "@/lib/api";
import { SOURCE_COUNTS, fitShape } from "@/lib/body-shapes";
import {
  BODY_TYPES,
  MORE_MEASUREMENTS,
  measurementKeys,
  measurementName,
  SEXES,
  SOURCE_LABELS,
  meshFor,
  useBodyProfile,
} from "@/lib/body-profile";

// The user's twin on the twin page: the mesh, its measurements (the main ones, and the rest under "More
// measurements"), and the ways to change it: Edit (the mesh viewer, /twin/edit), a new scan, or the
// body questionnaire. Before there's a twin: the two ways to set one up.
export function BaseBodyCard() {
  const body = useBodyProfile();
  const [showMore, setShowMore] = useState(false);

  if (body.isLoading) {
    return (
      <p
        className="mt-6 text-sm text-muted-foreground inline-flex items-center gap-2"
        role="status"
      >
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your base body…
      </p>
    );
  }
  if (body.isError) {
    return (
      <p className="mt-6 text-sm text-[color:var(--plum)]" role="alert">
        {body.error instanceof Error ? body.error.message : "Couldn't load your base body."}
      </p>
    );
  }

  const profile = body.data;
  if (!profile) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-border bg-card p-8">
        <p className="font-display text-xl text-center">Set up your twin</p>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Two ways to give it your shape. You can switch, or fine-tune it, at any time.
        </p>
        <div className="mt-6 grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
          <SetupOption
            to="/scan"
            icon={<ScanLine className="h-5 w-5" />}
            title="AI scan"
            body="Three photos and your details. We measure you from them."
          />
          <SetupOption
            to="/body-setup"
            icon={<PencilRuler className="h-5 w-5" />}
            title="A few questions"
            body="Pick the body closest to yours and the sizes you buy."
          />
        </div>
      </div>
    );
  }

  const mesh = meshFor(profile.sex, profile.body_type);
  // The twin as it is: the base body reshaped to the saved measurements
  const targets: Partial<Record<MeasurementKey, number>> = {};
  const counts: Partial<Record<MeasurementKey, number>> = {};
  for (const [k, m] of Object.entries(profile.measurements)) {
    if (!m) continue;
    targets[k as MeasurementKey] = m.value;
    counts[k as MeasurementKey] = SOURCE_COUNTS[m.source];
  }
  const shape = fitShape(profile.sex, profile.body_type, targets, counts).weights;
  const names = measurementKeys(profile.sex);
  // Profiles saved before these were added have only the main measurements
  const hasMore = MORE_MEASUREMENTS.some((g) => g.keys.some((k) => profile.measurements[k]));
  return (
    <div className="mt-6 grid md:grid-cols-[320px_1fr] gap-6 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="relative aspect-[3/4] rounded-2xl bg-secondary/40 overflow-hidden">
        <BodyMesh
          key={mesh.model}
          model={mesh.model}
          image={mesh.image}
          shape={shape}
          className="absolute inset-0"
        />
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl">
            {SEXES.find((s) => s.id === profile.sex)?.label} ·{" "}
            {BODY_TYPES.find((t) => t.id === profile.body_type)?.label} build
          </h3>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
            {profile.scan_job ? "From your scan" : "From your answers"}
          </span>
          {profile.weight_kg && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
              {profile.weight_kg} kg
            </span>
          )}
        </div>
        <ul className="mt-4 grid sm:grid-cols-2 gap-3">
          {names
            .filter((k) => profile.measurements[k])
            .map((k) => {
              const m = profile.measurements[k]!;
              return (
                <li key={k} className="rounded-2xl border border-border p-3">
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <Ruler className="h-3.5 w-3.5 text-[color:var(--plum)]" />{" "}
                    {measurementName(k, profile.sex)}
                  </div>
                  <div className="mt-1 font-display text-lg tabular-nums">
                    {m.min != null ? `${m.min}–${m.max} cm` : `${m.value} cm`}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{SOURCE_LABELS[m.source]}</div>
                </li>
              );
            })}
        </ul>
        <div className="mt-3 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
            aria-controls="twin-more-measurements"
            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm"
          >
            <span className="font-medium">More measurements</span>
            <ChevronDown className={`h-4 w-4 transition ${showMore ? "rotate-180" : ""}`} />
          </button>
          {showMore && (
            <div id="twin-more-measurements" className="border-t border-border px-3 pb-3">
              {MORE_MEASUREMENTS.map((group) => {
                const keys = group.keys.filter((k) => profile.measurements[k]);
                if (!keys.length) return null;
                return (
                  <div key={group.title}>
                    <div className="pt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {group.title}
                    </div>
                    <dl className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                      {keys.map((k) => {
                        const m = profile.measurements[k]!;
                        return (
                          <div key={k} className="min-w-0">
                            <dt className="text-xs text-muted-foreground">
                              {measurementName(k, profile.sex)}
                            </dt>
                            <dd className="text-sm tabular-nums">
                              {m.value} cm
                              {m.source !== "base" && (
                                <span className="block text-[11px] text-muted-foreground">
                                  {SOURCE_LABELS[m.source]}
                                </span>
                              )}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                );
              })}
              <p className="pt-3 text-[11px] text-muted-foreground">
                {hasMore
                  ? "From your base body unless marked."
                  : "Edit your measurements to add them: they come from your base body."}
              </p>
            </div>
          )}
        </div>
        <div className="mt-auto pt-5 flex flex-wrap gap-2">
          <Link
            to="/twin/edit"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
          >
            <SlidersHorizontal className="h-4 w-4" /> Edit measurements
          </Link>
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <ScanLine className="h-4 w-4" /> New scan
          </Link>
          <Link
            to="/body-setup"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <PencilRuler className="h-4 w-4" /> Redo the questions
          </Link>
        </div>
      </div>
    </div>
  );
}

function SetupOption({
  to,
  icon,
  title,
  body,
}: {
  to: "/scan" | "/body-setup";
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-background p-5 text-left transition hover:border-[color:var(--plum)] hover:bg-[color:var(--plum)]/5"
    >
      <span className="h-10 w-10 rounded-xl grid place-items-center bg-[color:var(--plum)]/10 text-[color:var(--plum)]">
        {icon}
      </span>
      <span className="mt-3 block font-medium">{title}</span>
      <span className="mt-1 block text-sm text-muted-foreground">{body}</span>
    </Link>
  );
}
