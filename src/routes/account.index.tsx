import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, KeyRound, Mail, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Field, Panel, buttonClass, inputClass } from "@/components/AccountUI";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  accountStore,
  checkDateOfBirth,
  checkName,
  checkPhone,
  formatBirthDate,
  latestBirthDate,
  useAccount,
  type Account,
} from "@/lib/account-store";

export const Route = createFileRoute("/account/")({
  component: AccountDetails,
});

function AccountDetails() {
  const account = useAccount();
  if (!account) return null; // the layout shows the signed-out message

  return (
    <div className="space-y-6">
      <PersonalInfo account={account} />
      <SignInSecurity account={account} />
      <DeleteAccount email={account.email} />
    </div>
  );
}

// ── Personal information ──────────────────────────────────────────────────────

type Draft = { firstName: string; lastName: string; phone: string; dateOfBirth: string };
type Errors = Partial<Record<keyof Draft, string | null>>;

const toDraft = (a: Account): Draft => ({
  firstName: a.firstName,
  lastName: a.lastName,
  phone: a.phone ?? "",
  dateOfBirth: a.dateOfBirth ?? "",
});

function PersonalInfo({ account }: { account: Account }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(account));
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  const startEditing = () => {
    setDraft(toDraft(account));
    setErrors({});
    setSaved(false);
    setEditing(true);
  };

  const set = (field: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((d) => ({ ...d, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: null }));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const found: Errors = {
      firstName: checkName(draft.firstName, "name"),
      lastName: checkName(draft.lastName, "surname"),
      phone: checkPhone(draft.phone),
      dateOfBirth: checkDateOfBirth(draft.dateOfBirth),
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    // Demo for PATCH /me. Spaces are tidied the same way the backend does it.
    const tidy = (s: string) => s.trim().replace(/\s+/g, " ");
    accountStore.update({
      firstName: tidy(draft.firstName),
      lastName: tidy(draft.lastName),
      phone: tidy(draft.phone) || null,
      dateOfBirth: draft.dateOfBirth || null,
    });
    setEditing(false);
    setSaved(true);
  };

  const rows: [string, string | null][] = [
    ["Name", account.firstName],
    ["Surname", account.lastName],
    ["Contact number", account.phone],
    ["Date of birth", account.dateOfBirth ? formatBirthDate(account.dateOfBirth) : null],
  ];

  return (
    <Panel
      id="personal"
      title="Personal information"
      description="Stores use these for your orders and deliveries."
      action={
        !editing && (
          <div className="flex items-center gap-3">
            {saved && (
              <span
                className="inline-flex items-center gap-1 text-sm text-[color:var(--plum)]"
                role="status"
              >
                <Check className="h-4 w-4" /> Saved
              </span>
            )}
            <button type="button" onClick={startEditing} className={buttonClass.secondary}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          </div>
        )
      }
    >
      {editing ? (
        <form onSubmit={save} noValidate>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Name" error={errors.firstName}>
              <input
                value={draft.firstName}
                onChange={set("firstName")}
                autoComplete="given-name"
                maxLength={80}
                className={inputClass(!!errors.firstName)}
                aria-invalid={!!errors.firstName}
                autoFocus
              />
            </Field>
            <Field label="Surname" error={errors.lastName}>
              <input
                value={draft.lastName}
                onChange={set("lastName")}
                autoComplete="family-name"
                maxLength={80}
                className={inputClass(!!errors.lastName)}
                aria-invalid={!!errors.lastName}
              />
            </Field>
            <Field
              label="Contact number"
              hint="Optional. For delivery updates."
              error={errors.phone}
            >
              <input
                type="tel"
                inputMode="tel"
                value={draft.phone}
                onChange={set("phone")}
                autoComplete="tel"
                placeholder="e.g. 082 123 4567"
                maxLength={25}
                className={inputClass(!!errors.phone)}
                aria-invalid={!!errors.phone}
              />
            </Field>
            <Field label="Date of birth" hint="Optional." error={errors.dateOfBirth}>
              <input
                type="date"
                value={draft.dateOfBirth}
                onChange={set("dateOfBirth")}
                autoComplete="bday"
                min="1900-01-01"
                max={latestBirthDate()}
                className={inputClass(!!errors.dateOfBirth)}
                aria-invalid={!!errors.dateOfBirth}
              />
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" className={buttonClass.primary}>
              Save changes
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={buttonClass.secondary}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</dt>
              <dd className={`mt-1 ${value ? "" : "text-muted-foreground italic"}`}>
                {value || "Not added"}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Panel>
  );
}

// ── Sign-in and password ──────────────────────────────────────────────────────

function SignInSecurity({ account }: { account: Account }) {
  const [resetSent, setResetSent] = useState(false);
  const { google, password } = account.signInMethods;

  // Demo. With Firebase: sendPasswordResetEmail(auth, email) from the browser. Firebase sends the email and
  // hosts the page where they choose the new password, so the backend isn't involved.
  const sendReset = () => setResetSent(true);

  return (
    <Panel
      title="Sign-in & security"
      description="Your email is how you sign in, so it can't be changed here."
    >
      <div className="divide-y divide-border">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Email</div>
              <div className="truncate">{account.email}</div>
            </div>
          </div>
          {google && <span className="text-sm text-muted-foreground">Signed in with Google</span>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-center gap-3">
            <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Password
              </div>
              <div>
                {password
                  ? "••••••••••"
                  : "You sign in with Google, so there's no password to reset."}
              </div>
            </div>
          </div>
          {password && (
            <button
              type="button"
              onClick={sendReset}
              disabled={resetSent}
              className={buttonClass.secondary}
            >
              {resetSent ? "Link sent" : "Reset password"}
            </button>
          )}
        </div>
      </div>

      {resetSent && (
        <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm" role="status">
          We've emailed a link to <strong className="font-medium">{account.email}</strong>. Open it
          to choose a new password. If it isn't there in a few minutes, check your spam folder.
        </p>
      )}
    </Panel>
  );
}

// ── Delete account ────────────────────────────────────────────────────────────

const CONFIRM_WORD = "DELETE";

function DeleteAccount({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const navigate = useNavigate();

  // Demo: nothing is deleted. A real delete needs a backend route (there isn't one yet) that removes the
  // user's folder in storage, their Firestore record and the Firebase user, then clears the session cookie.
  const confirmDelete = () => {
    setOpen(false);
    navigate({ to: "/" });
  };

  return (
    <>
      <Panel
        title="Delete account"
        tone="danger"
        description="Permanently removes your account and everything in it. This can't be undone."
        action={
          <button
            type="button"
            onClick={() => {
              setTyped("");
              setOpen(true);
            }}
            className={buttonClass.danger}
          >
            <Trash2 className="h-4 w-4" /> Delete account
          </button>
        }
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Delete your account?</DialogTitle>
            <DialogDescription>
              This deletes <strong className="font-medium text-foreground">{email}</strong> and
              everything in it:
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Your measurements and the photos you scanned with</li>
            <li>Your try-on photo and saved try-ons</li>
            <li>Your wishlist and the stores you follow</li>
            <li>Saved cards, loyalty points and gift voucher balances</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Want a copy first? Download your data from the{" "}
            <Link to="/trust" className="underline hover:text-foreground">
              Help centre
            </Link>
            .
          </p>
          <Field label={`Type ${CONFIRM_WORD} to confirm`}>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className={inputClass(false)}
            />
          </Field>
          <DialogFooter className="gap-2 sm:gap-2">
            <button type="button" onClick={() => setOpen(false)} className={buttonClass.secondary}>
              Keep my account
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={typed.trim().toUpperCase() !== CONFIRM_WORD}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 text-white px-5 h-10 text-sm font-medium hover:bg-red-700 transition disabled:opacity-40 disabled:pointer-events-none"
            >
              <Trash2 className="h-4 w-4" /> Delete forever
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
