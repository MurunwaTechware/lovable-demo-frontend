import { useCallback, useEffect, useRef, useState } from "react";
import { Accessibility, Camera, Check, PersonStanding, RefreshCw, X } from "lucide-react";

import { SCAN_VIEW_LABELS, type ScanView } from "@/lib/twin-store";

// Takes the scan's three photos with the device's camera, one per view, and hands each one to the page
// as a JPEG file (the same as an uploaded photo). Opened from the scan page; the photos land in its
// front, left side and right side slots, where they can still be replaced or removed.
//
// The preview is mirrored when it's the selfie camera, like a mirror; the photo itself isn't, so the
// left side really is the left side. Nothing here checks the pose yet: that comes later, on the server,
// before the photos go to Gemini.

const VIEWS: ScanView[] = ["front", "left", "right"];
const TIMERS = [3, 10] as const; // seconds; 10 gives time to step back with the phone propped up

type Mode = "standing" | "seated";
const INSTRUCTIONS: Record<Mode, Record<ScanView, { title: string; tip: string }>> = {
  standing: {
    front: {
      title: "Face the camera",
      tip: "Whole body in the frame, head to feet. Arms slightly away from your sides, feet hip-width apart.",
    },
    left: {
      title: "Turn so your left side faces the camera",
      tip: "Arms relaxed at your sides, look straight ahead, stand tall.",
    },
    right: {
      title: "Turn so your right side faces the camera",
      tip: "Arms relaxed at your sides, look straight ahead, stand tall.",
    },
  },
  seated: {
    front: {
      title: "Face the camera, seated",
      tip: "Sit upright with your whole body in the frame, hands resting on your thighs, feet flat.",
    },
    left: {
      title: "Turn your chair so your left side faces the camera",
      tip: "Keep your torso tall and look straight ahead.",
    },
    right: {
      title: "Turn your chair so your right side faces the camera",
      tip: "Keep your torso tall and look straight ahead.",
    },
  },
};

export function ScanCamera({
  photos,
  onCapture,
  onClose,
}: {
  /** Preview addresses of the photos the page already has, to show which views are done */
  photos: Partial<Record<ScanView, string>>;
  onCapture: (view: ScanView, file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>("standing");
  const [view, setView] = useState<ScanView>(() => VIEWS.find((v) => !photos[v]) ?? "front");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [timer, setTimer] = useState<(typeof TIMERS)[number]>(10);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [ready, setReady] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval>>(undefined);

  // The camera, (re)started when switching between the selfie and back camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    setReady(false);
    setCamError(null);
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamError("This browser can't use the camera here. Upload your photos instead.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          // Portrait, high enough for measuring; the browser picks the nearest the camera offers
          video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1440 } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        const name = e instanceof DOMException ? e.name : "";
        setCamError(
          name === "NotAllowedError"
            ? "Camera access was blocked. Allow it in your browser's site settings, or upload your photos instead."
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? "No camera found. Upload your photos instead."
              : "The camera couldn't start. Upload your photos instead.",
        );
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  useEffect(() => () => clearInterval(countdownTimer.current), []);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0); // not mirrored: the photo is what the camera sees
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(view, new File([blob], `${view}.jpg`, { type: "image/jpeg" }));
        setFlash(true);
        setTimeout(() => setFlash(false), 250);
        // On to the next view that still has no photo
        const next = VIEWS.find((v) => v !== view && !photos[v]);
        if (next) setView(next);
      },
      "image/jpeg",
      0.92,
    );
  }, [onCapture, photos, view]);

  const startCountdown = () => {
    if (countdown !== null) return;
    let left: number = timer;
    setCountdown(left);
    countdownTimer.current = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(countdownTimer.current);
        setCountdown(null);
        takePhoto();
      } else setCountdown(left);
    }, 1000);
  };

  const cancelCountdown = () => {
    clearInterval(countdownTimer.current);
    setCountdown(null);
  };

  // Escape closes, as with other dialogs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const done = VIEWS.filter((v) => photos[v]).length;
  const step = INSTRUCTIONS[mode][view];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-0 sm:p-3 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Take your scan photos"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl sm:rounded-3xl rounded-none overflow-hidden bg-card border border-border shadow-[var(--shadow-lux)] relative my-0 sm:my-4 max-h-[100dvh] sm:max-h-[95vh] flex flex-col"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the camera"
          className="absolute top-3 right-3 z-30 h-9 w-9 grid place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid md:grid-cols-[1.4fr_1fr] overflow-y-auto">
          {/* Camera */}
          <div className="relative w-full h-[55dvh] md:h-auto md:min-h-[560px] bg-black overflow-hidden">
            {camError ? (
              <div className="absolute inset-0 grid place-items-center text-white/80 text-sm p-6 text-center">
                <div>
                  <Camera className="h-8 w-8 mx-auto mb-3 opacity-70" />
                  <p role="alert">{camError}</p>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onLoadedData={() => setReady(true)}
                className={`absolute inset-0 h-full w-full object-cover ${facing === "user" ? "scale-x-[-1]" : ""}`}
              />
            )}
            {/* Frame to stand in: the whole body should fit inside it */}
            {!camError && (
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="h-[88%] aspect-[3/4] rounded-3xl border-2 border-dashed border-white/60" />
              </div>
            )}
            {countdown !== null && (
              <div className="absolute inset-0 grid place-items-center bg-black/30">
                <div
                  className="font-display text-white text-8xl tabular-nums"
                  aria-live="assertive"
                >
                  {countdown}
                </div>
              </div>
            )}
            {flash && <div className="absolute inset-0 bg-white/80" />}
            <div className="absolute top-3 left-3 rounded-full px-3 py-1.5 text-[11px] font-medium text-white bg-black/50">
              {SCAN_VIEW_LABELS[view]} · {done} of 3 taken
            </div>
            {!camError && (
              <button
                type="button"
                onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
                disabled={countdown !== null}
                className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white bg-black/50 hover:bg-black/70 disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {facing === "user" ? "Use back camera" : "Use selfie camera"}
              </button>
            )}
          </div>

          {/* Steps */}
          <div className="p-4 sm:p-6 md:p-7 flex flex-col">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--plum)]">
              Body scan
            </div>
            <h3 className="mt-2 font-display text-xl sm:text-2xl">
              {SCAN_VIEW_LABELS[view]}: {step.title.toLowerCase()}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{step.tip}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
              <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                {(["standing", "seated"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${mode === m ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                  >
                    {m === "standing" ? (
                      <PersonStanding className="h-3.5 w-3.5" />
                    ) : (
                      <Accessibility className="h-3.5 w-3.5" />
                    )}
                    {m === "standing" ? "Standing" : "Seated"}
                  </button>
                ))}
              </div>
              <div
                className="flex items-center gap-1 rounded-full bg-secondary p-1"
                aria-label="Timer"
              >
                {TIMERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimer(t)}
                    aria-pressed={timer === t}
                    className={`rounded-full px-3 py-1.5 tabular-nums transition ${timer === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                  >
                    {t} s timer
                  </button>
                ))}
              </div>
            </div>

            {/* The three views; pick one to take or retake it */}
            <div className="mt-5 space-y-2">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  disabled={countdown !== null}
                  aria-pressed={v === view}
                  className={`w-full flex items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                    v === view
                      ? "border-[color:var(--plum)] bg-[color:var(--plum)]/5"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {photos[v] ? (
                    <img src={photos[v]} alt="" className="h-12 w-9 rounded-md object-cover" />
                  ) : (
                    <span className="h-12 w-9 grid place-items-center rounded-md bg-secondary text-xs text-muted-foreground">
                      {VIEWS.indexOf(v) + 1}
                    </span>
                  )}
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{SCAN_VIEW_LABELS[v]}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {photos[v] ? "Taken. Select to retake" : "Not taken yet"}
                    </span>
                  </span>
                  {photos[v] && <Check className="h-4 w-4 text-emerald-600" />}
                </button>
              ))}
            </div>

            <div className="mt-6 md:mt-auto pt-4 flex gap-2">
              {countdown === null ? (
                <button
                  type="button"
                  onClick={startCountdown}
                  disabled={!!camError || !ready}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-medium disabled:opacity-40"
                >
                  <Camera className="h-4 w-4" />
                  {photos[view] ? `Retake ${SCAN_VIEW_LABELS[view].toLowerCase()}` : "Take photo"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={cancelCountdown}
                  className="flex-1 rounded-full border border-border px-5 py-3 text-sm font-medium"
                >
                  Cancel timer
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`rounded-full px-5 py-3 text-sm font-medium ${done === 3 ? "bg-primary text-primary-foreground" : "border border-border"}`}
              >
                {done === 3 ? "Use these photos" : camError ? "Upload instead" : "Done"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
