import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, PencilRuler, ScanLine } from "lucide-react";

import { Nav } from "@/components/Nav";
import { TwinEditor } from "@/components/TwinEditor";
import { useBodyProfile } from "@/lib/body-profile";

// The twin page's "Edit": the mesh viewer, with every measurement of the twin to check and change.
// /twin/edit, its own page rather than nested in /twin (the trailing _ in the file name).
export const Route = createFileRoute("/twin_/edit")({
  head: () => ({
    meta: [
      { title: "Edit your twin · Mannequin AI" },
      { name: "description", content: "Check and change your Digital Twin's measurements." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TwinEditPage,
});

function TwinEditPage() {
  const navigate = useNavigate();
  const body = useBodyProfile();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-display text-3xl md:text-4xl">Edit your twin</h1>
          <Link
            to="/twin"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to your twin
          </Link>
        </div>
        {/* overflow-clip, not overflow-hidden, so the mesh can stay in view (sticky) */}
        <div className="rounded-[2rem] border border-border bg-card shadow-[var(--shadow-card)] overflow-clip">
          {body.isLoading ? (
            <div className="p-16 grid place-items-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : body.isError ? (
            <p className="p-10 text-sm text-[color:var(--plum)]" role="alert">
              {body.error instanceof Error ? body.error.message : "Couldn't load your twin."}
            </p>
          ) : body.data ? (
            <TwinEditor
              key={body.data.updated_at}
              profile={body.data}
              onDone={() => navigate({ to: "/twin" })}
            />
          ) : (
            <div className="p-10 md:p-16 text-center">
              <p className="font-display text-2xl">There's no twin to edit yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Set one up first, with a scan or a few questions.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  to="/scan"
                  className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium"
                >
                  <ScanLine className="h-4 w-4" /> Scan my body
                </Link>
                <Link
                  to="/body-setup"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  <PencilRuler className="h-4 w-4" /> Answer a few questions
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
