import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles, ScanLine, Heart, ShoppingBag, Send, Star, MapPin,
  Check, X, Play, ArrowRight, Ruler, Shirt, Bot, Plus, Minus,
  Camera, Accessibility, PersonStanding, ChevronLeft, ChevronRight, CircleDot,
} from "lucide-react";

import heroImg from "@/assets/hero.jpg";
import twinImg from "@/assets/twin.jpg";
import productsImg from "@/assets/products.jpg";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import scanVideo from "@/assets/scan.mp4.asset.json";
import { Nav } from "@/components/Nav";
import { shopStore, useShop, type Product } from "@/lib/shop-store";
import { useQuery } from "@tanstack/react-query";
import { productsApi, brandSlug, rand, type ApiProduct } from "@/lib/products-api";

function toProduct(p: ApiProduct): Product {
  return {
    id: p.id, name: p.name ?? "", brand: p.brand ?? "Superbalist",
    price: p.price ?? 0, img: p.img ?? "", retailer: p.retailer ?? "Superbalist",
    category: p.category ?? "", fit: p.fit ?? 0, description: "",
    sizes: [], materials: "", care: "", tailorTips: [],
  };
}

export const Route = createFileRoute("/")({ component: Home });

// Shown in the hero strip only until the real brand list has loaded.
const FALLBACK_MARQUEE = ["SUPERBALIST", "H&M", "ADIDAS", "MANGO", "UNDER ARMOUR", "VANS", "FACTORIE", "CONVERSE"];
const TEASER_BRANDS = 6;   // brand chips on the homepage teaser
const TEASER_ITEMS = 4;    // products on the homepage teaser


function Home() {
  const { wishlist, cart, tailoring } = useShop();
  const [cartOpen, setCartOpen] = useState(false);
  const [brand, setBrand] = useState<string | null>(null);
  const [tryOn, setTryOn] = useState<Product | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanned, setScanned] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("mannequin.scanned") === "1";
  });
  const [tutorialPose, setTutorialPose] = useState(0);
  const [seatedMode, setSeatedMode] = useState(false);
  const [measurements, setMeasurements] = useState({ height: 172, chest: 92, waist: 76, hip: 96, inseam: 80 });
  const [fitConfidence, setFitConfidence] = useState(94);
  const [chat, setChat] = useState<{ from: "ai" | "me"; text: string }[]>([
    { from: "ai", text: "Hi Ava — I noticed you're browsing outerwear. Want a capsule for a rainy Paris weekend?" },
  ]);
  const [chatInput, setChatInput] = useState("");




  // Real brands (with product counts) — biggest first for the teaser chips.
  const { data: brandData } = useQuery({
    queryKey: ["brand-cards"],
    queryFn: () => productsApi.brandCards(),
  });
  const allBrands = brandData?.brands ?? [];
  const topBrands = useMemo(
    () => [...allBrands].sort((a, b) => b.count - a.count).slice(0, TEASER_BRANDS),
    [allBrands],
  );
  const marquee = topBrands.length
    ? [...allBrands].sort((a, b) => b.count - a.count).slice(0, 12).map((b) => b.name.toUpperCase())
    : FALLBACK_MARQUEE;

  // A small teaser grid; the full feed lives on /shop.
  const { data: shopData } = useQuery({
    queryKey: ["home-teaser", brand],
    queryFn: () => productsApi.list({ brand: brand ?? undefined, page_size: TEASER_ITEMS }),
  });
  const filtered = useMemo(() => (shopData?.items ?? []).map(toProduct), [shopData]);

  const toggleWish = (id: string) => shopStore.toggleWish(id);
  const addToCart = (p: Product) => { shopStore.addToCart(p); setCartOpen(true); };
  const removeFromCart = (idx: number) => shopStore.removeFromCart(idx);

  const itemsTotal = cart.reduce((s, p) => s + p.price, 0);
  const tailoringTotal = tailoring.reduce((s, t) => s + (t?.price ?? 0), 0);
  const cartTotal = itemsTotal + tailoringTotal;
  const maxDays = tailoring.reduce((m, t) => Math.max(m, t?.days ?? 0), 0);

  const suggestions = [
    "Build me a smart-casual capsule",
    "What fits my shoulders best?",
    "Find a tailor near me",
    "Outfit for a rainy 12°C day",
  ];

  const sendChat = (text: string) => {
    if (!text.trim()) return;
    setChat((c) => [...c, { from: "me", text }]);
    setChatInput("");
    setTimeout(() => {
      const replies: Record<string, string> = {
        default: "Got it. I found 12 pieces that match your Digital Twin with 92%+ fit confidence. Want me to build 3 looks?",
        tailor: "There are 4 tailors within 2 km. Atelier Rosen has a 4.9★ rating and a 2-day turnaround — want me to book?",
        capsule: "Here's a 5-piece capsule: camel coat, cashmere knit, straight denim, court sneakers and a leather tote. Estimated fit 96%.",
        rain: "For 12°C and drizzle: the Signature Camel Coat + merino roll-neck + waterproof leather boots. Adding to a wishlist?",
      };
      const key = /tailor/i.test(text) ? "tailor" : /capsule/i.test(text) ? "capsule" : /rain|12°|weather/i.test(text) ? "rain" : "default";
      setChat((c) => [...c, { from: "ai", text: replies[key] }]);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav onOpenCart={() => setCartOpen(true)} />


      {/* HERO */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="mx-auto max-w-7xl px-6 pt-28 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--plum)]" /> Now with Fit Confidence 2.0
            </span>
            <h1 className="mt-6 text-5xl md:text-7xl leading-[1.05] font-medium">
              One body twin.<br />
              <span className="italic text-[color:var(--plum)]">Every</span> wardrobe.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Mannequin AI scans you once, then shops across every retailer you love — predicting fit, styling outfits and booking tailors.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => { setScanOpen(true); }}
                className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium shadow-[var(--shadow-lux)] hover:opacity-90">
                <ScanLine className="h-4 w-4" /> Start body scan
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-accent">
                Explore marketplace
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div><div className="font-display text-2xl text-foreground">2.4M</div>twins scanned</div>
              <div><div className="font-display text-2xl text-foreground">{allBrands.length ? `${allBrands.length}` : "—"}</div>brands</div>
              <div><div className="font-display text-2xl text-foreground">96%</div>avg fit accuracy</div>
            </div>
          </div>

          <div className="relative animate-fade-up">
            <div className="relative rounded-[2rem] overflow-hidden shadow-[var(--shadow-lux)] aspect-[4/5]">
              <img src={heroImg} alt="Ava, styled by Mannequin AI" width={1600} height={1200} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/20 to-transparent" />
              <div className="absolute top-4 left-4 glass rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live twin — Ava
              </div>
              <div className="absolute bottom-4 left-4 right-4 glass rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Fit confidence</div>
                  <div className="font-display text-2xl">96%</div>
                </div>
                <div className="flex -space-x-2">
                  {[p1, p2, p3].map((s, i) => (
                    <img key={i} src={s} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 rounded-full border-2 border-card object-cover" />
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden md:block rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] animate-float">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full grid place-items-center" style={{ background: "var(--gradient-plum)" }}>
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="text-xs">
                  <div className="font-medium">AI Stylist</div>
                  <div className="text-muted-foreground">3 new looks for you</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* retailer marquee */}
        <div className="border-y border-border bg-card/50 overflow-hidden py-5">
          <div className="marquee-track text-xs tracking-[0.3em] font-medium text-muted-foreground">
            {[...marquee, ...marquee].map((r, i) => (
              <span key={i} className="whitespace-nowrap">{r}</span>
            ))}
          </div>
        </div>
      </section>

      {/* BODY SCAN TUTORIAL */}
      <section id="scan" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <SectionKicker>01 · Body Scan Tutorial</SectionKicker>
            <h2 className="mt-3 text-4xl md:text-5xl">Three angles. Ninety seconds.<br /><span className="italic">Your twin, forever.</span></h2>
            <p className="mt-5 text-muted-foreground max-w-md">
              Stand in soft, even light. Wear form-fitting clothes. Follow the on-screen guide for front, side and back poses.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                ["Lighting", "Diffuse daylight or a bright lamp — avoid harsh shadows."],
                ["Distance", "Place your phone 2 m away at hip height."],
                ["Posture", "Arms slightly out, feet shoulder-width apart, relax your shoulders."],
                ["Background", "A plain wall — the calmer, the better."],
              ].map(([k, v]) => (
                <li key={k} className="flex gap-3">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full grid place-items-center bg-[color:var(--plum)] text-white"><Check className="h-3 w-3" /></span>
                  <div><span className="font-medium">{k}.</span> <span className="text-muted-foreground">{v}</span></div>
                </li>
              ))}
            </ul>
            <button onClick={() => { setScanOpen(true); }}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium">
              <ScanLine className="h-4 w-4" /> Start scan now
            </button>
          </div>

          <TutorialStage
            mode={seatedMode ? "seated" : "standing"}
            onModeChange={(m) => { setSeatedMode(m === "seated"); setTutorialPose(0); }}
            pose={tutorialPose}
            onPoseChange={setTutorialPose}
          />
        </div>
      </section>

      <section id="twin" className="bg-secondary/60 border-y border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
          <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] max-w-md mx-auto w-full" style={{ background: "var(--gradient-plum)" }}>
            {scanned ? (
              <MorphingTwin measurements={measurements} />
            ) : (
              <img src={twinImg} alt="Your Digital Body Twin" width={1200} height={1400} loading="lazy" className="h-full w-full object-cover mix-blend-screen opacity-90 blur-md" />
            )}
          </div>


          <div>
            <SectionKicker>02 · Digital Twin & Fit Confidence</SectionKicker>
            <h2 className="mt-3 text-4xl md:text-5xl">Measurements you can <span className="italic">tune</span>.</h2>

            {!scanned ? (
              <>
                <p className="mt-5 text-muted-foreground max-w-lg">
                  Your measurements appear here once your body scan is complete. Press <span className="text-foreground font-medium">Start scan</span> to open the camera and capture your three poses.
                </p>
                <button onClick={() => setScanOpen(true)}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium">
                  <ScanLine className="h-4 w-4" /> Start camera scan
                </button>
              </>
            ) : (
              <>
                <div className="mt-8 grid sm:grid-cols-2 gap-4">
                  {(["height", "chest", "waist", "hip", "inseam"] as const).map((k) => (
                    <MeasureRow key={k} label={k} value={measurements[k]}
                      onChange={(v) => {
                        setMeasurements((m) => ({ ...m, [k]: v }));
                        setFitConfidence(Math.max(70, Math.min(99, 94 + Math.round((172 - v) / 10))));
                      }} />
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                  <FitRing value={fitConfidence} />
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-sm text-muted-foreground">Overall Fit Confidence</div>
                    <div className="font-display text-3xl">{fitConfidence}%</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Recommended alteration: hem +1.5 cm · nearest tailor <span className="text-foreground font-medium">Atelier Rosen · 0.8 km</span>
                    </div>
                  </div>
                  <button className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Book tailor
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* MARKETPLACE TEASER — the full feed is on /shop */}
      <section id="shop" className="bg-secondary/60 border-y border-border">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectionKicker>04 · Retail Marketplace</SectionKicker>
              <h2 className="mt-3 text-4xl md:text-5xl">Shop <span className="italic">everywhere</span>, in one cart.</h2>
              <p className="mt-3 max-w-lg text-muted-foreground">
                {allBrands.length ? `${allBrands.length} brands` : "Every brand"}, one universal cart. Pick a brand for a taste, or open the full shop to search and filter everything.
              </p>
            </div>
            <Link to="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium shadow-[var(--shadow-lux)] hover:opacity-90">
              Browse all pieces <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* real brand chips — filter the teaser below */}
          <div className="mt-8 flex flex-wrap gap-2">
            {[null, ...topBrands.map((b) => b.name)].map((name) => {
              const active = brand === name;
              return (
                <button key={name ?? "all"} onClick={() => setBrand(name)}
                  className={`rounded-full px-4 py-2 text-xs font-medium border transition ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-accent"}`}>
                  {name ?? "All"}
                </button>
              );
            })}
            <Link to="/stores" className="rounded-full px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
              All brands →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.length === 0
              ? Array.from({ length: TEASER_ITEMS }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-3xl border border-border bg-card animate-pulse" />
                ))
              : filtered.map((p) => (
              <article key={p.id} className="group rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lux)] transition">
                <Link to="/product/$id" params={{ id: p.id }} className="relative block aspect-[4/5] overflow-hidden bg-secondary">
                  <img src={p.img} alt={p.name} loading="lazy"
                    className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105" />
                  <button onClick={(e) => { e.preventDefault(); toggleWish(p.id); }}
                    aria-label="Save to wishlist"
                    className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full glass bg-white/70">
                    <Heart className={`h-4 w-4 transition ${wishlist.has(p.id) ? "fill-[color:var(--plum)] text-[color:var(--plum)]" : "text-foreground"}`} />
                  </button>
                  {p.fit > 0 && (
                    <div className="absolute bottom-3 left-3 glass rounded-full px-3 py-1 text-[11px] font-medium bg-white/80">
                      <span className="text-[color:var(--plum)] font-semibold">{p.fit}%</span> fit for you
                    </div>
                  )}
                  <button onClick={(e) => { e.preventDefault(); setTryOn(p); }}
                    className="absolute bottom-3 right-3 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs opacity-0 group-hover:opacity-100 transition">
                    Try on
                  </button>
                </Link>
                <div className="p-4">
                  <div className="text-xs text-muted-foreground truncate">{p.brand}</div>
                  <Link to="/product/$id" params={{ id: p.id }} className="mt-1 block font-display text-base sm:text-lg leading-snug line-clamp-2 hover:text-[color:var(--plum)]">{p.name}</Link>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-medium text-sm">{rand(p.price)}</span>
                    <button onClick={() => addToCart(p)} className="rounded-full bg-secondary hover:bg-accent px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1">
                      <ShoppingBag className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {brand && (
            <div className="mt-6 text-center">
              <Link to="/stores/$name" params={{ name: brandSlug(brand) }} className="text-sm text-[color:var(--plum)] hover:underline">
                See everything from {brand} →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-28 text-center">
        <SectionKicker className="justify-center">Get started</SectionKicker>
        <h2 className="mt-3 text-4xl md:text-6xl max-w-3xl mx-auto">Your <span className="italic">Digital Body Twin</span> is 90 seconds away.</h2>
        <p className="mt-5 text-muted-foreground max-w-xl mx-auto">Free forever. No measuring tape. No returns.</p>
        <button onClick={() => { setScanOpen(true); }}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 text-sm font-medium shadow-[var(--shadow-lux)]">
          <ScanLine className="h-4 w-4" /> Start your scan
        </button>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-display text-foreground text-lg"><Shirt className="h-5 w-5" /> Mannequin AI</div>
          <div>© {new Date().getFullYear()} Mannequin AI · Built for premium fashion.</div>
        </div>
      </footer>

      {scanOpen && (
        <ScanCameraModal
          initialSeated={seatedMode}
          measurements={measurements}
          onClose={() => setScanOpen(false)}
          onFinished={() => {
            setScanOpen(false);
            setScanned(true);
            try { window.localStorage.setItem("mannequin.scanned", "1"); } catch {}
            requestAnimationFrame(() => {
              document.getElementById("twin")?.scrollIntoView({ behavior: "smooth" });
            });
          }}
        />
      )}

      {tryOn && (
        <Modal onClose={() => setTryOn(null)} wide>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4]" style={{ background: "var(--gradient-plum)" }}>
              <img src={twinImg} alt="" className="h-full w-full object-cover mix-blend-screen opacity-80" />
              <img src={tryOn.img} alt={tryOn.name} className="absolute inset-0 h-full w-full object-contain p-6 mix-blend-multiply opacity-90" />
              <div className="absolute top-3 left-3 glass bg-white/80 rounded-full px-3 py-1 text-xs font-medium">Virtual Try-On</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{tryOn.brand} · {tryOn.retailer}</div>
              <h3 className="mt-1 font-display text-3xl">{tryOn.name}</h3>
              <div className="mt-2 text-xl font-medium">{rand(tryOn.price)}</div>
              {tryOn.fit > 0 && <div className="mt-6 rounded-2xl border border-border p-4 flex items-center gap-4">
                <FitRing value={tryOn.fit} small />
                <div>
                  <div className="font-medium">Fit Confidence · {tryOn.fit}%</div>
                  <div className="text-xs text-muted-foreground">Recommended size: <span className="text-foreground font-medium">M</span> · relaxed shoulder, true to waist</div>
                </div>
              </div>}
              <div className="mt-4 flex gap-2">
                {["XS", "S", "M", "L", "XL"].map((s) => (
                  <button key={s} className={`h-10 w-10 rounded-full border text-sm ${s === "M" ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:bg-accent"}`}>{s}</button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => { addToCart(tryOn); setTryOn(null); }}
                  className="flex-1 rounded-full bg-primary text-primary-foreground py-3 text-sm inline-flex items-center justify-center gap-2">
                  <ShoppingBag className="h-4 w-4" /> Add to universal cart
                </button>
                <button onClick={() => toggleWish(tryOn.id)}
                  className="h-12 w-12 grid place-items-center rounded-full border border-border">
                  <Heart className={`h-4 w-4 ${wishlist.has(tryOn.id) ? "fill-[color:var(--plum)] text-[color:var(--plum)]" : ""}`} />
                </button>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Ships from {tryOn.retailer} · Free returns · Complete the look with 3 AI picks below.
              </div>
            </div>
          </div>
        </Modal>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <aside className="w-full max-w-md bg-card border-l border-border flex flex-col animate-fade-up">
            <div className="p-5 flex items-center justify-between border-b border-border">
              <div>
                <div className="font-display text-xl">Universal cart</div>
                <div className="text-xs text-muted-foreground">{cart.length} item{cart.length !== 1 && "s"} · grouped by retailer</div>
              </div>
              <button onClick={() => setCartOpen(false)} className="h-9 w-9 grid place-items-center rounded-full hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.length === 0 && <div className="text-sm text-muted-foreground text-center py-16">Your cart is empty.</div>}
              {cart.map((p, i) => {
                const rec = tailoring[i] ?? shopStore.recommendTailorFor(p);
                const added = !!tailoring[i];
                return (
                  <div key={i} className="rounded-2xl border border-border p-3">
                    <div className="flex gap-3">
                      <img src={p.img} alt="" className="h-20 w-16 rounded-xl object-cover object-top" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">{p.retailer}</div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="mt-1 text-sm">{rand(p.price)}</div>
                      </div>
                      <button onClick={() => removeFromCart(i)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-accent text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                    </div>

                    {rec && (
                      <div className="mt-3 rounded-xl border border-dashed border-[color:var(--plum)]/40 bg-[color:var(--plum)]/5 p-3">
                        <div className="flex items-start gap-2">
                          <Ruler className="h-4 w-4 mt-0.5 text-[color:var(--plum)]" />
                          <div className="flex-1">
                            <div className="text-xs uppercase tracking-widest text-[color:var(--plum)]">Tailor recommendation</div>
                            <div className="mt-0.5 text-sm">{rec.tip}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">{rec.tailorName} · ready in {rec.days} day{rec.days !== 1 && "s"}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">+{rand(rec.price)}</div>
                            <button
                              onClick={() => shopStore.toggleTailoring(i)}
                              className={`mt-1 rounded-full px-2.5 py-1 text-[11px] border transition ${
                                added ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-accent"
                              }`}
                            >
                              {added ? "Added" : "Add"}
                            </button>
                          </div>
                        </div>
                        {added && (
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> {p.retailer}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="inline-flex items-center gap-1"><Ruler className="h-3 w-3" /> {rec.tailorName}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> Your door</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-5 border-t border-border space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Items</span><span>{rand(itemsTotal)}</span>
              </div>
              {tailoringTotal > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Tailoring</span><span>+{rand(tailoringTotal)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-display text-2xl">{rand(cartTotal)}</span>
              </div>
              {tailoringTotal > 0 && (
                <div className="rounded-xl bg-secondary p-3 text-[11px] text-muted-foreground">
                  <div className="text-xs uppercase tracking-widest text-foreground mb-2">Fulfilment journey</div>
                  <ol className="space-y-1.5">
                    <li className="flex items-center gap-2"><span className="h-5 w-5 grid place-items-center rounded-full bg-[color:var(--plum)] text-white text-[10px]">1</span> Retailers ship your items</li>
                    <li className="flex items-center gap-2"><span className="h-5 w-5 grid place-items-center rounded-full bg-[color:var(--plum)] text-white text-[10px]">2</span> Routed to your tailor for alterations</li>
                    <li className="flex items-center gap-2"><span className="h-5 w-5 grid place-items-center rounded-full bg-[color:var(--plum)] text-white text-[10px]">3</span> Delivered to your door — ready to wear (~{Math.max(maxDays, 1) + 3} days)</li>
                  </ol>
                </div>
              )}
              <button className="w-full rounded-full bg-primary text-primary-foreground py-3 text-sm">Checkout</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}


function SectionKicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium ${className}`}>
      <span className="h-px w-6 bg-[color:var(--plum)]" />{children}
    </div>
  );
}

function MeasureRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Ruler className="h-3 w-3" /> {label}</div>
        <div className="font-display text-lg">{value} <span className="text-xs text-muted-foreground">cm</span></div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => onChange(value - 1)} className="h-7 w-7 grid place-items-center rounded-full border border-border hover:bg-accent"><Minus className="h-3 w-3" /></button>
        <input type="range" min={140} max={210} value={value} onChange={(e) => onChange(+e.target.value)} className="flex-1 accent-[color:var(--plum)]" />
        <button onClick={() => onChange(value + 1)} className="h-7 w-7 grid place-items-center rounded-full border border-border hover:bg-accent"><Plus className="h-3 w-3" /></button>
      </div>
    </div>
  );
}

function FitRing({ value, small = false }: { value: number; small?: boolean }) {
  const size = small ? 64 : 84;
  const stroke = small ? 6 : 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="var(--color-border)" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="var(--plum)" fill="none"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" className="transition-all duration-500" />
      <text x="50%" y="54%" textAnchor="middle" className="fill-foreground font-display" fontSize={small ? 14 : 18} transform={`rotate(90 ${size / 2} ${size / 2})`}>
        {value}%
      </text>
    </svg>
  );
}

function MorphingTwin({ measurements }: { measurements: { height: number; chest: number; waist: number; hip: number; inseam: number } }) {
  const { height, chest, waist, hip, inseam } = measurements;
  // Baselines
  const B = { height: 172, chest: 92, waist: 76, hip: 96, inseam: 80 };
  const chestW = 60 * (chest / B.chest);
  const waistW = 48 * (waist / B.waist);
  const hipW = 62 * (hip / B.hip);
  const heightScale = height / B.height;
  const legLen = 130 * (inseam / B.inseam);
  const torsoLen = 110 * heightScale;
  const headR = 18;
  const cx = 150;
  const headCy = 40;
  const shoulderY = headCy + headR + 8;
  const waistY = shoulderY + torsoLen * 0.55;
  const hipY = shoulderY + torsoLen;
  const footY = hipY + legLen;
  const bodyPath = `
    M ${cx - chestW / 2} ${shoulderY}
    C ${cx - chestW / 2 - 6} ${shoulderY + 20}, ${cx - waistW / 2 - 4} ${waistY - 20}, ${cx - waistW / 2} ${waistY}
    C ${cx - waistW / 2 - 4} ${waistY + 18}, ${cx - hipW / 2 - 4} ${hipY - 14}, ${cx - hipW / 2} ${hipY}
    L ${cx + hipW / 2} ${hipY}
    C ${cx + hipW / 2 + 4} ${hipY - 14}, ${cx + waistW / 2 + 4} ${waistY + 18}, ${cx + waistW / 2} ${waistY}
    C ${cx + waistW / 2 + 4} ${waistY - 20}, ${cx + chestW / 2 + 6} ${shoulderY + 20}, ${cx + chestW / 2} ${shoulderY}
    Z`;
  const labels: [string, number, number, number][] = [
    ["Chest", cx + chestW / 2 + 6, shoulderY + 18, chest],
    ["Waist", cx + waistW / 2 + 6, waistY, waist],
    ["Hip", cx + hipW / 2 + 6, hipY - 4, hip],
    ["Inseam", cx + 30, hipY + legLen / 2, inseam],
    ["Height", cx - chestW / 2 - 44, shoulderY + torsoLen / 2, height],
  ];
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-cyan-300/40 to-transparent animate-scan-sweep" />
      </div>
      <svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid meet" className="relative h-full w-full">
        <defs>
          <linearGradient id="twinGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#e9d5ff" stopOpacity="0.85" />
          </linearGradient>
          <filter id="twinGlow"><feGaussianBlur stdDeviation="1.2" /></filter>
        </defs>
        {/* head */}
        <circle cx={cx} cy={headCy} r={headR} fill="url(#twinGrad)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" style={{ transition: "all 500ms" }} />
        {/* neck */}
        <rect x={cx - 6} y={headCy + headR - 2} width={12} height={10} fill="url(#twinGrad)" />
        {/* torso */}
        <path d={bodyPath} fill="url(#twinGrad)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.4" style={{ transition: "all 500ms" }} />
        {/* arms */}
        <path d={`M ${cx - chestW / 2 + 2} ${shoulderY + 4} C ${cx - chestW / 2 - 22} ${shoulderY + 40}, ${cx - chestW / 2 - 26} ${waistY + 20}, ${cx - chestW / 2 - 18} ${hipY - 6}`} stroke="url(#twinGrad)" strokeWidth={12 * (chest / B.chest)} strokeLinecap="round" fill="none" style={{ transition: "all 500ms" }} />
        <path d={`M ${cx + chestW / 2 - 2} ${shoulderY + 4} C ${cx + chestW / 2 + 22} ${shoulderY + 40}, ${cx + chestW / 2 + 26} ${waistY + 20}, ${cx + chestW / 2 + 18} ${hipY - 6}`} stroke="url(#twinGrad)" strokeWidth={12 * (chest / B.chest)} strokeLinecap="round" fill="none" style={{ transition: "all 500ms" }} />
        {/* legs */}
        <path d={`M ${cx - hipW / 4 - 4} ${hipY} L ${cx - hipW / 4 - 6} ${footY}`} stroke="url(#twinGrad)" strokeWidth={18 * (hip / B.hip)} strokeLinecap="round" style={{ transition: "all 500ms" }} />
        <path d={`M ${cx + hipW / 4 + 4} ${hipY} L ${cx + hipW / 4 + 6} ${footY}`} stroke="url(#twinGrad)" strokeWidth={18 * (hip / B.hip)} strokeLinecap="round" style={{ transition: "all 500ms" }} />
        {/* measurement guides */}
        {labels.map(([k, x, y, v]) => (
          <g key={k} style={{ transition: "all 500ms" }}>
            <circle cx={x - 4} cy={y} r={2.5} fill="#67e8f9" />
          </g>
        ))}
      </svg>
      {labels.map(([k, x, y, v]) => (
        <div key={k}
          className="absolute glass rounded-full px-2 py-0.5 text-[10px] font-medium text-white bg-black/50 border border-white/20 whitespace-nowrap transition-all duration-500"
          style={{ left: `${(x / 300) * 100}%`, top: `${(y / 420) * 100}%`, transform: "translate(-50%, -50%)" }}>
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
          {k} {v}
        </div>
      ))}
    </div>
  );
}




function Modal({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div ref={ref} onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} rounded-3xl bg-card border border-border shadow-[var(--shadow-lux)] p-6 animate-fade-up relative`}>
        <button onClick={onClose} className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full hover:bg-accent"><X className="h-4 w-4" /></button>
        {children}
      </div>
    </div>
  );
}

/* ─────────────── Tutorial pose stage ─────────────── */

type PoseMode = "standing" | "seated";
const POSES: Record<PoseMode, { label: string; sub: string; tip: string }[]> = {
  standing: [
    { label: "Front", sub: "Face the camera", tip: "Arms slightly out, palms forward, feet shoulder-width." },
    { label: "Side", sub: "Turn 90° right", tip: "Arms relaxed at your sides, chin level, breathe out." },
    { label: "Back", sub: "Face away", tip: "Stand tall, shoulders relaxed, heels together." },
  ],
  seated: [
    { label: "Facing", sub: "Face the camera seated", tip: "Sit upright, hands resting on your thighs, feet or footplate flat." },
    { label: "Left profile", sub: "Turn chair 90° right", tip: "Keep your torso tall, shoulders square to the chair." },
    { label: "Right profile", sub: "Turn chair 90° left", tip: "Relax your arms, look straight ahead, hold for 3 seconds." },
  ],
};

function TutorialStage({
  mode, onModeChange, pose, onPoseChange,
}: {
  mode: PoseMode;
  onModeChange: (m: PoseMode) => void;
  pose: number;
  onPoseChange: (i: number) => void;
}) {
  const poses = POSES[mode];
  const current = poses[pose];
  return (
    <div className="relative rounded-[2rem] overflow-hidden shadow-[var(--shadow-lux)] aspect-video bg-black">
      <video src={scanVideo.url} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />

      {/* Mode toggle */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
        <div className="glass rounded-full px-3 py-1.5 text-xs font-medium text-white bg-black/40">
          Tutorial · Pose {pose + 1} of 3
        </div>
        <div className="flex items-center gap-1 rounded-full bg-black/40 backdrop-blur p-1 text-xs">
          <button
            onClick={() => onModeChange("standing")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${mode === "standing" ? "bg-white text-black" : "text-white/80 hover:text-white"}`}
          >
            <PersonStanding className="h-3.5 w-3.5" /> Standing
          </button>
          <button
            onClick={() => onModeChange("seated")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${mode === "seated" ? "bg-white text-black" : "text-white/80 hover:text-white"}`}
          >
            <Accessibility className="h-3.5 w-3.5" /> Seated
          </button>
        </div>
      </div>

      {/* Pose figure */}
      <div className="absolute inset-0 grid place-items-center">
        <PoseFigure mode={mode} pose={pose} />
      </div>

      {/* Tip caption */}
      <div className="absolute left-4 right-4 bottom-20 md:bottom-24">
        <div className="glass rounded-2xl px-4 py-3 bg-black/50 text-white">
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/70">{current.sub}</div>
          <div className="mt-0.5 text-sm">{current.tip}</div>
        </div>
      </div>

      {/* Pose buttons */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
        <button
          onClick={() => onPoseChange((pose - 1 + 3) % 3)}
          className="h-9 w-9 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Previous pose"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 flex gap-2">
          {poses.map((p, i) => (
            <button
              key={p.label}
              onClick={() => onPoseChange(i)}
              className={`flex-1 rounded-xl px-3 py-2 text-xs text-left transition ${
                i === pose ? "bg-[color:var(--plum)] text-white shadow-[var(--shadow-lux)]" : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              <div className="font-medium">Pose {i + 1} · {p.label}</div>
              <div className="opacity-75 text-[10px] mt-0.5">{p.sub}</div>
            </button>
          ))}
        </div>
        <button
          onClick={() => onPoseChange((pose + 1) % 3)}
          className="h-9 w-9 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Next pose"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PoseFigure({ mode, pose }: { mode: PoseMode; pose: number }) {
  return (
    <div className="relative h-[70%] aspect-[3/4] grid place-items-center">
      {/* frame guides */}
      <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-white/30" />
      <div className="absolute -inset-0.5 rounded-2xl border border-[color:var(--plum)]/60 animate-pulse" />
      <svg viewBox="0 0 120 160" className="h-full w-auto text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.6)]">
        {mode === "standing" ? <StandingPose pose={pose} /> : <SeatedPose pose={pose} />}
      </svg>
    </div>
  );
}

function StandingPose({ pose }: { pose: number }) {
  const c = "currentColor";
  if (pose === 0) return (
    <g fill={c}>
      <circle cx="60" cy="24" r="12" />
      <path d="M40 40 L80 40 L86 96 L74 96 L72 150 L64 150 L62 96 L58 96 L56 150 L48 150 L46 96 L34 96 Z" opacity="0.95"/>
      <path d="M36 44 L18 92 M84 44 L102 92" stroke={c} strokeWidth="8" strokeLinecap="round" fill="none"/>
    </g>
  );
  if (pose === 1) return (
    <g fill={c}>
      <circle cx="62" cy="24" r="12" />
      <path d="M52 40 L72 40 L72 100 L68 100 L66 150 L58 150 L60 100 L52 100 Z"/>
      <path d="M62 44 L58 92" stroke={c} strokeWidth="8" strokeLinecap="round" fill="none"/>
    </g>
  );
  return (
    <g fill={c} opacity="0.9">
      <circle cx="60" cy="24" r="12" />
      <path d="M42 40 L78 40 L82 96 L72 96 L70 150 L62 150 L60 96 L58 96 L56 150 L48 150 L46 96 L38 96 Z"/>
      <path d="M40 44 L24 92 M80 44 L96 92" stroke={c} strokeWidth="8" strokeLinecap="round" fill="none"/>
      <circle cx="52" cy="22" r="2" fill="#000" opacity="0.4"/>
      <circle cx="68" cy="22" r="2" fill="#000" opacity="0.4"/>
    </g>
  );
}

function SeatedPose({ pose }: { pose: number }) {
  const c = "currentColor";
  // Chair (wheelchair) frame
  const chair = (
    <g stroke={c} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7">
      <circle cx="30" cy="130" r="14" />
      <circle cx="90" cy="130" r="14" />
      <path d="M30 100 L30 130 M90 100 L90 130 M22 100 L98 100" />
      <path d="M30 130 L30 150 M90 130 L90 150" />
    </g>
  );
  if (pose === 0) return (
    <g fill={c}>
      {chair}
      <circle cx="60" cy="34" r="12" />
      <path d="M42 50 L78 50 L82 96 L38 96 Z" />
      <path d="M38 96 L38 118 L54 118 L58 100 M82 96 L82 118 L66 118 L62 100" fill="none" stroke={c} strokeWidth="8" strokeLinecap="round" />
      <path d="M40 54 L26 82 M80 54 L94 82" stroke={c} strokeWidth="8" strokeLinecap="round" fill="none" />
    </g>
  );
  if (pose === 1) return (
    <g fill={c}>
      {chair}
      <circle cx="66" cy="34" r="12" />
      <path d="M56 50 L76 50 L76 96 L54 96 Z" />
      <path d="M54 96 L54 118 L64 118 L66 102" fill="none" stroke={c} strokeWidth="8" strokeLinecap="round" />
      <path d="M66 54 L58 82" stroke={c} strokeWidth="8" strokeLinecap="round" fill="none" />
    </g>
  );
  return (
    <g fill={c}>
      {chair}
      <circle cx="54" cy="34" r="12" />
      <path d="M44 50 L64 50 L66 96 L44 96 Z" />
      <path d="M66 96 L66 118 L56 118 L54 102" fill="none" stroke={c} strokeWidth="8" strokeLinecap="round" />
      <path d="M54 54 L62 82" stroke={c} strokeWidth="8" strokeLinecap="round" fill="none" />
    </g>
  );
}

/* ─────────────── Camera scan modal ─────────────── */

function ScanCameraModal({
  initialSeated, measurements, onClose, onFinished,
}: {
  initialSeated: boolean;
  measurements: { height: number; chest: number; waist: number; hip: number; inseam: number };
  onClose: () => void;
  onFinished: () => void;
}) {
  const [mode, setMode] = useState<PoseMode>(initialSeated ? "seated" : "standing");
  const [pose, setPose] = useState(0);
  const [captured, setCaptured] = useState<boolean[]>([false, false, false]);
  const [phase, setPhase] = useState<"camera" | "processing" | "done">("camera");
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1440 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e: unknown) {
        setCamError(e instanceof Error ? e.message : "Camera unavailable");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (phase !== "processing") return;
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(iv); setPhase("done"); return 100; }
        return p + 2;
      });
    }, 40);
    return () => clearInterval(iv);
  }, [phase]);

  const capture = () => {
    if (countdown !== null) return;
    setCountdown(3);
    let n = 3;
    const iv = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(iv);
        setCountdown(null);
        setCaptured((prev) => {
          const nx = [...prev];
          nx[pose] = true;
          const allDone = nx.every(Boolean);
          if (allDone) setPhase("processing");
          else setPose((p) => (nx[(p + 1) % 3] ? p : (p + 1) % 3));
          return nx;
        });
      } else setCountdown(n);
    }, 700);
  };

  const poseInfo = POSES[mode][pose];

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-0 sm:p-3 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl sm:rounded-3xl rounded-none overflow-hidden bg-card border border-border shadow-[var(--shadow-lux)] animate-fade-up relative my-0 sm:my-4 max-h-[100dvh] sm:max-h-[95vh] flex flex-col">
        <button onClick={onClose} className="absolute top-3 right-3 z-30 h-9 w-9 grid place-items-center rounded-full bg-black/40 text-white hover:bg-black/60">
          <X className="h-4 w-4" />
        </button>

        {phase === "camera" && (
          <div className="grid md:grid-cols-[1.4fr_1fr] overflow-y-auto">
            {/* Camera viewport */}
            <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] md:aspect-auto md:min-h-[560px] max-h-[50vh] md:max-h-none bg-black overflow-hidden flex items-center justify-center">
              {!camError ? (
                <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover object-center scale-x-[-1]" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-white/70 text-sm p-6 text-center">
                  <div>
                    <Camera className="h-8 w-8 mx-auto mb-3 opacity-70" />
                    <div className="font-medium mb-1">Camera unavailable</div>
                    <div className="text-xs opacity-80">Allow camera access to complete the scan, or continue with a simulated demo.</div>
                  </div>
                </div>
              )}
              {/* Pose overlay guide */}
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="h-[85%] aspect-[3/4] relative">
                  <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-[color:var(--plum)]/70 animate-pulse" />
                  <div className="absolute inset-0 grid place-items-center opacity-70">
                    <svg viewBox="0 0 120 160" className="h-full w-auto text-white/90">
                      {mode === "standing" ? <StandingPose pose={pose} /> : <SeatedPose pose={pose} />}
                    </svg>
                  </div>
                </div>
              </div>
              {/* Scan sweep line */}
              <div className="absolute inset-x-0 h-16 bg-gradient-to-b from-cyan-300/50 to-transparent animate-scan-sweep pointer-events-none" />
              {/* Countdown */}
              {countdown !== null && (
                <div className="absolute inset-0 grid place-items-center bg-black/40">
                  <div className="font-display text-white text-8xl">{countdown}</div>
                </div>
              )}
              {/* Top chip */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="glass rounded-full px-3 py-1.5 text-[11px] font-medium text-white bg-black/50">
                  <CircleDot className="h-3 w-3 inline mr-1 text-red-400 animate-pulse" /> Live camera
                </div>
                <div className="glass rounded-full px-3 py-1.5 text-[11px] font-medium text-white bg-black/50">
                  {mode === "seated" ? "Seated mode" : "Standing mode"}
                </div>
              </div>
            </div>

            {/* Side panel */}
            <div className="p-4 sm:p-6 md:p-7 flex flex-col">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--plum)]">Body scan</div>
              <h3 className="mt-2 font-display text-xl sm:text-2xl">Pose {pose + 1} · {poseInfo.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{poseInfo.sub}. {poseInfo.tip}</p>

              {/* Mode toggle */}
              <div className="mt-4 sm:mt-5 flex items-center gap-1 rounded-full bg-secondary p-1 text-[11px] sm:text-xs w-full sm:w-fit">
                <button
                  onClick={() => { setMode("standing"); setPose(0); setCaptured([false, false, false]); }}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 transition ${mode === "standing" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                >
                  <PersonStanding className="h-3.5 w-3.5" /> Standing
                </button>
                <button
                  onClick={() => { setMode("seated"); setPose(0); setCaptured([false, false, false]); }}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 transition ${mode === "seated" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                >
                  <Accessibility className="h-3.5 w-3.5" /> Seated
                </button>
              </div>

              {/* Pose progress */}
              <div className="mt-5 space-y-2">
                {POSES[mode].map((p, i) => (
                  <button
                    key={p.label}
                    onClick={() => setPose(i)}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      i === pose ? "border-[color:var(--plum)] bg-[color:var(--plum)]/5" : "border-border hover:bg-accent"
                    }`}
                  >
                    <span className={`h-6 w-6 grid place-items-center rounded-full text-[11px] font-medium ${
                      captured[i] ? "bg-emerald-500 text-white" : i === pose ? "bg-[color:var(--plum)] text-white" : "bg-secondary text-muted-foreground"
                    }`}>
                      {captured[i] ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-[11px] text-muted-foreground">{p.sub}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 md:mt-auto pt-4 sm:pt-6 flex gap-2">
                <button
                  onClick={capture}
                  disabled={captured[pose] || countdown !== null}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-medium disabled:opacity-40"
                >
                  <Camera className="h-4 w-4" /> {captured[pose] ? "Captured" : "Capture pose"}
                </button>
                {camError && (
                  <button
                    onClick={() => { setCaptured([true, true, true]); setPhase("processing"); }}
                    className="rounded-full border border-border px-4 py-3 text-xs"
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {phase === "processing" && (
          <div className="p-8 text-center">
            <h3 className="font-display text-3xl">Building your twin…</h3>
            <p className="mt-2 text-muted-foreground text-sm">Analyzing 42 body landmarks across 3 poses.</p>
            <div className="mt-6 relative mx-auto rounded-2xl overflow-hidden aspect-[3/4] max-w-xs" style={{ background: "var(--gradient-plum)" }}>
              <img src={twinImg} alt="" className="h-full w-full object-cover mix-blend-screen opacity-90" />
              <div className="absolute inset-x-0 h-16 bg-gradient-to-b from-cyan-300/60 to-transparent animate-scan-sweep" />
            </div>
            <div className="mt-6 h-2 rounded-full bg-secondary overflow-hidden max-w-sm mx-auto">
              <div className="h-full bg-[color:var(--plum)] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{progress}%</div>
          </div>
        )}

        {phase === "done" && (
          <div className="p-8 text-center">
            <div className="mx-auto h-14 w-14 grid place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-3xl">Your twin is ready.</h3>
            <p className="mt-2 text-muted-foreground text-sm">96% fit confidence · 42 landmarks · {mode === "seated" ? "Seated" : "Standing"} scan.</p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-left max-w-md mx-auto">
              {[["Height", `${measurements.height} cm`], ["Chest", `${measurements.chest} cm`], ["Waist", `${measurements.waist} cm`]].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border p-3">
                  <div className="text-[11px] text-muted-foreground">{k}</div>
                  <div className="font-display text-lg">{v}</div>
                </div>
              ))}
            </div>
            <button onClick={onFinished} className="mt-6 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm">
              View my Digital Twin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
