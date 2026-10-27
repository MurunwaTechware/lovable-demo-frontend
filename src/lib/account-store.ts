// The signed-in user: the top bar's account button, the sign-in dialog and the /account pages.
//
// Comes from the backend, which knows who's signed in from its HttpOnly session cookie (lib/auth.ts):
//   GET /me                    → { uid, email, name, first_name, last_name, phone, photo_url }, or 401
//   PATCH /me                  → change first_name, last_name, phone (only the fields sent)
//   GET /me/sign-in-methods    → { google, password }
// With sign-in turned off on the backend, /me answers with its demo user.
// Not in the backend yet: date of birth (kept in this browser tab only), deleting the account.

import { useSyncExternalStore } from "react";

export type SignInMethods = { google: boolean; password: boolean };

export type Account = {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null; // YYYY-MM-DD
  photoUrl: string | null;
  signInMethods: SignInMethods;
};

export type DetailsUpdate = Partial<
  Pick<Account, "firstName" | "lastName" | "phone" | "dateOfBirth">
>;

/** "loading" until the backend has answered; pages rendered on the server stay "loading". */
export type AccountStatus = "loading" | "signed-in" | "signed-out";

type BackendMe = {
  uid: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  photo_url: string | null;
};

let status: AccountStatus = "loading";
let account: Account | null = null;
let loading: Promise<void> | null = null;
let signInRequests = 0; // bumped when a page needs the user to sign in; the sign-in dialog opens on it

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const fromBackend = (
  me: BackendMe,
  methods: SignInMethods,
  dateOfBirth: string | null,
): Account => ({
  uid: me.uid,
  email: me.email ?? "",
  firstName: me.first_name ?? "",
  lastName: me.last_name ?? "",
  phone: me.phone,
  dateOfBirth,
  photoUrl: me.photo_url,
  signInMethods: methods,
});

async function load() {
  try {
    const res = await fetch("/me", { credentials: "same-origin" });
    if (!res.ok) {
      // 401: not signed in. Anything else (backend down): treated the same, so the page still works
      account = null;
      status = "signed-out";
      return;
    }
    const me = (await res.json()) as BackendMe;
    const methodsRes = await fetch("/me/sign-in-methods", { credentials: "same-origin" });
    const methods: SignInMethods = methodsRes.ok
      ? await methodsRes.json()
      : { google: false, password: false };
    account = fromBackend(me, methods, account?.uid === me.uid ? account.dateOfBirth : null);
    status = "signed-in";
  } catch {
    account = null;
    status = "signed-out";
  } finally {
    emit();
  }
}

function errorFrom(data: unknown, status: number) {
  const detail = (data as { detail?: unknown } | null)?.detail;
  return typeof detail === "string" ? detail : `Couldn't save your details (${status}).`;
}

export const accountStore = {
  get: () => account,
  getStatus: () => status,
  getSignInRequests: () => signInRequests,
  subscribe(listener: () => void) {
    listeners.add(listener);
    // The first page to show the account asks the backend who's signed in (browser only)
    if (typeof window !== "undefined" && status === "loading" && !loading) {
      loading = load();
    }
    return () => listeners.delete(listener);
  },
  /** Ask the backend again, e.g. right after signing in. */
  refresh() {
    loading = load();
    return loading;
  },
  /** Signed out: forget the account straight away. */
  clear() {
    account = null;
    status = "signed-out";
    emit();
  },
  /** Open the sign-in dialog, e.g. from a "Sign in" button. */
  requestSignIn() {
    signInRequests += 1;
    emit();
  },
  /** A request answered 401: not signed in, or the session ran out. Forget the account and ask to sign in. */
  sessionEnded() {
    account = null;
    status = "signed-out";
    signInRequests += 1;
    emit();
  },
  /** PATCH /me for name, surname and phone. Date of birth isn't in the backend yet, so it stays here. */
  async update(changes: DetailsUpdate) {
    if (!account) return;
    const body: Record<string, string | null> = {};
    if ("firstName" in changes) body.first_name = changes.firstName ?? null;
    if ("lastName" in changes) body.last_name = changes.lastName ?? null;
    if ("phone" in changes) body.phone = changes.phone ?? null;
    let me: BackendMe | null = null;
    if (Object.keys(body).length) {
      const res = await fetch("/me", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401) accountStore.sessionEnded();
      if (!res.ok) throw new Error(errorFrom(data, res.status));
      me = data as BackendMe;
    }
    const dateOfBirth =
      "dateOfBirth" in changes ? (changes.dateOfBirth ?? null) : account.dateOfBirth;
    account = me
      ? fromBackend(me, account.signInMethods, dateOfBirth)
      : { ...account, dateOfBirth };
    emit();
  },
};

export function useAccount() {
  return useSyncExternalStore(accountStore.subscribe, accountStore.get, () => null);
}

export function useAccountStatus() {
  return useSyncExternalStore(
    accountStore.subscribe,
    accountStore.getStatus,
    () => "loading" as const,
  );
}

/** Changes each time something asks for the sign-in dialog. */
export function useSignInRequests() {
  return useSyncExternalStore(accountStore.subscribe, accountStore.getSignInRequests, () => 0);
}

export function fullName(a: Pick<Account, "firstName" | "lastName">) {
  return [a.firstName, a.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

/** Ava Mokoena -> "AM", only "Ava" -> "A". Falls back to the email's first letter. */
export function initials(a: Pick<Account, "firstName" | "lastName" | "email">) {
  const letters = [a.firstName, a.lastName].map((s) => s.trim()[0] ?? "").join("");
  return (letters || a.email[0] || "?").toUpperCase();
}

// ── Checks for the details form. Same rules as the backend's PATCH /me ─────────

export const MAX_NAME = 60;

export function checkName(value: string, label: string): string | null {
  const v = value.trim();
  if (!v) return `Enter your ${label}.`;
  if (v.length > MAX_NAME) return `Names can be up to ${MAX_NAME} characters.`;
  return null;
}

// Same as the backend's PHONE pattern: digits, spaces, brackets and dashes, an optional +, and at least 7 digits
const PHONE = /^\+?[0-9 ()-]{7,20}$/;

export function checkPhone(value: string): string | null {
  const v = value.trim().replace(/\s+/g, " ");
  if (!v) return null; // optional
  if (!PHONE.test(v) || (v.match(/\d/g) ?? []).length < 7) {
    return "Enter a phone number in digits, e.g. 082 123 4567 or +27 82 123 4567.";
  }
  return null;
}

export const MIN_AGE = 13;

/** The latest date of birth allowed (MIN_AGE years ago today), as YYYY-MM-DD. */
export function latestBirthDate(today = new Date()) {
  const d = new Date(today);
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d.toISOString().slice(0, 10);
}

export function checkDateOfBirth(value: string): string | null {
  if (!value) return null; // optional
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)))
    return "Enter a valid date.";
  if (value < "1900-01-01") return "Check the year.";
  if (value > latestBirthDate()) return `You need to be at least ${MIN_AGE} to use Mannequin AI.`;
  return null;
}

export function formatBirthDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
