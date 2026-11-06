import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { BodyQuestionnaire } from "@/components/BodyQuestionnaire";
import { Nav } from "@/components/Nav";
import { useAboutYou } from "@/lib/about-you";
import { useBodyProfile } from "@/lib/body-profile";

// The body questionnaire, one of the two ways to set up a twin (onboarding's last step offers it and the
// scan; so do the twin and account pages). Opens with the saved answers, and saving replaces them, then
// goes to the twin page.
export const Route = createFileRoute("/body-setup")({
  // ?from=onboarding: just finished onboarding, so this is the last step of setting up
  validateSearch: (search: Record<string, unknown>): { from?: "onboarding" } => ({
    from: search.from === "onboarding" ? "onboarding" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your body · Mannequin AI" },
      {
        name: "description",
        content: "Answer a few questions about your sizes to set up your Digital Twin.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BodySetupPage,
});

function BodySetupPage() {
  const navigate = useNavigate();
  const { from } = Route.useSearch();
  const body = useBodyProfile();
  const about = useAboutYou();
  const loading = body.isLoading || about.isLoading;
  const error = body.error ?? about.error;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            {from === "onboarding" && (
              <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--plum)]">
                Last step
              </div>
            )}
            <h1 className="mt-1 font-display text-3xl md:text-4xl">
              {body.data ? "Change your body setup" : "Set up your twin"}
            </h1>
          </div>
          <Link
            to="/scan"
            search={from ? { from } : {}}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Scan instead
          </Link>
        </div>
        <div className="rounded-[2rem] border border-border bg-card shadow-[var(--shadow-card)] overflow-clip">
          {loading ? (
            <div className="p-16 grid place-items-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <p className="p-10 text-sm text-[color:var(--plum)]" role="alert">
              {error instanceof Error ? error.message : "Couldn't load your body setup."}
            </p>
          ) : (
            <BodyQuestionnaire
              initial={body.data}
              about={about.data}
              onDone={() => navigate({ to: "/twin" })}
            />
          )}
        </div>
      </main>
    </div>
  );
}
