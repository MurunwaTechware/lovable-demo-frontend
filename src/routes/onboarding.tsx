import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Shield, Lock, UserCircle2, ShieldCheck, ArrowRight, ArrowLeft, Check,
  Play, Sparkles, ScanLine, IdCard, Users, Mail, PartyPopper,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { trustStore, useTrust } from "@/lib/trust-store";
import heroImg from "@/assets/hero.jpg";
import twinImg from "@/assets/twin.jpg";
import scanVideo from "@/assets/scan.mp4.asset.json";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
  head: () => ({
    meta: [
      { title: "Welcome to Mannequin AI — Trust & Onboarding" },
      { name: "description", content: "A premium, secure onboarding flow to create your Digital Body Twin." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const STEPS = ["Welcome", "Privacy", "How it works", "Age", "Terms", "Done"] as const;

function Onboarding() {
  const trust = useTrust();
  const navigate = useNavigate();
  const [step, setStep] = useState(trust.onboarded ? 5 : 0);
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <div className="pt-16" />
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{STEPS[step]}</span>
          </div>
          <div className="h-1 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: "var(--gradient-plum)" }}
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden animate-fade-up">
          {step === 0 && <Welcome onNext={next} />}
          {step === 1 && <Privacy onNext={next} onBack={back} />}
          {step === 2 && <HowItWorks onNext={next} onBack={back} />}
          {step === 3 && <AgeVerify onNext={next} onBack={back} />}
          {step === 4 && <Terms onNext={next} onBack={back} />}
          {step === 5 && (
            <Done
              onFinish={() => {
                trustStore.completeOnboarding();
                navigate({ to: "/" });
              }}
            />
          )}
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          Manage your consents anytime in the <Link to="/trust" className="underline hover:text-foreground">Trust Centre</Link>.
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────── screens ────────────────────────────── */

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="grid md:grid-cols-2">
      <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[520px]">
        <img src={heroImg} alt="A stylist standing in front of a digital mirror" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 glass rounded-2xl p-4 text-xs text-white bg-black/30">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="h-3.5 w-3.5" /> Live digital mirror</div>
          Your twin forms in ~90 seconds, encrypted end-to-end.
        </div>
      </div>
      <div className="p-8 md:p-12 flex flex-col justify-center">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--plum)]">01 · Welcome</span>
        <h1 className="mt-3 text-4xl md:text-5xl font-display">Welcome to <span className="italic">Mannequin AI</span></h1>
        <p className="mt-5 text-muted-foreground">
          Create your secure Digital Body Twin and enjoy a personalised shopping experience across every retailer you love.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={onNext} className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
          <Link to="/trust" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-accent">
            Learn more
          </Link>
        </div>
      </div>
    </div>
  );
}

function Privacy({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const items = [
    ["Your body scan is encrypted", "End-to-end encryption in transit and at rest."],
    ["Your measurements belong to you", "Export or delete them at any time."],
    ["You control access", "Choose exactly who can view your twin."],
    ["Retailers never receive photos", "Unless you explicitly choose to share."],
    ["We never sell personal data", "Not to advertisers. Not to anyone."],
  ] as const;
  return (
    <div className="p-8 md:p-12">
      <span className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--plum)]">02 · Privacy & Security</span>
      <h2 className="mt-3 text-4xl font-display">Your privacy comes <span className="italic">first</span>.</h2>
      <div className="mt-8 grid md:grid-cols-2 gap-8 items-center">
        <div className="relative aspect-square rounded-[1.5rem] overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
          <img src={twinImg} alt="Your Digital Body Twin protected by a shield" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-90" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative">
              <div className="h-40 w-40 rounded-full grid place-items-center bg-white/80 backdrop-blur shadow-[var(--shadow-lux)]">
                <ShieldCheck className="h-16 w-16 text-[color:var(--plum)]" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-[color:var(--plum)]/30 animate-ping" />
            </div>
          </div>
        </div>
        <ul className="space-y-4">
          {items.map(([k, v]) => (
            <li key={k} className="flex gap-3">
              <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full grid place-items-center bg-[color:var(--plum)] text-white">
                <Check className="h-3.5 w-3.5" />
              </span>
              <div><div className="font-medium">{k}</div><div className="text-sm text-muted-foreground">{v}</div></div>
            </li>
          ))}
          <li className="flex gap-3 pt-2 text-xs text-muted-foreground">
            <PillIcon icon={<Lock className="h-3.5 w-3.5" />} label="Secure" />
            <PillIcon icon={<UserCircle2 className="h-3.5 w-3.5" />} label="Private" />
            <PillIcon icon={<Shield className="h-3.5 w-3.5" />} label="Protected" />
          </li>
        </ul>
      </div>
      <NavRow onBack={onBack} onNext={onNext} />
    </div>
  );
}

function PillIcon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
      {icon}{label}
    </span>
  );
}

function HowItWorks({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const poses = ["Front view", "Side view", "Back view"];
  const rules = [
    "Stand ~2 metres from your phone",
    "Wear fitted clothing",
    "Keep arms slightly away from your body",
    "Stand straight, full body visible",
    "Good, diffuse lighting",
    "A plain background",
  ];
  return (
    <div className="p-8 md:p-12">
      <span className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--plum)]">03 · How the scan works</span>
      <h2 className="mt-3 text-4xl font-display">Three angles. <span className="italic">Ninety seconds.</span></h2>

      <div className="mt-8 grid lg:grid-cols-2 gap-8">
        <div className="relative rounded-[1.5rem] overflow-hidden aspect-video bg-black">
          <video src={scanVideo.url} autoPlay muted loop playsInline className="h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          <div className="absolute top-3 left-3 glass rounded-full px-3 py-1.5 text-[11px] font-medium text-white bg-black/40">
            Tutorial · 0:47
          </div>
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="h-14 w-14 grid place-items-center rounded-full bg-white/90"><Play className="h-6 w-6 ml-0.5" /></div>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {poses.map((p) => (
              <div key={p} className="rounded-2xl border border-border bg-secondary/40 p-3 text-center">
                <PoseSilhouette variant={p} />
                <div className="mt-2 text-[11px] font-medium">{p}</div>
              </div>
            ))}
          </div>
          <ul className="space-y-2 text-sm">
            {rules.map((r) => (
              <li key={r} className="flex gap-3">
                <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full grid place-items-center bg-[color:var(--plum)]/10 text-[color:var(--plum)]">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-muted-foreground">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} nextLabel="I understand" />
    </div>
  );
}

function PoseSilhouette({ variant }: { variant: string }) {
  const rotate = variant === "Side view" ? "rotate-y-90" : variant === "Back view" ? "opacity-70" : "";
  return (
    <svg viewBox="0 0 60 100" className={`mx-auto h-24 w-auto text-[color:var(--plum)] ${rotate}`}>
      <circle cx="30" cy="14" r="8" fill="currentColor" opacity="0.9" />
      <path d="M20 24 L40 24 L44 60 L36 60 L34 90 L26 90 L24 60 L16 60 Z" fill="currentColor" opacity="0.85" />
      <path d="M18 26 L10 55 M42 26 L50 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function AgeVerify({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const trust = useTrust();
  const [dob, setDob] = useState(trust.dob ?? { day: "", month: "", year: "" });
  const [parent, setParent] = useState({ name: "", surname: "", relationship: "Parent", email: "", phone: "", consent: false });
  const [parentSent, setParentSent] = useState(false);

  const isMinor = useMemo(() => {
    const y = parseInt(dob.year, 10); const m = parseInt(dob.month, 10); const d = parseInt(dob.day, 10);
    if (!y || !m || !d) return null;
    const age = (Date.now() - new Date(y, m - 1, d).getTime()) / (365.25 * 24 * 3600 * 1000);
    return age < 18;
  }, [dob]);

  const handleContinue = () => {
    trustStore.setDob(dob);
    onNext();
  };

  return (
    <div className="p-8 md:p-12">
      <span className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--plum)]">04 · Age verification</span>
      <div className="mt-3 flex items-start gap-4">
        <div className="h-14 w-14 rounded-2xl grid place-items-center shrink-0" style={{ background: "var(--gradient-plum)" }}>
          <IdCard className="h-7 w-7 text-white" />
        </div>
        <div>
          <h2 className="text-4xl font-display">Age <span className="italic">verification</span></h2>
          <p className="mt-2 text-muted-foreground max-w-xl text-sm">
            To protect young users and comply with privacy regulations, we verify your age before creating a Digital Body Twin.
          </p>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-3 max-w-md">
        <Field label="Day"><input inputMode="numeric" maxLength={2} value={dob.day} onChange={(e) => setDob({ ...dob, day: e.target.value.replace(/\D/g, "") })} placeholder="DD" className="input" /></Field>
        <Field label="Month"><input inputMode="numeric" maxLength={2} value={dob.month} onChange={(e) => setDob({ ...dob, month: e.target.value.replace(/\D/g, "") })} placeholder="MM" className="input" /></Field>
        <Field label="Year"><input inputMode="numeric" maxLength={4} value={dob.year} onChange={(e) => setDob({ ...dob, year: e.target.value.replace(/\D/g, "") })} placeholder="YYYY" className="input" /></Field>
      </div>

      {isMinor === true && (
        <div className="mt-8 rounded-2xl border border-[color:var(--plum)]/30 bg-[color:var(--plum)]/5 p-6 animate-fade-up">
          <div className="flex items-center gap-2 text-[color:var(--plum)] font-medium">
            <Users className="h-4 w-4" /> Parent or guardian approval required
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Before using Mannequin AI, a parent or legal guardian must review and approve your account. Your account remains inactive until consent is confirmed.
          </p>
          {!parentSent ? (
            <div className="mt-5 grid md:grid-cols-2 gap-3">
              <Field label="Parent's name"><input className="input" value={parent.name} onChange={(e) => setParent({ ...parent, name: e.target.value })} /></Field>
              <Field label="Parent's surname"><input className="input" value={parent.surname} onChange={(e) => setParent({ ...parent, surname: e.target.value })} /></Field>
              <Field label="Relationship">
                <select className="input" value={parent.relationship} onChange={(e) => setParent({ ...parent, relationship: e.target.value })}>
                  <option>Parent</option><option>Legal guardian</option><option>Other</option>
                </select>
              </Field>
              <Field label="Email"><input type="email" className="input" value={parent.email} onChange={(e) => setParent({ ...parent, email: e.target.value })} /></Field>
              <Field label="Phone number"><input className="input" value={parent.phone} onChange={(e) => setParent({ ...parent, phone: e.target.value })} /></Field>
              <label className="md:col-span-2 flex items-start gap-3 text-xs text-muted-foreground">
                <input type="checkbox" checked={parent.consent} onChange={(e) => setParent({ ...parent, consent: e.target.checked })} className="mt-1" />
                I confirm I am the legal parent or guardian and give permission for this account to use Mannequin AI.
              </label>
              <div className="md:col-span-2 flex gap-3">
                <button
                  disabled={!parent.consent || !parent.email || !parent.name}
                  onClick={() => setParentSent(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium disabled:opacity-40"
                >
                  <Mail className="h-4 w-4" /> Send verification
                </button>
                <button className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm">Exit</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-card border border-border p-4 text-sm">
              <div className="font-medium">Secure verification link sent to {parent.email}.</div>
              <p className="text-muted-foreground mt-1 text-xs">
                Your account will activate once your parent or guardian confirms consent.
              </p>
            </div>
          )}
        </div>
      )}

      <NavRow
        onBack={onBack}
        onNext={handleContinue}
        nextDisabled={!dob.day || !dob.month || !dob.year || (isMinor === true && !parentSent)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
      <style>{`.input{width:100%;border:1px solid var(--border);background:var(--card);border-radius:0.75rem;padding:0.55rem 0.75rem;font-size:0.875rem;outline:none;transition:box-shadow .2s}.input:focus{box-shadow:0 0 0 3px color-mix(in oklab, var(--plum) 20%, transparent);border-color:var(--plum)}`}</style>
    </label>
  );
}

function Terms({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const cards = [
    { title: "Digital Body Twin", body: "We create your secure Digital Body Twin to provide accurate clothing recommendations." },
    { title: "Your privacy", body: "Only you control your body profile — every share is explicit and revocable." },
    { title: "Retail partners", body: "Retailers receive only what's necessary to personalise your shopping, based on your consent." },
    { title: "AI recommendations", body: "Recommendations are generated automatically — shopping guidance, not professional advice." },
    { title: "Community guidelines", body: "Respect others. No abuse, fraud or inappropriate content." },
  ];
  const [checks, setChecks] = useState({ tos: false, privacy: false, ai: false });
  const ready = checks.tos && checks.privacy && checks.ai;
  return (
    <div className="p-8 md:p-12">
      <span className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--plum)]">05 · Terms & conditions</span>
      <h2 className="mt-3 text-4xl font-display">The <span className="italic">short</span> version.</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-xl">The full documents are always available in the Trust Centre. Here's the essence.</p>

      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-border bg-secondary/30 p-5">
            <div className="text-xs uppercase tracking-wider text-[color:var(--plum)] mb-2">{c.title}</div>
            <div className="text-sm text-muted-foreground">{c.body}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3 max-w-xl">
        <Checkbox checked={checks.tos} onChange={(v) => setChecks({ ...checks, tos: v })} label="I have read and agree to the Terms of Service" />
        <Checkbox checked={checks.privacy} onChange={(v) => setChecks({ ...checks, privacy: v })} label="I have read and understand the Privacy Policy" />
        <Checkbox checked={checks.ai} onChange={(v) => setChecks({ ...checks, ai: v })} label="I consent to AI processing my body measurements to improve recommendations" />
      </div>

      <NavRow
        onBack={onBack}
        onNext={() => {
          trustStore.acceptConsents([
            { id: "tos", label: "Terms of Service" },
            { id: "privacy", label: "Privacy Policy" },
            { id: "ai", label: "AI processing of body measurements" },
          ]);
          onNext();
        }}
        nextLabel="Accept & continue"
        nextDisabled={!ready}
      />
    </div>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
      <span className={`mt-0.5 h-5 w-5 rounded-md border grid place-items-center transition ${checked ? "bg-[color:var(--plum)] border-[color:var(--plum)] text-white" : "border-border bg-card"}`}>
        {checked && <Check className="h-3.5 w-3.5" />}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span>{label}</span>
    </label>
  );
}

function Done({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="p-8 md:p-12 text-center">
      <div className="mx-auto h-24 w-24 rounded-full grid place-items-center" style={{ background: "var(--gradient-plum)" }}>
        <PartyPopper className="h-10 w-10 text-white" />
      </div>
      <h2 className="mt-6 text-4xl font-display">You're <span className="italic">ready</span>.</h2>
      <p className="mt-3 text-muted-foreground max-w-md mx-auto">
        Your account has been created, your Digital Body Twin is protected, and you can update your privacy settings at any time.
      </p>
      <div className="mt-6 grid sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
        <MiniStat icon={<ShieldCheck className="h-4 w-4" />} label="Encrypted twin" />
        <MiniStat icon={<UserCircle2 className="h-4 w-4" />} label="Private by default" />
        <MiniStat icon={<Sparkles className="h-4 w-4" />} label="Personalised" />
      </div>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <button onClick={onFinish} className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium">
          <ScanLine className="h-4 w-4" /> Create my Digital Twin
        </button>
        <Link to="/privacy" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-accent">
          Privacy settings
        </Link>
      </div>
    </div>
  );
}

function MiniStat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4 flex items-center gap-2 text-sm">
      <span className="text-[color:var(--plum)]">{icon}</span> {label}
    </div>
  );
}

function NavRow({ onBack, onNext, nextLabel = "Continue", nextDisabled = false }: { onBack?: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean }) {
  return (
    <div className="mt-10 flex items-center justify-between">
      {onBack ? (
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      ) : <span />}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium disabled:opacity-40"
      >
        {nextLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
