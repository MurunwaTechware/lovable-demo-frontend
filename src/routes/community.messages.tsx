import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, DollarSign, Users2, Paperclip, Video, Phone, Mic, Square, Play, Pause, X, MicOff, VideoOff, PhoneOff, ChevronDown } from "lucide-react";
import { GOERS, communityStore, getGoer, useCommunity } from "@/lib/community-store";

type Status = "online" | "busy" | "away" | "offline";
const STATUS_META: Record<Status, { label: string; color: string; ring: string }> = {
  online: { label: "Online", color: "bg-emerald-500", ring: "ring-emerald-500/30" },
  busy: { label: "Busy", color: "bg-red-500", ring: "ring-red-500/30" },
  away: { label: "Away", color: "bg-amber-500", ring: "ring-amber-500/30" },
  offline: { label: "Offline", color: "bg-zinc-400", ring: "ring-zinc-400/30" },
};
const STATUSES: Status[] = ["online", "busy", "away", "offline"];
function goerStatus(id: string): Status {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return STATUSES[h % STATUSES.length];
}
function StatusDot({ status, className = "" }: { status: Status; className?: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ring-background ${STATUS_META[status].color} ${className}`} />;
}

export const Route = createFileRoute("/community/messages")({
  component: MessagesPage,
});

type VoiceNote = { url: string; duration: number };

function MessagesPage() {
  const state = useCommunity();
  const [tab, setTab] = useState<"messages" | "requests">("messages");

  const requestIds = useMemo(
    () => Object.values(state.threads).filter((t) => t.pending).map((t) => t.goerId),
    [state.threads]
  );
  const approvedThreadIds = useMemo(
    () => Object.values(state.threads).filter((t) => !t.pending).map((t) => t.goerId),
    [state.threads]
  );
  const messageIds = useMemo(() => {
    const followed = [...state.following].filter((id) => !approvedThreadIds.includes(id));
    return [...approvedThreadIds, ...followed];
  }, [approvedThreadIds, state.following]);

  const goerIds = tab === "messages" ? messageIds : requestIds;

  const [activeId, setActiveId] = useState<string>(goerIds[0] ?? GOERS[0].id);
  useEffect(() => {
    if (!goerIds.includes(activeId) && goerIds[0]) setActiveId(goerIds[0]);
  }, [tab, goerIds, activeId]);
  const active = getGoer(activeId);
  const thread = state.threads[activeId];
  const isPending = !!thread?.pending;
  const [input, setInput] = useState("");
  const listEnd = useRef<HTMLDivElement>(null);

  // voice recording
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [voiceNotes, setVoiceNotes] = useState<Record<string, VoiceNote>>({});

  // call modal
  const [call, setCall] = useState<null | "video" | "voice">(null);

  // auto status based on activity + tab visibility
  const [myStatus, setMyStatus] = useState<Status>("online");
  const [lastActive, setLastActive] = useState<number>(() => Date.now());
  useEffect(() => {
    const bump = () => setLastActive(Date.now());
    const onVis = () => {
      if (document.visibilityState === "visible") bump();
      else setLastActive((t) => t); // trigger recompute via interval
    };
    const events: (keyof WindowEventMap)[] = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    document.addEventListener("visibilitychange", onVis);
    const tick = setInterval(() => {
      const idle = Date.now() - lastActiveRef.current;
      const hidden = document.visibilityState === "hidden";
      if (hidden && idle > 60_000) setMyStatus("offline");
      else if (hidden || idle > 5 * 60_000) setMyStatus("away");
      else if (recordingRef.current) setMyStatus("busy");
      else setMyStatus("online");
    }, 1000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(tick);
    };
  }, []);
  const lastActiveRef = useRef(lastActive);
  useEffect(() => {
    lastActiveRef.current = lastActive;
  }, [lastActive]);
  const recordingRef = useRef(false);

  useEffect(() => {
    if (activeId) communityStore.markRead(activeId);
  }, [activeId, thread?.messages.length]);

  useEffect(() => {
    listEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const duration = recSecondsRef.current;
        const id = `voice-${Date.now()}`;
        setVoiceNotes((v) => ({ ...v, [id]: { url, duration } }));
        communityStore.sendMessage(active!.id, { from: "me", kind: "text", text: `🎙️ Voice message · ${formatTime(duration)}`, meta: { voiceId: id } as any });
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
      recordingRef.current = true;
      setRecSeconds(0);
      recSecondsRef.current = 0;
      recTimerRef.current = setInterval(() => {
        recSecondsRef.current += 1;
        setRecSeconds(recSecondsRef.current);
      }, 1000);
    } catch {
      alert("Microphone permission is required to record voice notes.");
    }
  }
  const recSecondsRef = useRef(0);

  function stopRecording(cancel = false) {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    setRecording(false);
    recordingRef.current = false;
    if (cancel && mediaRef.current) {
      mediaRef.current.onstop = () => {
        mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
      };
    }
    mediaRef.current?.stop();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-10rem)]">
        <aside className="rounded-3xl border border-border bg-card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-2">
            <div>
              <div className="text-xs tracking-[0.2em] uppercase text-[color:var(--plum)]">Inbox</div>
              <div className="font-display text-lg">Messages</div>
            </div>
            <div
              className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 h-7 text-[11px]"
              title="Your status updates automatically based on activity"
            >
              <span className={`h-2 w-2 rounded-full ${STATUS_META[myStatus].color}`} />
              {STATUS_META[myStatus].label}
              <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Auto</span>
            </div>
          </div>
          <div className="px-3 pt-3 pb-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => setTab("messages")}
              className={`flex-1 text-[11px] uppercase tracking-[0.18em] h-8 rounded-full border transition ${
                tab === "messages" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
              }`}
            >
              Messages
            </button>
            <button
              type="button"
              onClick={() => setTab("requests")}
              className={`flex-1 text-[11px] uppercase tracking-[0.18em] h-8 rounded-full border transition inline-flex items-center justify-center gap-1.5 ${
                tab === "requests" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
              }`}
            >
              Requests
              {requestIds.length > 0 && (
                <span className={`h-4 min-w-4 px-1 grid place-items-center rounded-full text-[10px] ${
                  tab === "requests" ? "bg-primary-foreground/20" : "bg-[color:var(--plum)] text-white"
                }`}>{requestIds.length}</span>
              )}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {goerIds.length === 0 && (
              <div className="p-6 text-xs text-muted-foreground">
                {tab === "requests" ? "No pending requests." : "No conversations yet. Message a stylist from their profile."}
              </div>
            )}
            {goerIds.map((id) => {
              const g = getGoer(id);
              const t = state.threads[id];
              const last = t?.messages[t.messages.length - 1];
              if (!g) return null;
              return (
                <button
                  key={id}
                  onClick={() => setActiveId(id)}
                  className={`w-full text-left p-3 flex gap-3 items-center hover:bg-accent transition ${activeId === id ? "bg-accent" : ""}`}
                >
                  <div className="relative">
                    <img src={g.avatar} alt={g.name} className="h-10 w-10 rounded-full object-cover" />
                    <StatusDot status={goerStatus(g.id)} className="absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium truncate">{g.name}</div>
                      {t && t.unread > 0 && (
                        <span className="h-4 min-w-4 px-1 grid place-items-center rounded-full bg-[color:var(--plum)] text-white text-[10px]">
                          {t.unread}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {last ? last.text : "Say hello…"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-3xl border border-border bg-card overflow-hidden flex flex-col">
          {active && (
            <>
              <header className="px-5 py-3 border-b border-border flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <img src={active.avatar} alt={active.name} className="h-10 w-10 rounded-full object-cover" />
                  <StatusDot status={goerStatus(active.id)} className="absolute -bottom-0.5 -right-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate flex items-center gap-2">
                    {active.name}
                    <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-normal">
                      · {STATUS_META[goerStatus(active.id)].label}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">@{active.handle} · usually replies within 2h</div>
                </div>
                <button
                  onClick={() => setCall("voice")}
                  className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-accent"
                  aria-label="Voice call"
                  title="Voice call"
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCall("video")}
                  className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-accent"
                  aria-label="Video call"
                  title="Video call"
                >
                  <Video className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    communityStore.sendMessage(active.id, {
                      from: "me",
                      kind: "pricing",
                      text: `Could you quote a full styling session for me?`,
                    })
                  }
                  className="hidden sm:inline-flex text-xs h-8 px-3 rounded-full bg-primary text-primary-foreground items-center gap-1.5"
                >
                  <DollarSign className="h-3.5 w-3.5" /> Pricing
                </button>
                <button
                  onClick={() => communityStore.requestCollab(active.id)}
                  className="hidden sm:inline-flex text-xs h-8 px-3 rounded-full border border-border items-center gap-1.5 hover:bg-accent"
                >
                  <Users2 className="h-3.5 w-3.5" /> Collab
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-background/40">
                {(thread?.messages ?? []).length === 0 && (
                  <div className="text-center text-xs text-muted-foreground pt-10">
                    Start the conversation with {active.name.split(" ")[0]}.
                  </div>
                )}
                {(thread?.messages ?? []).map((m) => {
                  const voiceId = (m as any).meta?.voiceId as string | undefined;
                  const note = voiceId ? voiceNotes[voiceId] : undefined;
                  return (
                    <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : ""}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          m.from === "me"
                            ? "bg-primary text-primary-foreground"
                            : m.kind === "quote"
                            ? "bg-[color:var(--plum)]/10 border border-[color:var(--plum)]/30"
                            : "bg-secondary"
                        }`}
                      >
                        {m.kind === "pricing" && (
                          <div className="text-[10px] uppercase tracking-[0.2em] opacity-70 mb-1">Pricing request</div>
                        )}
                        {m.kind === "collab" && (
                          <div className="text-[10px] uppercase tracking-[0.2em] opacity-70 mb-1">Collab request</div>
                        )}
                        {m.kind === "quote" && (
                          <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--plum)] mb-1">Quote</div>
                        )}
                        {note ? <VoicePlayer url={note.url} duration={note.duration} mine={m.from === "me"} /> : <div>{m.text}</div>}
                      </div>
                    </div>
                  );
                })}
                <div ref={listEnd} />
              </div>

              {isPending ? (
                <div className="border-t border-border p-4 bg-[color:var(--plum)]/5">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--plum)] mb-1">Message request</div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {active.name} isn't in your circle yet. Accept to reply, or decline to remove this request.
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        communityStore.declineRequest(active.id);
                      }}
                      className="flex-1 h-10 rounded-full border border-border text-sm hover:bg-accent"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        communityStore.approveRequest(active.id);
                        setTab("messages");
                      }}
                      className="flex-1 h-10 rounded-full bg-primary text-primary-foreground text-sm"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!input.trim() || recording) return;
                    communityStore.sendMessage(active.id, { from: "me", kind: "text", text: input });
                    setInput("");
                  }}
                  className="border-t border-border p-3 flex items-center gap-2"
                >
                  {recording ? (
                    <>
                      <button
                        type="button"
                        onClick={() => stopRecording(true)}
                        className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-accent"
                        aria-label="Cancel recording"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="flex-1 flex items-center gap-3 rounded-full bg-red-500/10 border border-red-500/30 px-4 h-10">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs text-red-600 font-medium">Recording…</span>
                        <span className="ml-auto text-xs tabular-nums text-red-600">{formatTime(recSeconds)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => stopRecording(false)}
                        className="h-10 w-10 grid place-items-center rounded-full bg-primary text-primary-foreground"
                        aria-label="Send voice"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="h-9 w-9 grid place-items-center rounded-full border border-border" aria-label="Attach">
                        <Paperclip className="h-4 w-4" />
                      </button>
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Write a message…"
                        className="flex-1 rounded-full border border-border bg-background px-4 h-10 text-sm outline-none focus:ring-2 focus:ring-[color:var(--plum)]/40"
                      />
                      <button
                        type="button"
                        onClick={startRecording}
                        className="h-10 w-10 grid place-items-center rounded-full border border-border hover:bg-accent"
                        aria-label="Record voice"
                        title="Record voice note"
                      >
                        <Mic className="h-4 w-4" />
                      </button>
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="h-10 w-10 grid place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
                        aria-label="Send"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </form>
              )}
            </>
          )}
        </section>
      </div>

      {call && active && <CallModal mode={call} peer={active} onClose={() => setCall(null)} />}
    </main>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function VoicePlayer({ url, duration, mine }: { url: string; duration: number; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  useEffect(() => {
    const a = new Audio(url);
    audioRef.current = a;
    a.ontimeupdate = () => setPos(a.currentTime);
    a.onended = () => {
      setPlaying(false);
      setPos(0);
    };
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, [url]);
  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
    }
  };
  const pct = duration ? Math.min(100, (pos / duration) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <button
        type="button"
        onClick={toggle}
        className={`h-8 w-8 grid place-items-center rounded-full ${mine ? "bg-white/20" : "bg-foreground/10"}`}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>
      <div className={`flex-1 h-1 rounded-full ${mine ? "bg-white/25" : "bg-foreground/15"}`}>
        <div className={`h-full rounded-full ${mine ? "bg-white" : "bg-[color:var(--plum)]"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] tabular-nums opacity-80">{formatTime(Math.round(playing ? pos : duration))}</span>
    </div>
  );
}

function CallModal({ mode, peer, onClose }: { mode: "video" | "voice"; peer: { name: string; avatar: string }; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"ringing" | "connected" | "ended">("ringing");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === "video",
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (mode === "video" && videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        // permission denied — stay in ringing/simulated state
      }
    })();
    const ring = setTimeout(() => setStatus("connected"), 1500);
    return () => {
      cancelled = true;
      clearTimeout(ring);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [mode]);

  useEffect(() => {
    if (status !== "connected") return;
    const i = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [status]);

  const end = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStatus("ended");
    setTimeout(onClose, 300);
  };

  const toggleMute = () => {
    const s = streamRef.current;
    if (!s) return;
    s.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted(!muted);
  };
  const toggleCam = () => {
    const s = streamRef.current;
    if (!s) return;
    s.getVideoTracks().forEach((t) => (t.enabled = camOff));
    setCamOff(!camOff);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl aspect-[4/5] sm:aspect-video rounded-3xl overflow-hidden bg-gradient-to-br from-[color:var(--plum)]/40 via-black to-black shadow-2xl">
        {mode === "video" ? (
          <>
            {/* remote (simulated with peer avatar) */}
            <div className="absolute inset-0 grid place-items-center">
              <img
                src={peer.avatar}
                alt={peer.name}
                className="h-full w-full object-cover opacity-90 blur-sm scale-110"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 grid place-items-center">
                <img src={peer.avatar} alt="" className="h-32 w-32 rounded-full object-cover ring-4 ring-white/20" />
              </div>
            </div>
            {/* self */}
            <div className="absolute bottom-24 right-4 h-40 w-28 sm:h-48 sm:w-36 rounded-2xl overflow-hidden border border-white/20 bg-black">
              {camOff ? (
                <div className="h-full w-full grid place-items-center text-white/60 text-xs">Camera off</div>
              ) : (
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
              )}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <img src={peer.avatar} alt={peer.name} className="h-full w-full object-cover opacity-60 blur-xl scale-110" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative text-center text-white">
              <img src={peer.avatar} alt="" className="h-32 w-32 rounded-full object-cover ring-4 ring-white/20 mx-auto" />
              <div className="mt-4 font-display text-2xl">{peer.name}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.3em] opacity-80">
                {status === "ringing" ? "Ringing…" : status === "connected" ? "Voice call" : "Ended"}
              </div>
            </div>
          </div>
        )}

        {/* top status */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white">
          <div className="text-sm">
            <div className="font-medium">{peer.name}</div>
            <div className="text-[11px] opacity-80">
              {status === "ringing" ? "Ringing…" : status === "connected" ? formatTime(seconds) : "Call ended"}
            </div>
          </div>
          <button onClick={end} className="h-8 w-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* controls */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`h-12 w-12 grid place-items-center rounded-full ${muted ? "bg-white text-black" : "bg-white/15 text-white hover:bg-white/25"}`}
            aria-label="Toggle mute"
          >
            {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          {mode === "video" && (
            <button
              onClick={toggleCam}
              className={`h-12 w-12 grid place-items-center rounded-full ${camOff ? "bg-white text-black" : "bg-white/15 text-white hover:bg-white/25"}`}
              aria-label="Toggle camera"
            >
              {camOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>
          )}
          <button
            onClick={end}
            className="h-14 w-14 grid place-items-center rounded-full bg-red-500 text-white hover:bg-red-600"
            aria-label="End call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
