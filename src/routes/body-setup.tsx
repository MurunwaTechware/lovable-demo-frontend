import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { BodyQuestionnaire } from "@/components/BodyQuestionnaire";
import { Nav } from "@/components/Nav";
import { useBodyProfile } from "@/lib/body-profile";

// The body questionnaire on its own, to do it again at any time: it opens with the saved answers, and
// saving replaces them. Reached from the twin and account pages ("Redo body setup").
export const Route = createFileRoute("/body-setup")({
  head: () => ({
    meta: [
      { title: "Your body · Mannequin AI" },
      {
        name: "description",
        content: "Set up or change the base body your Digital Twin starts from.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BodySetupPage,
});

function BodySetupPage() {
  const navigate = useNavigate();
  const body = useBodyProfile();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 pt-24 pb-16">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-display text-3xl md:text-4xl">
            {body.data ? "Change your body setup" : "Set up your body"}
          </h1>
          <Link
            to="/onboarding"
            search={{ from: "start" }}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            See the whole onboarding again
          </Link>
        </div>
        <div className="rounded-[2rem] border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
          {body.isLoading ? (
            <div className="p-16 grid place-items-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : body.isError ? (
            <p className="p-10 text-sm text-[color:var(--plum)]" role="alert">
              {body.error instanceof Error ? body.error.message : "Couldn't load your body setup."}
            </p>
          ) : (
            <BodyQuestionnaire initial={body.data} onDone={() => navigate({ to: "/twin" })} />
          )}
        </div>
      </main>
    </div>
  );
}
