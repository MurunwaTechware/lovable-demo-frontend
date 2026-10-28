// Sign-in with Firebase Authentication, the same way as the backend's own /login page
// (gemini-ai-virtual-try-on/static/login.html). Firebase only does the signing in: the page then sends
// the result to the backend's POST /session, which sets an HttpOnly session cookie. That cookie is what
// keeps the user signed in; nothing is kept in browser storage, and the page never sees it.
//
// The Firebase settings come from the backend (GET /auth/config), so they live in one place. When the
// backend has sign-in turned off (AUTH_ENABLED=false) that says { enabled: false }, and there's nothing
// to start: every request is the backend's demo user.
//
// Firebase is loaded on first use, in the browser only (pages are also rendered on the server).

import type { Auth, User, UserCredential } from "firebase/auth";

type AuthConfig =
  | { enabled: false }
  | { enabled: true; apiKey: string; authDomain: string; projectId: string };

let started: Promise<Auth | null> | null = null;

/** Firebase Auth, started with the backend's settings. null when the backend has sign-in turned off. */
export function startAuth(): Promise<Auth | null> {
  started ??= (async () => {
    const res = await fetch("/auth/config");
    if (!res.ok) throw new Error(`Couldn't load the sign-in settings (${res.status}).`);
    const { enabled, ...config } = (await res.json()) as AuthConfig & Record<string, string>;
    if (!enabled) return null;
    const [{ initializeApp, getApps }, { getAuth, setPersistence, inMemoryPersistence }] =
      await Promise.all([import("firebase/app"), import("firebase/auth")]);
    const app = getApps()[0] ?? initializeApp(config);
    const auth = getAuth(app);
    // Keep nothing in browser storage: the backend's cookie is the sign-in
    await setPersistence(auth, inMemoryPersistence);
    return auth;
  })().catch((err) => {
    started = null; // let the next attempt try again
    throw err;
  });
  return started;
}

/** Whether the backend asks people to sign in. False when it has sign-in turned off. */
export async function signInEnabled() {
  return (await startAuth()) !== null;
}

async function requireAuth() {
  const auth = await startAuth();
  if (!auth) throw new Error("Sign-in is turned off on the server.");
  return auth;
}

/** Swap Firebase's sign-in for the backend's session cookie, then drop Firebase's own copy. */
async function finishSignIn(auth: Auth, user: User) {
  const res = await fetch("/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: await user.getIdToken() }),
  });
  const { signOut } = await import("firebase/auth");
  await signOut(auth);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      typeof data.detail === "string" ? data.detail : `Sign-in failed (${res.status}).`,
    );
  }
}

/** Runs a Firebase step; on failure, signs Firebase out again so a half-finished sign-in isn't kept. */
async function attempt<T>(auth: Auth, step: () => Promise<T>): Promise<T> {
  try {
    return await step();
  } catch (err) {
    const { signOut } = await import("firebase/auth");
    await signOut(auth).catch(() => {});
    throw err;
  }
}

/** Firebase keeps the picture from the first Google sign-in; Google sends the current one each time. */
async function useCurrentGooglePicture(result: UserCredential) {
  const { getAdditionalUserInfo, updateProfile } = await import("firebase/auth");
  const picture = getAdditionalUserInfo(result)?.profile?.picture;
  if (typeof picture !== "string" || picture === result.user.photoURL) return;
  try {
    await updateProfile(result.user, { photoURL: picture });
    await result.user.getIdToken(true); // the fresh token carries it to the backend's user record
  } catch {
    /* keep the old picture rather than fail the sign-in */
  }
}

export async function signInWithGoogle() {
  const auth = await requireAuth();
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  await attempt(auth, async () => {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    await useCurrentGooglePicture(result);
    await finishSignIn(auth, result.user);
  });
}

/** Thrown when the email still needs verifying. A fresh verification link has been sent. */
export class EmailNotVerified extends Error {}

export async function signInWithEmail(email: string, password: string) {
  const auth = await requireAuth();
  const { signInWithEmailAndPassword, sendEmailVerification, signOut } =
    await import("firebase/auth");
  await attempt(auth, async () => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    if (!user.emailVerified) {
      // The backend won't start a session for an unverified email, so send a fresh link instead.
      // Firebase limits how often it sends these; if it refuses, the earlier link still works.
      await sendEmailVerification(user).catch(() => {});
      await signOut(auth);
      throw new EmailNotVerified(
        `Verify your email first: we've sent a link to ${email}. Open it, then sign in.`,
      );
    }
    await finishSignIn(auth, user);
  });
}

/** Creates the account and emails a verification link. No session until the email is verified. */
export async function createAccount(name: string, email: string, password: string) {
  const auth = await requireAuth();
  const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } =
    await import("firebase/auth");
  await attempt(auth, async () => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: name });
    await sendEmailVerification(user);
    await signOut(auth);
  });
}

/** Same result whether or not the account exists, so this can't be used to find out. */
export async function sendPasswordReset(email: string) {
  const auth = await requireAuth();
  const { sendPasswordResetEmail } = await import("firebase/auth");
  await sendPasswordResetEmail(auth, email);
}

/** Ends the backend session in this browser. Other devices stay signed in. */
export async function endSession() {
  const res = await fetch("/logout", { method: "POST" });
  if (!res.ok) throw new Error(`Couldn't sign out (${res.status}). Please try again.`);
}

const MESSAGES: Record<string, string> = {
  "auth/popup-blocked":
    "The browser blocked the sign-in window. Allow pop-ups for this site and try again.",
  "auth/unauthorized-domain":
    "This address isn't on Firebase's authorised domains list (Authentication → Settings).",
  "auth/operation-not-allowed":
    "This sign-in method isn't turned on in Firebase (Authentication → Sign-in method).",
  "auth/configuration-not-found":
    "Sign-in isn't set up in Firebase yet (Authentication → Get started).",
  "auth/network-request-failed": "Couldn't reach Google. Check your connection and try again.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  // Firebase doesn't say whether the email exists (email enumeration protection), so neither do we
  "auth/invalid-credential":
    "Wrong email or password. If you signed up with Google, use Continue with Google.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/missing-password": "Enter your password.",
  "auth/weak-password": "That password is too weak. Use at least 8 characters.",
  "auth/email-already-in-use":
    "There's already an account for this email. Sign in, or use Continue with Google.",
  "auth/account-exists-with-different-credential":
    "There's already an account for this email. Sign in with your email and password.",
};

/** A message to show for a failed sign-in step. Empty when the user just closed Google's window. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code;
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "";
  if (code && MESSAGES[code]) return MESSAGES[code];
  return err instanceof Error ? err.message : "Sign-in failed. Please try again.";
}
