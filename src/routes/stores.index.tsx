import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shirt, Truck, Sparkles, ArrowRight, Search } from "lucide-react";
import { Nav } from "@/components/Nav";
import { PRODUCTS } from "@/lib/shop-store";

type Retailer = {
  name: string;
  tagline: string;
  color: string;
  accent: string;
  products: number;
  promo: string;
  delivery: string;
  match: number;
};

const RETAILERS: Retailer[] = [
  { name: "Farfetch", tagline: "Global luxury, curated.", color: "#0b0b0b", accent: "#e8d8b8", products: 12400, promo: "Up to 30% off outerwear", delivery: "2–4 days", match: 96 },
  { name: "Net-a-Porter", tagline: "The edit of the season.", color: "#1a1a1a", accent: "#f4e4d6", products: 8900, promo: "Free express shipping", delivery: "1–3 days", match: 94 },
  { name: "Mr Porter", tagline: "Modern menswear, expertly styled.", color: "#111827", accent: "#d4c4a8", products: 6700, promo: "New in: FW capsule", delivery: "2–4 days", match: 91 },
  { name: "Zara", tagline: "Trends, delivered weekly.", color: "#000", accent: "#f5f5f5", products: 4200, promo: "New arrivals daily", delivery: "3–5 days", match: 88 },
  { name: "Superbalist", tagline: "Local design, elevated.", color: "#7c3aed", accent: "#ede9fe", products: 3100, promo: "20% off first order", delivery: "1–2 days", match: 86 },
  { name: "Cotton On", tagline: "Everyday essentials.", color: "#0891b2", accent: "#cffafe", products: 2600, promo: "Buy 2 get 1 free tees", delivery: "3–5 days", match: 84 },
  { name: "H&M", tagline: "Fashion, for everyone.", color: "#e11d48", accent: "#ffe4e6", products: 5400, promo: "Members save 15%", delivery: "3–6 days", match: 82 },
  { name: "Nike", tagline: "Move with purpose.", color: "#111", accent: "#f5f5f4", products: 1900, promo: "Free returns 60 days", delivery: "2–4 days", match: 90 },
];

export const Route = createFileRoute("/stores/")({
  head: () => ({
    meta: [
      { title: "Retail Stores — Every brand, one fit · Mannequin AI" },
      { name: "description", content: "Shop 40+ integrated retailers with your Digital Twin. Farfetch, Net-a-Porter, Zara, Nike and more — every size personalised." },
      { property: "og:title", content: "Retail Stores · Mannequin AI" },
      { property: "og:description", content: "Every retailer, one perfectly fitted twin." },
    ],
  }),
  component: StoresPage,
});

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function StoresPage() {
  const [q, setQ] = useState("");
  const [letter, setLetter] = useState<string | null>(null);
  const list = RETAILERS.filter((r) => {
    const matchesQ = r.name.toLowerCase().includes(q.toLowerCase());
    const matchesL = !letter || r.name[0].toUpperCase() === letter;
    return matchesQ && matchesL;
  });
  const availableLetters = new Set(RETAILERS.map((r) => r.name[0].toUpperCase()));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
              <span className="h-px w-6 bg-[color:var(--plum)]" /> Retail stores
            </div>
            <h1 className="mt-3 font-display text-4xl md:text-5xl">Every brand. <span className="italic">One fit.</span></h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Your Digital Twin travels across every integrated retailer. Sizes translate automatically — no more guessing between a European 38 and a US 6.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search retailer…"
              className="w-72 rounded-full border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--plum)]/40"
            />
          </div>
        </div>

        <div className="mt-10 flex gap-3 md:gap-6">
          <div className="flex-1 min-w-0">
            {letter && (
              <div className="mb-4 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Filtered by</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--plum)] text-white px-3 py-1 font-semibold">
                  {letter}
                  <button onClick={() => setLetter(null)} className="ml-1 opacity-80 hover:opacity-100">✕</button>
                </span>
              </div>
            )}
            {list.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                No retailers matching {letter ? `“${letter}”` : `“${q}”`}.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.map((r) => (
                  <Link
                    key={r.name}
                    to="/stores/$name"
                    params={{ name: r.name.toLowerCase().replace(/[^a-z0-9]/g, "-") }}
                    className="group rounded-3xl overflow-hidden border border-border bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lux)] transition"
                  >
                    <div className="relative h-40" style={{ background: `linear-gradient(135deg, ${r.color}, ${r.accent})` }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-display text-4xl md:text-5xl tracking-tight" style={{ color: r.accent }}>
                          {r.name}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 glass rounded-full px-3 py-1 text-[11px] font-medium bg-white/85">
                        <span className="text-[color:var(--plum)] font-semibold">{r.match}%</span> match
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="text-sm text-muted-foreground">{r.tagline}</div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{r.products.toLocaleString()} pieces</span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground"><Truck className="h-3 w-3" /> {r.delivery}</span>
                      </div>
                      <div className="mt-3 rounded-2xl bg-secondary/70 px-3 py-2 text-xs inline-flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-[color:var(--plum)]" /> {r.promo}
                      </div>
                      <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[color:var(--plum)]">
                        Enter store <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* A–Z rail */}
          <aside className="block sticky top-24 self-start">
            <div className="rounded-2xl border border-border bg-card px-1.5 py-2 shadow-[var(--shadow-card)]">
              <div className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground text-center pb-1.5 border-b border-border mb-1">A–Z</div>
              <div className="flex flex-col">
                {ALPHABET.map((L) => {
                  const has = availableLetters.has(L);
                  const active = letter === L;
                  return (
                    <button
                      key={L}
                      disabled={!has}
                      onClick={() => setLetter(active ? null : L)}
                      className={`text-[11px] font-semibold w-6 h-6 rounded-md transition ${
                        active
                          ? "bg-[color:var(--plum)] text-white"
                          : has
                          ? "text-foreground hover:bg-secondary"
                          : "text-muted-foreground/30 cursor-not-allowed"
                      }`}
                    >
                      {L}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>

        {/* Preview strip of pieces */}
        <section className="mt-20">
          <h2 className="font-display text-2xl">Trending across your stores</h2>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PRODUCTS.map((p) => (
              <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="rounded-2xl overflow-hidden bg-card border border-border">
                <img src={p.img} alt={p.name} className="aspect-square object-cover w-full" />
                <div className="p-2 text-[11px] text-muted-foreground truncate">{p.retailer}</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-display text-foreground text-lg"><Shirt className="h-5 w-5" /> Mannequin AI</div>
          <div>© {new Date().getFullYear()} Mannequin AI</div>
        </div>
      </footer>
    </div>
  );
}

