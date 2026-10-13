import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { UserCog, Eye, Sparkles, Mail, Store, ShieldAlert, Ban, UserX, Trash2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { trustStore, useTrust, type PrivacyPrefs } from "@/lib/trust-store";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy settings — Mannequin AI" },
      { name: "description", content: "Control who sees your Digital Body Twin and how Mannequin AI uses your data." },
    ],
  }),
});

const VISIBILITY: { id: PrivacyPrefs["profileVisibility"]; label: string; desc: string }[] = [
  { id: "only-me", label: "Only me", desc: "Private — nobody sees your twin." },
  { id: "friends", label: "Friends", desc: "People in your Circle." },
  { id: "specific", label: "Specific people", desc: "Hand-picked collaborators only." },
  { id: "retailers", label: "Selected retailers", desc: "Approved brands for better fit." },
  { id: "nobody", label: "Nobody", desc: "Even you must re-verify to view." },
];

function PrivacyPage() {
  const trust = useTrust();
  const [reportName, setReportName] = useState("");
  const [blockName, setBlockName] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <div className="pt-16" />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-2xl grid place-items-center" style={{ background: "var(--gradient-plum)" }}>
            <UserCog className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs uppercase tracking-[0.24em] text-[color:var(--plum)]">Privacy settings</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display">You're in <span className="italic">control</span>.</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Fine-tune who sees your Digital Body Twin and how Mannequin AI personalises your experience.
        </p>

        <Section title="Who can view my profile" icon={<Eye className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {VISIBILITY.map((v) => {
              const active = trust.prefs.profileVisibility === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => trustStore.setPref("profileVisibility", v.id)}
                  className={`text-left rounded-2xl border p-4 transition ${active ? "border-[color:var(--plum)] bg-[color:var(--plum)]/5" : "border-border hover:bg-accent"}`}
                >
                  <div className="font-medium text-sm">{v.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{v.desc}</div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Personalisation" icon={<Sparkles className="h-4 w-4" />}>
          <ToggleRow icon={<Sparkles className="h-4 w-4" />} label="Allow AI recommendations" desc="Personalised outfits, capsules and fit predictions."
            checked={trust.prefs.allowAiRecs} onChange={(v) => trustStore.setPref("allowAiRecs", v)} />
          <ToggleRow icon={<Mail className="h-4 w-4" />} label="Allow marketing emails" desc="Occasional drops, capsules and stylist notes."
            checked={trust.prefs.allowMarketing} onChange={(v) => trustStore.setPref("allowMarketing", v)} />
          <ToggleRow icon={<Store className="h-4 w-4" />} label="Allow retailer suggestions" desc="Curated stores that match your twin."
            checked={trust.prefs.allowRetailerSuggestions} onChange={(v) => trustStore.setPref("allowRetailerSuggestions", v)} />
        </Section>

        <Section title="Safety" icon={<ShieldAlert className="h-4 w-4" />}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border p-5">
              <div className="text-sm font-medium flex items-center gap-2"><UserX className="h-4 w-4" /> Report a user</div>
              <p className="text-xs text-muted-foreground mt-1">We review every report within 24 hours.</p>
              <div className="mt-3 flex gap-2">
                <input value={reportName} onChange={(e) => setReportName(e.target.value)} placeholder="Username or email" className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm" />
                <button onClick={() => { if (reportName) { alert(`Report submitted for ${reportName}`); setReportName(""); } }}
                  className="rounded-xl bg-primary text-primary-foreground px-4 text-sm">Report</button>
              </div>
            </div>
            <div className="rounded-2xl border border-border p-5">
              <div className="text-sm font-medium flex items-center gap-2"><Ban className="h-4 w-4" /> Block a user</div>
              <p className="text-xs text-muted-foreground mt-1">Blocked people can't see your twin or wishlist.</p>
              <div className="mt-3 flex gap-2">
                <input value={blockName} onChange={(e) => setBlockName(e.target.value)} placeholder="Username or email" className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm" />
                <button onClick={() => { if (blockName) { trustStore.block(blockName); setBlockName(""); } }}
                  className="rounded-xl bg-primary text-primary-foreground px-4 text-sm">Block</button>
              </div>
              {trust.blocked.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {trust.blocked.map((b) => (
                    <li key={b} className="inline-flex items-center gap-1 text-xs rounded-full bg-secondary px-3 py-1">
                      {b}
                      <button onClick={() => trustStore.unblock(b)} className="text-muted-foreground hover:text-foreground">×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Section>

        <Section title="Digital Body Twin" icon={<Trash2 className="h-4 w-4" />}>
          <div className="grid md:grid-cols-3 gap-3">
            <ActionCard label="Export my data" desc="Download a JSON archive." onClick={() => {
              const blob = new Blob([trustStore.exportData()], { type: "application/json" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "mannequin-ai-data.json"; a.click();
            }} />
            <ActionCard label="Delete Digital Twin" desc="Remove your body profile." onClick={() => alert("Twin marked for deletion.")} />
            <ActionCard label="Delete account" desc="Erase everything, permanently." danger onClick={() => { if (confirm("Delete this account? This cannot be undone.")) trustStore.reset(); }} />
          </div>
        </Section>

        <div className="mt-10 text-center text-xs text-muted-foreground">
          Looking for policies? Visit the <Link to="/trust" className="underline hover:text-foreground">Trust Centre</Link>.
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="h-8 w-8 rounded-xl grid place-items-center bg-[color:var(--plum)]/10 text-[color:var(--plum)]">{icon}</span>
        <h2 className="font-display text-xl">{title}</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">{children}</div>
    </section>
  );
}

function ToggleRow({ icon, label, desc, checked, onChange }: { icon: React.ReactNode; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-4">
      <div className="flex gap-3">
        <span className="mt-0.5 text-[color:var(--plum)]">{icon}</span>
        <div>
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[color:var(--plum)]" : "bg-border"}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function ActionCard({ label, desc, onClick, danger }: { label: string; desc: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${danger ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10" : "border-border hover:bg-accent"}`}
    >
      <div className={`font-medium text-sm ${danger ? "text-red-600" : ""}`}>{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </button>
  );
}
