import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, ShieldCheck, Lock, X, ArrowRight, Loader2 } from "lucide-react";
import { useTrust } from "@/lib/trust-store";
import { accountStore, useAccountStatus, useSignInRequests } from "@/lib/account-store";
import {
  EmailNotVerified,
  authErrorMessage,
  createAccount,
  sendPasswordReset,
  signInEnabled,
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/auth";
import signupVisual from "@/assets/signup-visual.jpg";

const DISMISSED_KEY = "mannequin.signup.dismissed";

type Mode = "create" | "signin";

/**
 * The sign-in dialog. Opens by itself for visitors who aren't signed in (once per browser tab, if they
 * close it), and whenever a page asks for it, e.g. after a request the backend refused with 401.
 * Never opens when the backend has sign-in turned off: then everyone is its demo user.
 */
export function SignupGate() {
  const trust = useTrust();
  const status = useAccountStatus();
  const signInRequests = useSignInRequests();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean }>({ text: "" });
  const handledRequests = useRef(0);
  const [requested, setRequested] = useState(false);

  // Does the backend ask people to sign in at all? (Starts Firebase with the backend's settings.)
  useEffect(() => {
    if (status !== "signed-out") return;
    signInEnabled().then(setEnabled, (err) => {
      setEnabled(true); // show the dialog anyway, with the reason it can't sign in
      setMessage({ text: `Sign-in couldn't start: ${authErrorMessage(err)}`, error: true });
    });
  }, [status]);

  // Visitors who aren't signed in: open shortly after the page loads, unless closed earlier in this tab
  useEffect(() => {
    if (!enabled || status !== "signed-out") return;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      /* storage blocked: treat as not dismissed */
    }
    if (dismissed) return;
    const t = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(t);
  }, [enabled, status]);

  // A page asked for sign-in (e.g. a 401): open in "Sign in" mode, even if it was closed before.
  // Kept as pending until sign-in has started, since a session that just ran out is only now signed out.
  useEffect(() => {
    if (signInRequests === handledRequests.current) return;
    handledRequests.current = signInRequests;
    setRequested(true);
  }, [signInRequests]);
  useEffect(() => {
    if (!requested || !enabled || status !== "signed-out") return;
    setRequested(false);
    setMode("signin");
    setMessage({ text: "Please sign in to continue." });
    setOpen(true);
  }, [requested, enabled, status]);

  if (!open || status === "signed-in") return null;

  const close = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* storage blocked: it just opens again next page load */
    }
    setOpen(false);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setMessage({ text: "" });
  };

  /** Runs one sign-in step with the buttons disabled, and shows what went wrong if it fails. */
  const run = async (step: () => Promise<void>) => {
    setBusy(true);
    try {
      await step();
    } catch (err) {
      const text = err instanceof EmailNotVerified ? err.message : authErrorMessage(err);
      setMessage(text ? { text, error: true } : { text: "" });
    } finally {
      setBusy(false);
    }
  };

  /** Signed in: load the account, reload anything fetched while signed out, carry on. */
  const signedIn = async () => {
    setMessage({ text: "Signed in." });
    await accountStore.refresh();
    await queryClient.invalidateQueries();
    setOpen(false);
    if (!trust.onboarded) navigate({ to: "/onboarding" });
  };

  const withGoogle = () =>
    run(async () => {
      setMessage({ text: "Waiting for Google…" });
      await signInWithGoogle();
      await signedIn();
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.email.trim();
    if (mode === "create") {
      if (!agree) return;
      run(async () => {
        await createAccount(form.name.trim(), email, form.password);
        setForm((f) => ({ ...f, password: "" }));
        setMode("signin");
        setMessage({
          text: `Account created. We've sent a link to ${email}: open it, then sign in.`,
        });
      });
    } else {
      run(async () => {
        setMessage({ text: "Signing in…" });
        await signInWithEmail(email, form.password);
        await signedIn();
      });
    }
  };

  const forgot = () => {
    const email = form.email.trim();
    if (!email) {
      setMessage({ text: "Enter your email above first.", error: true });
      return;
    }
    run(async () => {
      await sendPasswordReset(email);
      // Same message whether or not the account exists, so this can't be used to find out
      setMessage({
        text: `If there's an account for ${email}, we've sent it a link to reset the password.`,
      });
    });
  };

  const creating = mode === "create";
  const canSubmit = creating
    ? agree && !!form.name.trim() && !!form.email.trim() && form.password.length >= 8
    : !!form.email.trim() && !!form.password;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-4 animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-title"
    >
      <button
        onClick={close}
        aria-label="Close"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-4xl rounded-[2rem] overflow-hidden bg-card shadow-[var(--shadow-lux)] grid md:grid-cols-2">
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 h-9 w-9 grid place-items-center rounded-full bg-card/80 backdrop-blur border border-border hover:bg-accent"
        >
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
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(60,15,30,0.35) 0%, rgba(60,15,30,0.85) 100%)",
            }}
          />
          <div className="relative h-full p-10 text-white flex flex-col">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] opacity-80">
              <Sparkles className="h-3.5 w-3.5" /> Mannequin AI
            </div>
            <div className="mt-auto">
              <h3 className="font-display text-3xl leading-tight">
                Your <em className="italic">Digital Body Twin</em>, protected from day one.
              </h3>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex gap-3">
                  <ShieldCheck className="h-4 w-4 mt-0.5" /> Encrypted body scan — only you control
                  access.
                </li>
                <li className="flex gap-3">
                  <Lock className="h-4 w-4 mt-0.5" /> Retailers never receive your photos.
                </li>
                <li className="flex gap-3">
                  <Sparkles className="h-4 w-4 mt-0.5" /> 96% average fit accuracy across 180+
                  stores.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="p-8 md:p-10">
          <span className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--plum)]">
            {creating ? "Create your account" : "Welcome back"}
          </span>
          <h2 id="signin-title" className="mt-2 font-display text-3xl">
            {creating ? "Sign up to begin" : "Sign in"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {creating
              ? "Free forever. No card required. Takes 60 seconds."
              : "Use Google, or your email and password."}
          </p>

          <button
            type="button"
            onClick={withGoogle}
            disabled={busy}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <GoogleMark /> Continue with Google
          </button>

          <div className="flex items-center gap-3 py-4 text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="flex-1 h-px bg-border" /> or <span className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {creating && (
              <label className="block text-xs">
                <span className="text-muted-foreground">Full name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoComplete="name"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[color:var(--plum)]"
                />
              </label>
            )}
            <label className="block text-xs">
              <span className="text-muted-foreground">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[color:var(--plum)]"
              />
            </label>
            <label className="block text-xs">
              <span className="flex items-center justify-between">
                <span className="text-muted-foreground">Password</span>
                {!creating && (
                  <button
                    type="button"
                    onClick={forgot}
                    disabled={busy}
                    className="text-[color:var(--plum)] hover:underline disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                )}
              </span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={creating ? 8 : undefined}
                autoComplete={creating ? "new-password" : "current-password"}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[color:var(--plum)]"
              />
            </label>

            {creating && (
              <label className="flex items-start gap-3 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[color:var(--plum)]"
                />
                <span className="text-xs text-muted-foreground">
                  I agree to the{" "}
                  <span className="underline text-foreground">Terms & Conditions</span> and
                  understand that Mannequin AI will guide me through a secure onboarding flow to
                  create my encrypted Digital Body Twin.
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={busy || !canSubmit}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {creating ? "Create account" : "Sign in"}{" "}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>

            <p
              role="status"
              aria-live="polite"
              className={`min-h-5 text-sm ${message.error ? "text-[color:var(--plum)]" : "text-muted-foreground"}`}
            >
              {message.text}
            </p>

            <p className="text-center text-xs text-muted-foreground">
              {creating ? "Already have an account? " : "New here? "}
              <button
                type="button"
                onClick={() => switchMode(creating ? "signin" : "create")}
                className="underline text-foreground"
              >
                {creating ? "Sign in" : "Create an account"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

/** Google's "G", as on its own sign-in buttons. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
