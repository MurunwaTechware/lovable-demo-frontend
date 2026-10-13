import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, Lock, X, ArrowRight, Mail } from "lucide-react";
import { useTrust } from "@/lib/trust-store";
import signupVisual from "@/assets/signup-visual.jpg";

export function SignupGate() {
  const trust = useTrust();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = sessionStorage.getItem("mannequin.signup.dismissed") === "1";
    if (!trust.onboarded && !dismissed) {
      const t = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(t);
    }
  }, [trust.onboarded]);

  if (!mounted || !open) return null;

  const close = () => {
    sessionStorage.setItem("mannequin.signup.dismissed", "1");
    setOpen(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree || !form.email) return;
    setOpen(false);
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4 animate-fade-up" role="dialog" aria-modal="true">
      <button onClick={close} aria-label="Close" className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-4xl rounded-[2rem] overflow-hidden bg-card shadow-[var(--shadow-lux)] grid md:grid-cols-2">
        <button onClick={close} className="absolute top-4 right-4 z-10 h-9 w-9 grid place-items-center rounded-full bg-card/80 backdrop-blur border border-border hover:bg-accent">
          <X className="h-4 w-4" />
        </button>

        {/* Left visual */}
        <div className="relative hidden md:block" style={{ background: "var(--gradient-plum)" }}>
          <img
            src={signupVisual}
            alt="Editorial fashion portrait — camel trench and ivory silk"
            width={1200}
            height={1600}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-luminosity"
          />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(180deg, rgba(60,15,30,0.35) 0%, rgba(60,15,30,0.85) 100%)",
          }} />
          <div className="relative h-full p-10 text-white flex flex-col">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] opacity-80">
              <Sparkles className="h-3.5 w-3.5" /> Mannequin AI
            </div>
            <div className="mt-auto">
              <h3 className="font-display text-3xl leading-tight">
                Your <em className="italic">Digital Body Twin</em>, protected from day one.
              </h3>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex gap-3"><ShieldCheck className="h-4 w-4 mt-0.5" /> Encrypted body scan — only you control access.</li>
                <li className="flex gap-3"><Lock className="h-4 w-4 mt-0.5" /> Retailers never receive your photos.</li>
                <li className="flex gap-3"><Sparkles className="h-4 w-4 mt-0.5" /> 96% average fit accuracy across 180+ stores.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="p-8 md:p-10">
          <span className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--plum)]">Create your account</span>
          <h2 className="mt-2 font-display text-3xl">Sign up to begin</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Free forever. No card required. Takes 60 seconds.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="block text-xs">
              <span className="text-muted-foreground">Full name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[color:var(--plum)]" />
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Email</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[color:var(--plum)]" />
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Password</span>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[color:var(--plum)]" />
            </label>

            <label className="flex items-start gap-3 pt-2 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[color:var(--plum)]" />
              <span className="text-xs text-muted-foreground">
                I agree to the <span className="underline text-foreground">Terms & Conditions</span> and understand that Mannequin AI will guide me through a secure onboarding flow to create my encrypted Digital Body Twin.
              </span>
            </label>

            <button type="submit" disabled={!agree || !form.email || !form.name || form.password.length < 8}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium disabled:opacity-40">
              Continue to onboarding <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 py-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="flex-1 h-px bg-border" /> or <span className="flex-1 h-px bg-border" />
            </div>

            <button type="button" className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-accent">
              <Mail className="h-4 w-4" /> Continue with Google
            </button>

            <p className="text-center text-xs text-muted-foreground pt-2">
              Already have an account? <button type="button" onClick={close} className="underline text-foreground">Sign in</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
