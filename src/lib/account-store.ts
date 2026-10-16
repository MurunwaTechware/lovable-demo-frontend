// The signed-in user: the top bar's account button and the /account pages.
//
// MOCK until sign-in is connected. The shapes follow the backend (camelCased here):
//   GET /me                    → { uid, email, name, first_name, last_name, phone, photo_url }
//   PATCH /me                  → change first_name, last_name, phone (only the fields sent)
//   GET /me/sign-in-methods    → { google, password }
// Not in the backend yet: date of birth (PATCH /me would need a date_of_birth field), deleting the account.

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

// Sample person, not a real account
let account: Account | null = {
  uid: "demo-user",
  email: "ava@example.com",
  firstName: "Ava",
  lastName: "Mokoena",
  phone: "+27 82 555 0143",
  dateOfBirth: "1999-03-14",
  photoUrl: null,
  signInMethods: { google: false, password: true },
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const accountStore = {
  get: () => account,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Demo for PATCH /me. Changes stay until the page reloads. */
  update(changes: DetailsUpdate) {
    if (!account) return;
    account = { ...account, ...changes };
    emit();
  },
};

export function useAccount() {
  return useSyncExternalStore(accountStore.subscribe, accountStore.get, accountStore.get);
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
