import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Shield, FileText, Cookie, Brain, History, Download, Trash2, Lock,
  HelpCircle, ChevronRight, Check, ExternalLink, ShieldCheck,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { trustStore, useTrust } from "@/lib/trust-store";

export const Route = createFileRoute("/trust")({
  component: TrustCentre,
  head: () => ({
    meta: [
      { title: "Trust Centre — Mannequin AI" },
      { name: "description", content: "Privacy, security, AI transparency and consent history for your Digital Body Twin." },
    ],
  }),
});

const SECTIONS = [
  { id: "privacy", label: "Privacy policy", icon: Shield },
  { id: "tos", label: "Terms of service", icon: FileText },
  { id: "cookies", label: "Cookie preferences", icon: Cookie },
  { id: "ai", label: "AI transparency", icon: Brain },
  { id: "consents", label: "Consent history", icon: History },
  { id: "data", label: "Data export & deletion", icon: Download },
  { id: "security", label: "Security settings", icon: Lock },
  { id: "faq", label: "Frequently asked questions", icon: HelpCircle },
] as const;

function TrustCentre() {
  const trust = useTrust();
  const [active, setActive] = useState<(typeof SECTIONS)[number]["id"]>("privacy");

  const downloadJson = () => {
    const blob = new Blob([trustStore.exportData()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mannequin-ai-data.json";
    a.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <div className="pt-16" />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-2xl grid place-items-center" style={{ background: "var(--gradient-plum)" }}>
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs uppercase tracking-[0.24em] text-[color:var(--plum)]">Trust Centre</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display">Privacy, made <span className="italic">visible</span>.</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Everything about how Mannequin AI handles your data — always available, always editable.
        </p>

        <div className="mt-10 grid lg:grid-cols-[260px_1fr] gap-8">
          <nav className="rounded-2xl border border-border bg-card p-2 h-fit sticky top-24">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${isActive ? "bg-[color:var(--plum)]/10 text-[color:var(--plum)]" : "hover:bg-accent"}`}
                >
                  <Icon className="h-4 w-4" /> <span className="flex-1 text-left">{s.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </button>
              );
            })}
          </nav>

          <div className="rounded-2xl border border-border bg-card p-8">
            {active === "privacy" && <PolicySection title="Privacy policy" points={[
              "We collect only what's necessary to build your Digital Body Twin and personalise your shopping.",
              "Your body scan and measurements are encrypted in transit and at rest.",
              "You can revoke any consent and delete your data at any time.",
              "We never sell personal data to third parties.",
            ]} />}
            {active === "tos" && <PolicySection title="Terms of service" points={[
              "You keep ownership of your body profile and any content you share.",
              "AI recommendations are shopping guidance — not professional advice.",
              "Community guidelines: respect others; no abuse, fraud or inappropriate content.",
              "We may suspend accounts that violate these terms after notice.",
            ]} />}
            {active === "cookies" && <CookiePrefs />}
            {active === "ai" && <PolicySection title="AI transparency" points={[
              "Body measurements are derived on-device where possible and used to power fit predictions.",
              "Models are trained on consented, de-identified data — never on your photos without explicit opt-in.",
              "Every recommendation lists the signals that shaped it (fit, weather, wishlist, capsule).",
              "You can turn off AI recommendations from Privacy Settings at any time.",
            ]} />}
            {active === "consents" && <ConsentHistory consents={trust.consents} />}
            {active === "data" && <DataSection onExport={downloadJson} />}
            {active === "security" && <SecuritySection twoFactor={trust.prefs.twoFactor} />}
            {active === "faq" && <Faq />}
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          Need to change something? Head to your <Link to="/privacy" className="underline hover:text-foreground">Privacy settings</Link>.
        </div>
      </div>
    </div>
  );
}

function PolicySection({ title, points }: { title: string; points: string[] }) {
  return (
    <div>
      <h2 className="text-2xl font-display">{title}</h2>
      <ul className="mt-5 space-y-3">
        {points.map((p) => (
          <li key={p} className="flex gap-3 text-sm">
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full grid place-items-center bg-[color:var(--plum)]/10 text-[color:var(--plum)]"><Check className="h-3 w-3" /></span>
            <span className="text-muted-foreground">{p}</span>
          </li>
        ))}
      </ul>
      <a href="#" className="mt-6 inline-flex items-center gap-1 text-xs text-[color:var(--plum)] hover:underline">
        Read the full document <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function CookiePrefs() {
  const [prefs, setPrefs] = useState({ essential: true, analytics: true, marketing: false });
  return (
    <div>
      <h2 className="text-2xl font-display">Cookie preferences</h2>
      <p className="mt-2 text-sm text-muted-foreground">Choose which cookies we may use. Essential cookies are required to keep the site working.</p>
      <div className="mt-6 space-y-3">
        {([
          ["essential", "Strictly essential", "Required for login, cart and security.", true],
          ["analytics", "Analytics", "Helps us understand how the app is used, anonymised."],
          ["marketing", "Marketing", "Personalised campaigns from Mannequin AI (never sold)."],
        ] as const).map(([key, label, desc, locked]) => (
          <div key={key} className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
            <Toggle disabled={locked} checked={prefs[key as keyof typeof prefs]} onChange={(v) => setPrefs({ ...prefs, [key]: v })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ConsentHistory({ consents }: { consents: { id: string; label: string; acceptedAt: string; version: string }[] }) {
  return (
    <div>
      <h2 className="text-2xl font-display">Consent history</h2>
      <p className="mt-2 text-sm text-muted-foreground">A live record of every consent you've given.</p>
      {consents.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No consents recorded yet. Complete <Link to="/onboarding" className="underline">onboarding</Link> to start.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-xl border border-border overflow-hidden">
          {consents.map((c) => (
            <li key={c.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <div className="font-medium">{c.label}</div>
                <div className="text-xs text-muted-foreground">v{c.version} · {new Date(c.acceptedAt).toLocaleString()}</div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Check className="h-3 w-3" /> Accepted</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DataSection({ onExport }: { onExport: () => void }) {
  return (
    <div>
      <h2 className="text-2xl font-display">Your data</h2>
      <p className="mt-2 text-sm text-muted-foreground">Export or delete everything Mannequin AI holds about you.</p>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <button onClick={onExport} className="rounded-2xl border border-border p-5 text-left hover:bg-accent">
          <Download className="h-5 w-5 text-[color:var(--plum)]" />
          <div className="mt-3 font-medium">Download my data</div>
          <div className="text-xs text-muted-foreground">Get a JSON archive of your account, twin, consents and settings.</div>
        </button>
        <button
          onClick={() => { if (confirm("Delete all local Mannequin AI data on this device?")) trustStore.reset(); }}
          className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-left hover:bg-red-500/10"
        >
          <Trash2 className="h-5 w-5 text-red-600" />
          <div className="mt-3 font-medium">Delete my data</div>
          <div className="text-xs text-muted-foreground">Permanently remove your Digital Twin, wishlists and consents.</div>
        </button>
      </div>
    </div>
  );
}

function SecuritySection({ twoFactor }: { twoFactor: boolean }) {
  return (
    <div>
      <h2 className="text-2xl font-display">Security settings</h2>
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <div className="font-medium text-sm">Two-factor authentication</div>
            <div className="text-xs text-muted-foreground">Add a second step to sign-in using an authenticator app.</div>
          </div>
          <Toggle checked={twoFactor} onChange={(v) => trustStore.setPref("twoFactor", v)} />
        </div>
        <div className="rounded-xl border border-border p-4">
          <div className="font-medium text-sm">Recent sessions</div>
          <ul className="mt-2 text-xs text-muted-foreground space-y-1">
            <li>• iPhone 15 — Cape Town — active now</li>
            <li>• MacBook Pro — Cape Town — 2 hours ago</li>
            <li>• Chrome, Windows — Johannesburg — 3 days ago</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Faq() {
  const items = [
    ["Who can see my Digital Body Twin?", "Only you, by default. You can share it with specific people, friends, or selected retailers from Privacy Settings."],
    ["Do retailers get my photos?", "No — never, unless you explicitly opt in for a specific brand. Retailers receive fit and size data only."],
    ["Can I delete my twin?", "Yes, at any time from Trust Centre → Data export & deletion."],
    ["How accurate is fit prediction?", "Our average across 2.4M twins is 96%. Every product page shows a per-item Fit Confidence score."],
  ];
  return (
    <div>
      <h2 className="text-2xl font-display">Frequently asked questions</h2>
      <div className="mt-6 divide-y divide-border">
        {items.map(([q, a]) => (
          <details key={q} className="py-4 group">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium">
              {q} <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[color:var(--plum)]" : "bg-border"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      aria-pressed={checked}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-5" : "left-0.5"}`} />
    </button>
  );
}
