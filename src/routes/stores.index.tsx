import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shirt, ArrowRight, Search } from "lucide-react";
import { Nav } from "@/components/Nav";
import { BrandLogo } from "@/components/BrandLogo";
import { productsApi, brandSlug, type BrandCard } from "@/lib/products-api";

// Superbalist is one retailer carrying hundreds of brands, so this page lists
// BRANDS. Each card's cover image is one of that brand's own products
// (served by GET /brands/cards), so every brand gets a real thumbnail.

export const Route = createFileRoute("/stores/")({
  head: () => ({
    meta: [
      { title: "Brands — Every label, one fit · Mannequin AI" },
      { name: "description", content: "Shop hundreds of brands with your Digital Twin. Every size personalised, one universal cart." },
      { property: "og:title", content: "Brands · Mannequin AI" },
      { property: "og:description", content: "Every brand, one perfectly fitted twin." },
    ],
  }),
  component: BrandsPage,
});

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const firstLetter = (name: string) => {
  const c = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : "#";
};

function BrandsPage() {
  const [q, setQ] = useState("");
  const [letter, setLetter] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["brand-cards"],
    queryFn: () => productsApi.brandCards(),
  });
  const brands: BrandCard[] = data?.brands ?? [];

  const list = useMemo(
    () => brands.filter((b) =>
      b.name.toLowerCase().includes(q.trim().toLowerCase()) &&
      (!letter || firstLetter(b.name) === letter),
    ),
    [brands, q, letter],
  );
  const availableLetters = useMemo(() => new Set(brands.map((b) => firstLetter(b.name))), [brands]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
              <span className="h-px w-6 bg-[color:var(--plum)]" /> Brands
            </div>
            <h1 className="mt-3 font-display text-4xl md:text-5xl">Every brand. <span className="italic">One fit.</span></h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {brands.length > 0 ? `${brands.length} brands` : "Brands"} carried by Superbalist, ready for your Digital Twin.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search brands…"
              aria-label="Search brands"
              className="w-72 rounded-full border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--plum)]/40"
            />
          </div>
        </div>

        <div className="mt-10 flex gap-3 md:gap-6">
          <div className="flex-1 min-w-0">
            {letter && (
              <div className="mb-4 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Starting with</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--plum)] text-white px-3 py-1 font-semibold">
                  {letter}
                  <button onClick={() => setLetter(null)} aria-label="Clear letter filter" className="ml-1 opacity-80 hover:opacity-100">✕</button>
                </span>
              </div>
            )}

            {isError ? (
              <div className="rounded-3xl border border-dashed border-rose-300 p-12 text-center text-sm text-muted-foreground">
                Couldn't load brands. Check that the products service is running on port 8001.
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] rounded-3xl border border-border bg-card animate-pulse" />
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                No brands matching {letter ? `“${letter}”` : `“${q}”`}.
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {list.map((b) => (
                  <Link
                    key={b.name}
                    to="/stores/$name"
                    params={{ name: brandSlug(b.name) }}
                    className="group rounded-2xl overflow-hidden border border-border bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lux)] transition"
                  >
                    {/* Bash-style logo tile (logo → product photo → text) */}
                    <BrandLogo name={b.name} photo={b.img} className="aspect-[4/3] w-full" />
                    <div className="flex items-center justify-between gap-2 px-4 py-3">
                      <div className="min-w-0">
                        <div className="font-display text-base sm:text-lg leading-tight truncate">{b.name}</div>
                        <div className="text-xs text-muted-foreground">{b.count} piece{b.count === 1 ? "" : "s"}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* A–Z rail */}
          <aside className="hidden sm:block sticky top-24 self-start">
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
                        active ? "bg-[color:var(--plum)] text-white"
                          : has ? "text-foreground hover:bg-secondary"
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
