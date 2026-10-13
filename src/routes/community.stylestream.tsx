import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ShoppingBag,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  X,
  Palette,
  Ruler,
  Star,
  Send,
} from "lucide-react";
import { PRODUCTS, useShop, shopStore } from "@/lib/shop-store";

export const Route = createFileRoute("/community/stylestream")({
  head: () => ({
    meta: [
      { title: "StyleStream · Watch. Learn. Shop. · Mannequin AI" },
      {
        name: "description",
        content:
          "StyleStream is Mannequin AI's short-form fashion education feed. Watch presenters explain outfits, tap any garment to shop, and get AI advice tailored to your Digital Twin.",
      },
      { property: "og:title", content: "StyleStream · Mannequin AI" },
      {
        property: "og:description",
        content: "Watch. Learn. Shop. Premium fashion reels powered by AI.",
      },
    ],
  }),
  component: StyleStreamPage,
});

type HotSpot = {
  productId: string;
  label: string;
  x: number; // % from left
  y: number; // % from top
  cue: number; // seconds into reel when it appears
};

type InfoCard = {
  cue: number;
  kind: "palette" | "insight" | "tip";
  title: string;
  body?: string;
  palette?: { name: string; hex: string }[];
  bullets?: string[];
};

type Reel = {
  id: string;
  title: string;
  presenter: string;
  handle: string;
  avatar: string;
  video: string;
  poster: string;
  vibe: string;
  score: number;
  colorHarmony: number;
  bodyFit: number;
  trend: number;
  comfort: number;
  occasion: string;
  reasoning: string;
  hotspots: HotSpot[];
  cards: InfoCard[];
  advice: string[];
  likes: number;
  comments: number;
};

const REELS: Reel[] = [
  {
    id: "r1",
    title: "The Camel Coat Formula",
    presenter: "Amara Cole",
    handle: "@amaraedits",
    avatar: PRODUCTS[0].img,
    video:
      "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-studio-39880-large.mp4",
    poster: PRODUCTS[0].img,
    vibe: "Editorial · Smart casual · Autumn",
    score: 98,
    colorHarmony: 5,
    bodyFit: 5,
    trend: 5,
    comfort: 5,
    occasion: "Business casual",
    reasoning:
      "This outfit combines complementary neutral tones to create visual balance. The double-faced camel coat defines the shoulders while a straight-leg trouser lengthens the silhouette. Warm leather accessories close the palette and create cohesion.",
    hotspots: [
      { productId: "1", label: "Camel Coat", x: 50, y: 32, cue: 2 },
      { productId: "2", label: "Court Sneakers", x: 44, y: 82, cue: 6 },
    ],
    cards: [
      {
        cue: 1,
        kind: "palette",
        title: "Colour palette",
        palette: [
          { name: "Camel", hex: "#c9a687" },
          { name: "Ivory", hex: "#eee6d3" },
          { name: "Espresso", hex: "#3a2a1e" },
          { name: "Leather", hex: "#7a5a3f" },
        ],
      },
      {
        cue: 4,
        kind: "insight",
        title: "Why it works",
        bullets: [
          "Excellent colour harmony",
          "Smart casual · elevated",
          "Suitable for spring & autumn",
          "Flatters hourglass shapes",
        ],
      },
      {
        cue: 9,
        kind: "tip",
        title: "Amara's tip",
        body: "Roll the sleeves once so the coat reads relaxed, not formal.",
      },
    ],
    advice: [
      "Based on your proportions, a mid-length coat balances your frame.",
      "Try warmer leather rather than black to stay in your palette.",
      "A high-rise trouser will lengthen your leg line further.",
    ],
    likes: 12400,
    comments: 342,
  },
  {
    id: "r2",
    title: "Streetwear, Sculpted",
    presenter: "Kai Mercer",
    handle: "@kaimercer",
    avatar: PRODUCTS[6].img,
    video:
      "https://assets.mixkit.co/videos/preview/mixkit-woman-with-a-fashionable-look-posing-39764-large.mp4",
    poster: PRODUCTS[6].img,
    vibe: "Street · Oversized · Weekend",
    score: 94,
    colorHarmony: 4,
    bodyFit: 5,
    trend: 5,
    comfort: 5,
    occasion: "Weekend",
    reasoning:
      "The oversized hoodie leans into volume up top while the cropped hem keeps the waist visible. Chunky cloud runners anchor the look and echo the softness of the fleece for a cohesive silhouette.",
    hotspots: [
      { productId: "7", label: "Fleece Hoodie", x: 52, y: 38, cue: 2 },
      { productId: "8", label: "Cloud Runners", x: 48, y: 84, cue: 5 },
      { productId: "12", label: "Cargo Set", x: 50, y: 62, cue: 8 },
    ],
    cards: [
      {
        cue: 1,
        kind: "palette",
        title: "Colour palette",
        palette: [
          { name: "Fog", hex: "#c9c6bf" },
          { name: "Cream", hex: "#efe7d8" },
          { name: "Plum", hex: "#5b2b52" },
          { name: "Ink", hex: "#141414" },
        ],
      },
      {
        cue: 6,
        kind: "insight",
        title: "AI reads the fit",
        bullets: [
          "Volume balanced by cropped hem",
          "Chunky sole extends leg line",
          "Neutral base — plum accent pops",
        ],
      },
    ],
    advice: [
      "Size up one — the drop shoulder needs room to sit.",
      "A single accent colour keeps street looks intentional.",
    ],
    likes: 8830,
    comments: 214,
  },
  {
    id: "r3",
    title: "Draped Satin, Made Simple",
    presenter: "Noor Ellis",
    handle: "@noor.ellis",
    avatar: PRODUCTS[10].img,
    video:
      "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-with-elegant-clothes-39755-large.mp4",
    poster: PRODUCTS[10].img,
    vibe: "Evening · Draped · Occasion",
    score: 96,
    colorHarmony: 5,
    bodyFit: 5,
    trend: 4,
    comfort: 4,
    occasion: "Dinner & events",
    reasoning:
      "A bias-cut satin catches light in motion, elongating the silhouette. Keeping accessories tonal lets the drape do the talking — the only accent is a low-lustre gold that warms against skin.",
    hotspots: [
      { productId: "11", label: "Satin Gown", x: 52, y: 55, cue: 2 },
      { productId: "10", label: "Pleated Midi (alt)", x: 20, y: 70, cue: 7 },
    ],
    cards: [
      {
        cue: 1,
        kind: "palette",
        title: "Colour palette",
        palette: [
          { name: "Champagne", hex: "#d8c9a6" },
          { name: "Plum", hex: "#5b2b52" },
          { name: "Bronze", hex: "#8a6a3f" },
        ],
      },
      {
        cue: 5,
        kind: "insight",
        title: "Why it works",
        bullets: [
          "Bias-cut = movement",
          "Tonal accessories keep focus on drape",
          "Warm gold, not silver",
        ],
      },
    ],
    advice: [
      "Bias-cut satin follows your waist — size to your natural measurement, not chest.",
      "A soft-heeled slingback keeps the drape uninterrupted.",
    ],
    likes: 15220,
    comments: 508,
  },
];

function StyleStreamPage() {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [showWhy, setShowWhy] = useState(false);
  const [openProduct, setOpenProduct] = useState<string | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Record<string, string[]>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { wishlist } = useShop();

  const reel = REELS[index];

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") setIndex((i) => Math.min(REELS.length - 1, i + 1));
      if (e.key === "ArrowUp") setIndex((i) => Math.max(0, i - 1));
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Video control on reel change / play state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [index, playing]);

  // Progress
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const on = () => {
      setProgress((v.currentTime / (v.duration || 1)) * 100);
      setTime(v.currentTime);
    };
    v.addEventListener("timeupdate", on);
    return () => v.removeEventListener("timeupdate", on);
  }, [index]);

  const next = () => setIndex((i) => Math.min(REELS.length - 1, i + 1));
  const prev = () => setIndex((i) => Math.max(0, i - 1));

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 40) return;
    if (e.deltaY > 0) next();
    else prev();
  };

  // Swipe on touch
  const touchY = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (touchY.current = e.touches[0].clientY);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchY.current == null) return;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (dy < -60) next();
    else if (dy > 60) prev();
    touchY.current = null;
  };

  const activeHotspots = reel.hotspots.filter((h) => time >= h.cue);
  const activeCards = reel.cards.filter((c) => time >= c.cue);
  const product = openProduct ? PRODUCTS.find((p) => p.id === openProduct) : null;

  const sendComment = () => {
    if (!comment.trim()) return;
    setComments((c) => ({ ...c, [reel.id]: [...(c[reel.id] ?? []), comment.trim()] }));
    setComment("");
  };

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="mx-auto max-w-7xl px-3 md:px-6 py-6"
    >
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
            <span className="h-px w-6 bg-[color:var(--plum)]" /> StyleStream
          </div>
          <h1 className="font-display text-3xl md:text-4xl mt-1">Watch. Learn. Shop.</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">
            Short, cinematic fashion breakdowns. Tap any piece to shop. Ask the AI why it works.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
          <span className="rounded-full border border-border px-2 py-1">↑ / ↓ swipe</span>
          <span className="rounded-full border border-border px-2 py-1">Space play</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-6 items-start">
        {/* Reel stage */}
        <div className="relative mx-auto w-full max-w-[420px]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-3xl bg-black shadow-[var(--shadow-card)]">
            <video
              key={reel.id}
              ref={videoRef}
              src={reel.video}
              poster={reel.poster}
              muted={muted}
              loop
              playsInline
              autoPlay
              className="absolute inset-0 h-full w-full object-cover"
              onClick={() => setPlaying((p) => !p)}
            />
            {/* Fallback poster + subtle motion if video blocked */}
            <img
              src={reel.poster}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-0"
            />

            {/* Top gradient + presenter */}
            <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center gap-3">
              <img
                src={reel.avatar}
                alt={reel.presenter}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white/70"
              />
              <div className="text-white">
                <div className="text-sm font-medium leading-tight">{reel.presenter}</div>
                <div className="text-[11px] opacity-80">{reel.handle} · {reel.vibe}</div>
              </div>
              <button
                onClick={() => setMuted((m) => !m)}
                className="ml-auto h-8 w-8 grid place-items-center rounded-full bg-white/15 backdrop-blur text-white"
                aria-label="Toggle sound"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>

            {/* Interactive hotspots */}
            {activeHotspots.map((h) => (
              <button
                key={h.productId}
                onClick={() => setOpenProduct(h.productId)}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
              >
                <span className="relative flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/70 opacity-60" />
                  <span className="relative inline-flex h-6 w-6 rounded-full bg-white text-[color:var(--plum)] items-center justify-center text-xs shadow-lg ring-2 ring-[color:var(--plum)]">
                    <ShoppingBag className="h-3 w-3" />
                  </span>
                </span>
                <span className="absolute left-8 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-foreground opacity-0 group-hover:opacity-100 transition">
                  {h.label} →
                </span>
              </button>
            ))}

            {/* Bottom: title + why button + actions */}
            <div className="absolute bottom-0 inset-x-0 p-4 pb-5 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <div className="flex items-end justify-between gap-3">
                <div className="text-white max-w-[75%]">
                  <div className="text-[11px] opacity-75 uppercase tracking-widest">
                    {reel.occasion}
                  </div>
                  <h2 className="font-display text-xl leading-tight">{reel.title}</h2>
                  <button
                    onClick={() => setShowWhy(true)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white text-foreground text-xs px-3 py-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[color:var(--plum)]" />
                    Why does this outfit work?
                  </button>
                </div>
                <div className="flex flex-col items-center gap-3 text-white">
                  <ActionBtn
                    onClick={() =>
                      setLiked((l) => ({ ...l, [reel.id]: !l[reel.id] }))
                    }
                    active={!!liked[reel.id]}
                    icon={<Heart className={`h-5 w-5 ${liked[reel.id] ? "fill-[color:var(--plum)] text-[color:var(--plum)]" : ""}`} />}
                    label={fmt(reel.likes + (liked[reel.id] ? 1 : 0))}
                  />
                  <ActionBtn
                    onClick={() => document.getElementById("ss-comments")?.scrollIntoView({ behavior: "smooth" })}
                    icon={<MessageCircle className="h-5 w-5" />}
                    label={fmt(reel.comments + (comments[reel.id]?.length ?? 0))}
                  />
                  <ActionBtn icon={<Share2 className="h-5 w-5" />} label="Share" />
                  <ActionBtn
                    onClick={() => setSaved((s) => ({ ...s, [reel.id]: !s[reel.id] }))}
                    active={!!saved[reel.id]}
                    icon={<Bookmark className={`h-5 w-5 ${saved[reel.id] ? "fill-white" : ""}`} />}
                    label="Save"
                  />
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-0.5 w-full rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-white transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Play toggle overlay */}
            {!playing && (
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 grid place-items-center bg-black/30"
                aria-label="Play"
              >
                <span className="h-16 w-16 rounded-full bg-white/90 grid place-items-center">
                  <Play className="h-6 w-6 text-foreground translate-x-0.5" />
                </span>
              </button>
            )}
          </div>

          {/* Vertical nav */}
          <div className="absolute -right-3 md:-right-12 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            <button
              onClick={prev}
              disabled={index === 0}
              className="h-10 w-10 rounded-full bg-card border border-border grid place-items-center disabled:opacity-40 hover:bg-accent"
              aria-label="Previous reel"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="h-10 w-10 rounded-full bg-card border border-border grid place-items-center hover:bg-accent"
              aria-label="Play / pause"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={next}
              disabled={index === REELS.length - 1}
              className="h-10 w-10 rounded-full bg-card border border-border grid place-items-center disabled:opacity-40 hover:bg-accent"
              aria-label="Next reel"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live AI panel */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--plum)]">
              <Sparkles className="h-3.5 w-3.5" /> Live AI overlay
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Info cards appear as {reel.presenter.split(" ")[0]} speaks. Hotspots highlight garments on screen.
            </p>

            <div className="mt-4 space-y-3">
              {activeCards.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Waiting for the first cue…
                </div>
              )}
              {activeCards.map((c, i) => (
                <div
                  key={i}
                  className="animate-fade-in rounded-2xl border border-border p-4"
                  style={{ background: "var(--gradient-hero)" }}
                >
                  <div className="flex items-center gap-2 text-xs font-medium">
                    {c.kind === "palette" && <Palette className="h-3.5 w-3.5 text-[color:var(--plum)]" />}
                    {c.kind === "insight" && <Sparkles className="h-3.5 w-3.5 text-[color:var(--plum)]" />}
                    {c.kind === "tip" && <Ruler className="h-3.5 w-3.5 text-[color:var(--plum)]" />}
                    {c.title}
                  </div>
                  {c.palette && (
                    <div className="mt-3 flex gap-2">
                      {c.palette.map((p) => (
                        <div key={p.hex} className="flex flex-col items-center gap-1">
                          <span className="h-10 w-10 rounded-xl border border-white/40" style={{ background: p.hex }} />
                          <span className="text-[10px] text-muted-foreground">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {c.bullets && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {c.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2">
                          <span className="text-[color:var(--plum)]">✔</span> {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  {c.body && <p className="mt-2 text-sm">{c.body}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Shop the look */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-[color:var(--plum)]">Shop the look</div>
                <div className="font-display text-lg mt-0.5">Every piece in this reel</div>
              </div>
              <span className="text-xs text-muted-foreground">{reel.hotspots.length} items</span>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {reel.hotspots.map((h) => {
                const p = PRODUCTS.find((x) => x.id === h.productId);
                if (!p) return null;
                return (
                  <button
                    key={h.productId}
                    onClick={() => setOpenProduct(h.productId)}
                    className="group text-left rounded-2xl overflow-hidden bg-background border border-border"
                  >
                    <div className="relative aspect-[4/5]">
                      <img src={p.img} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute top-2 left-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px]">
                        <span className="text-[color:var(--plum)] font-semibold">{p.fit}%</span> fit
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-[11px] text-muted-foreground">{p.brand}</div>
                      <div className="text-sm font-display truncate">{p.name}</div>
                      <div className="text-xs mt-0.5">${p.price}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personalised advice */}
          <div className="rounded-3xl border border-border p-5" style={{ background: "var(--gradient-hero)" }}>
            <div className="flex items-center gap-2 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--plum)]" /> Tailored to your Digital Twin
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {reel.advice.map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="text-[color:var(--plum)]">•</span>
                  {a}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <CoachBtn label="Try on my Digital Twin" />
              <CoachBtn label="Find similar outfits" />
              <CoachBtn label="Shop this look" />
              <CoachBtn label="Save to Wishlist" onClick={() => reel.hotspots.forEach((h) => !wishlist.has(h.productId) && shopStore.toggleWish(h.productId))} />
              <CoachBtn label="Learn this palette" />
            </div>
          </div>

          {/* Comments */}
          <div id="ss-comments" className="rounded-3xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-widest text-[color:var(--plum)]">Ask the community</div>
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
              {(comments[reel.id] ?? ["Where can I find the coat in petite?", "Would this work for a pear shape?"]).map((c, i) => (
                <div key={i} className="rounded-2xl bg-background border border-border px-3 py-2 text-sm">{c}</div>
              ))}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); sendComment(); }}
              className="mt-3 flex gap-2"
            >
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ask about fit, styling, or occasion…"
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--plum)]/40"
              />
              <button className="h-10 w-10 grid place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Send">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Upcoming rail */}
      <div className="mt-8">
        <div className="text-xs uppercase tracking-widest text-[color:var(--plum)]">Up next</div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-3">
          {REELS.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setIndex(i)}
              className={`shrink-0 w-40 rounded-2xl overflow-hidden border transition ${i === index ? "border-[color:var(--plum)] ring-2 ring-[color:var(--plum)]/30" : "border-border"}`}
            >
              <div className="relative aspect-[9/16]">
                <img src={r.poster} alt={r.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <div className="text-[10px] uppercase tracking-widest opacity-80">{r.presenter}</div>
                  <div className="text-xs font-display leading-tight line-clamp-2">{r.title}</div>
                </div>
                <div className="absolute top-2 right-2 rounded-full bg-white/90 text-foreground text-[10px] px-2 py-0.5 font-semibold">
                  {r.score}%
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Why modal */}
      {showWhy && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShowWhy(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-scale-in"
          >
            <div className="p-6" style={{ background: "var(--gradient-hero)" }}>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--plum)]">
                  <Sparkles className="h-3.5 w-3.5" /> AI outfit analysis
                </div>
                <button onClick={() => setShowWhy(false)} className="h-8 w-8 grid place-items-center rounded-full bg-white/60 hover:bg-white"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 flex items-end gap-3">
                <span className="font-display text-5xl leading-none">{reel.score}</span>
                <span className="mb-1 text-sm text-muted-foreground">overall outfit score</span>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <ScoreRow label="Colour harmony" v={reel.colorHarmony} />
              <ScoreRow label="Body compatibility" v={reel.bodyFit} />
              <ScoreRow label="Trend score" v={reel.trend} />
              <ScoreRow label="Comfort" v={reel.comfort} />
              <ScoreRow label={`Occasion · ${reel.occasion}`} v={5} />
              <p className="pt-3 text-sm text-muted-foreground leading-relaxed border-t border-border">
                {reel.reasoning}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Product quick-shop */}
      {product && (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/60 p-0 sm:p-4" onClick={() => setOpenProduct(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border overflow-hidden animate-scale-in"
          >
            <div className="flex">
              <img src={product.img} alt={product.name} className="w-32 h-40 object-cover" />
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] text-muted-foreground">{product.brand} · {product.retailer}</div>
                    <div className="font-display text-lg leading-tight">{product.name}</div>
                    <div className="text-sm mt-1">${product.price}</div>
                  </div>
                  <button onClick={() => setOpenProduct(null)} className="h-7 w-7 grid place-items-center rounded-full bg-accent"><X className="h-3.5 w-3.5" /></button>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[color:var(--plum)]/10 text-[color:var(--plum)] text-[11px] px-2 py-0.5">
                  <Star className="h-3 w-3 fill-[color:var(--plum)]" /> {product.fit}% AI fit
                </div>
              </div>
            </div>
            <div className="p-4 pt-0 flex flex-wrap gap-2">
              <button
                onClick={() => { shopStore.addToCart(product); setOpenProduct(null); }}
                className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm"
              >
                Add to cart
              </button>
              <button
                onClick={() => shopStore.toggleWish(product.id)}
                className="h-10 w-10 grid place-items-center rounded-full border border-border"
                aria-label="Wishlist"
              >
                <Heart className={`h-4 w-4 ${wishlist.has(product.id) ? "fill-[color:var(--plum)] text-[color:var(--plum)]" : ""}`} />
              </button>
              <Link
                to="/product/$id"
                params={{ id: product.id }}
                className="rounded-full border border-border px-4 py-2 text-sm"
              >
                Full page →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5">
      <span className={`h-10 w-10 grid place-items-center rounded-full backdrop-blur ${active ? "bg-white/90 text-foreground" : "bg-white/15 text-white"}`}>
        {icon}
      </span>
      <span className="text-[10px] opacity-90">{label}</span>
    </button>
  );
}

function CoachBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] rounded-full border border-border bg-background/70 px-3 py-1.5 hover:bg-accent"
    >
      {label}
    </button>
  );
}

function ScoreRow({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-3.5 w-3.5 ${i < v ? "fill-[color:var(--plum)] text-[color:var(--plum)]" : "text-muted-foreground"}`} />
        ))}
      </span>
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}
