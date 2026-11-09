// Calls to the FastAPI backend (gemini-ai-virtual-try-on). In development the Vite dev server forwards
// these paths to the backend (vite.config.ts), so they're plain same-origin requests and the backend's
// session cookie, when sign-in is on, goes along by itself.
//
// Shapes here are the backend's own (snake_case). twin-store.ts turns them into the app's types.

import { accountStore } from "@/lib/account-store";
import bodyShapes from "@/lib/body-shapes.json";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** The backend's message for an error response: FastAPI puts it in `detail`. */
function messageFrom(data: unknown, status: number) {
  const detail = (data as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (status === 401) return "Please sign in to continue.";
  if (status === 502 || status === 503 || status === 504 || status === 0)
    return "Can't reach the measuring service right now. Is the backend running?";
  return `Something went wrong (${status}). Please try again.`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { credentials: "same-origin", ...init });
  } catch {
    throw new ApiError(messageFrom(null, 0), 0);
  }
  const data = await res.json().catch(() => null);
  if (res.status === 401) accountStore.sessionEnded(); // not signed in, or the session ran out
  if (!res.ok) throw new ApiError(messageFrom(data, res.status), res.status);
  return data as T;
}

// ── Measurement profiles ──────────────────────────────────────────────────────

export type BackendInputs = { height_cm: number; weight_kg: number; gender: string; age: number };
export type BackendBodyShape = { build: string; torso_percent: number };

/** GET /me/measurement-profiles, newest first */
export type BackendProfile = {
  job_id: string;
  created: string;
  status: "ready" | "failed" | "measuring"; // "measuring" also covers a job that never finished
  error: string | null;
  inputs: BackendInputs | null;
  body_shape: BackendBodyShape | null;
  photo: string | null;
  photos?: Record<"front" | "left" | "right", string | null>;
};

/** GET /measurements_data/{job}: the profile's measurement.json */
export type BackendMeasurement = {
  job_id: string;
  created_at: string;
  model: string;
  inputs: BackendInputs;
  body_shape: BackendBodyShape;
  measurements_cm: Record<string, number>;
  warnings: string[];
};

export const getProfiles = () => request<BackendProfile[]>("/me/measurement-profiles");
export const getMeasurement = (jobId: string) =>
  request<BackendMeasurement>(`/measurements_data/${encodeURIComponent(jobId)}`);

/** POST /process_upload: starts measuring and returns the new job's ID */
export const uploadScan = (form: FormData) =>
  request<{ job_id: string }>("/process_upload", { method: "POST", body: form });

/**
 * Waits for a measurement job on GET /job_events/{job} (Server-Sent Events). The server sends exactly
 * one `ready` or `failed` event. Returns a function that stops listening.
 */
export function watchJob(
  jobId: string,
  on: { ready: () => void; failed: (message: string) => void },
  giveUpMs = 330_000, // just past the server's own 5-minute limit, so normally the server reports first
) {
  const events = new EventSource(`/job_events/${encodeURIComponent(jobId)}`);
  const stop = () => {
    events.close(); // otherwise EventSource reconnects on its own
    clearTimeout(timer);
  };
  const timer = setTimeout(() => {
    stop();
    on.failed("This is taking longer than expected. Please try again.");
  }, giveUpMs);
  events.addEventListener("ready", () => {
    stop();
    on.ready();
  });
  // Named "failed" by the server, because EventSource uses "error" for connection problems
  events.addEventListener("failed", (e) => {
    stop();
    on.failed(JSON.parse((e as MessageEvent).data).error);
  });
  events.onerror = () => {
    // A dropped connection retries by itself (CONNECTING). CLOSED means the browser gave up.
    if (events.readyState === EventSource.CLOSED) {
      stop();
      on.failed("Lost connection to the server. Please try again.");
    }
  };
  return stop;
}

// ── Try-on ────────────────────────────────────────────────────────────────────

/** GET /me/saved-tryons, newest first. Images are addresses on the backend (/me/files/...). */
export type BackendSavedTryOn = {
  saved_id: string;
  saved: string;
  measurement_profile: string | null;
  result: string | null;
  person: string | null;
  garments: Record<string, string>; // slot (top, bottom, headwear, eyewear) → image address
};

export type TryOnResult =
  | { ok: true; mime_type: string; data: string; model_text: string | null }
  | { ok: false; error: string };

export const getSavedTryOns = () => request<BackendSavedTryOn[]>("/me/saved-tryons");
export const getTryOnDefaults = () =>
  request<{ prompt: string; model: string; max_outputs: number }>("/defaults");
/** POST /try-on: person + items + prompt + count. Nothing is kept until /try-on/save. */
export const generateTryOn = (form: FormData) =>
  request<{ model: string; garments: string[]; results: TryOnResult[] }>("/try-on", {
    method: "POST",
    body: form,
  });
export const saveTryOn = (form: FormData) =>
  request<{ saved_id: string }>("/try-on/save", { method: "POST", body: form });

// ── Try-on photos ─────────────────────────────────────────────────────────────

/**
 * GET /me/tryon-photos: the signed-in user's own full body and close-up photo. "uploaded" is one they
 * added on the twin page; "scan" (full body only) is the front photo of their latest finished scan.
 * null when they have neither, and the app shows its sample photo.
 */
export type BackendTryOnPhoto = { url: string; added: string; source: "uploaded" | "scan" };
export type BackendTryOnPhotos = Record<"full_body" | "close_up", BackendTryOnPhoto | null>;

export const getTryOnPhotos = () => request<BackendTryOnPhotos>("/me/tryon-photos");
/** PUT /me/tryon-photos/{kind}: replace one for this user only. Answers with both photos. */
export function replaceTryOnPhoto(kind: "full_body" | "close_up", photo: File) {
  const form = new FormData();
  form.append("photo", photo);
  return request<BackendTryOnPhotos>(`/me/tryon-photos/${kind}`, { method: "PUT", body: form });
}
/** DELETE /me/tryon-photos/{kind}: back to the scan photo or the sample. Answers with both photos. */
export const removeTryOnPhoto = (kind: "full_body" | "close_up") =>
  request<BackendTryOnPhotos>(`/me/tryon-photos/${kind}`, { method: "DELETE" });

// ── Body profile (the onboarding questionnaire) ───────────────────────────────

export type MeasurementSource = "base" | "questionnaire" | "scan" | "manual";
export type MeasurementKey =
  | "height"
  | "bust"
  | "underbust"
  | "waist"
  | "hip"
  | "inside_leg"
  | "head"
  | "neck"
  | "shoulder_breadth"
  | "arm_length"
  | "bicep"
  | "forearm"
  | "wrist"
  | "shoulder_to_crotch"
  | "thigh"
  | "calf"
  | "ankle"
  | "upper_arm_length"
  | "lower_arm_length"
  | "upper_leg_length"
  | "lower_leg_length"
  | "nape_to_waist";
export type BackendMeasurementValue = {
  value: number;
  min?: number | null;
  max?: number | null;
  source: MeasurementSource;
};
export type BodyType = "slim" | "average" | "fuller";
export type BodyProfileAnswers = {
  sex: "female" | "male";
  body_type: BodyType;
  weight_kg: number | null;
  waist: { system: "jeans_inches" | "dress_size"; size: number } | null;
  bra: { band: number; band_system: "inches" | "cm"; cup: string } | null;
  measurements: Partial<Record<MeasurementKey, BackendMeasurementValue>>;
  /** The scan the measurements came from, if they did */
  scan_job?: string | null;
};
/** The twin's mesh, made by the backend on every save (twin_mesh.py) */
export type TwinMesh = {
  file: string; // served at /me/twin/<file>
  base_body: string;
  weights: Record<string, number>;
  predicted: Partial<Record<MeasurementKey, number>>;
  shapes_version: string;
  app_shapes_version: string | null;
  made_at: string;
};
export type BodyProfile = BodyProfileAnswers & {
  version: number;
  updated_at: string;
  /** null when it couldn't be made (the measurements are still saved) */
  mesh?: TwinMesh | null;
};

/** GET /me/body-profile: null before the user has done the questionnaire */
export const getBodyProfile = () =>
  request<{ profile: BodyProfile | null }>("/me/body-profile").then((r) => r.profile);
/**
 * PUT /me/body-profile: replaces the user's twin, and the backend makes its mesh. Says which shape files
 * the app has, so a mesh built from different ones (the backend's copy out of date) is noted.
 */
export const saveBodyProfile = (answers: BodyProfileAnswers) =>
  request<{ profile: BodyProfile }>("/me/body-profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...answers, shapes_version: bodyShapes.version }),
  }).then((r) => r.profile);

/** Where the twin's saved mesh is served */
export const twinMeshUrl = (mesh: TwinMesh) => `/me/twin/${encodeURIComponent(mesh.file)}`;

// ── About you ─────────────────────────────────────────────────────────────────

/** Onboarding's quick answers, all optional (GET/PUT /me/about-you) */
export type AboutYouAnswers = {
  sex: "female" | "male" | null;
  height_cm: number | null;
  weight_kg: number | null;
  favourite_colour: string | null;
};
export type AboutYou = AboutYouAnswers & { updated_at: string };

/** GET /me/about-you: null before the user has answered */
export const getAboutYou = () =>
  request<{ about: AboutYou | null }>("/me/about-you").then((r) => r.about);
/** PUT /me/about-you: replaces the answers */
export const saveAboutYou = (answers: AboutYouAnswers) =>
  request<{ about: AboutYou }>("/me/about-you", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(answers),
  }).then((r) => r.about);
