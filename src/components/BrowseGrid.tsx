// src/components/BrowseGrid.tsx
//
// One reusable product-browsing grid: search + filters + sort + pagination,
// all driven by the products API. Every control is sent to the API together,
// so search on a brand page stays inside that brand.
//
// Used by:
//   - the brand page (stores.$name.tsx)  — <BrowseGrid fixedBrand="Converse" />
//   - the Shop page (shop.tsx)           — <BrowseGrid />

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Heart, SlidersHorizontal, ChevronDown, X, Search, ShoppingBag } from "lucide-react";
import { shopStore, useShop, type Product } from "@/lib/shop-store";
import {
  productsApi, prettyCategory, rand,
  type ApiProduct, type BrowseFilters,
} from "@/lib/products-api";

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price (low to high)" },
  { key: "price_desc", label: "Price (high to low)" },
] as const;
type SortKey = typeof SORTS[number]["key"];

const GENDERS = [
  { key: "", label: "All" },
  { key: "women", label: "Women" },
  { key: "men", label: "Men" },
  { key: "kids", label: "Kids" },
] as const;

const PRICE_BANDS: { label: string; min?: number; max?: number }[] = [
  { label: "Under R300", max: 300 },
  { label: "R300–R700", min: 300, max: 700 },
  { label: "R700–R1 500", min: 700, max: 1500 },
  { label: "R1 500+", min: 1500 },
];

// Matched as "contains" by the API, so "black" also finds "washed black" etc.
const COLOURS = ["black", "white", "blue", "navy", "grey", "green", "red", "brown", "beige", "pink"];

type Option = { value: string; label: string };

function toProduct(p: ApiProduct): Product {
  return {
    id: p.id, name: p.name ?? "", brand: p.brand ?? "Superbalist",
    price: p.price ?? 0, img: p.img ?? "", retailer: p.retailer ?? "Superbalist",
    category: p.category ?? "", fit: p.fit ?? 0, description: "",
    sizes: [], materials: "", care: "", tailorTips: [],
  };
}

export function BrowseGrid({
  fixedBrand,
  fixedGender,
  title = "All pieces",
}: {
  fixedBrand?: string;
  fixedGender?: string;
  title?: string;
}) {
  const { wishlist } = useShop();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [gender, setGender] = useState<string>(fixedGender ?? "");
  const [category, setCategory] = useState<string | null>(null);
  const [colour, setColour] = useState<string | null>(null);
  const [priceBand, setPriceBand] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [openMobile, setOpenMobile] = useState(false);

  // wait until typing pauses before asking the API
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // any filter change starts again from page 1
  useEffect(() => { setPage(1); }, [debouncedSearch, gender, category, colour, priceBand, sort, fixedBrand]);

  // a category from one gender may not exist in another
  useEffect(() => { setCategory(null); }, [gender]);

  const band = PRICE_BANDS.find((b) => b.label === priceBand);

  const filters: BrowseFilters = {
    brand: fixedBrand,
    gender: gender || undefined,
    category: category ?? undefined,
    colour: colour ?? undefined,
    min_price: band?.min,
    max_price: band?.max,
    q: debouncedSearch || undefined,
    sort,
    page,
    page_size: 24,
  };

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["browse", filters],
    queryFn: () => productsApi.list(filters),
    placeholderData: keepPreviousData,
  });

  // only categories this brand / gender actually has
  const { data: catData } = useQuery({
    queryKey: ["categories", gender, fixedBrand ?? ""],
    queryFn: () => productsApi.categories({ gender: gender || undefined, brand: fixedBrand }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 0;
  const categoryOptions: Option[] = (catData?.categories ?? []).map((c) => ({ value: c, label: prettyCategory(c) }));

  const activeCount = (category ? 1 : 0) + (colour ? 1 : 0) + (priceBand ? 1 : 0);
  const clearAll = () => { setCategory(null); setColour(null); setPriceBand(null); setSearch(""); };

  const goTo = (p: number) => {
    setPage(p);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const panel = (
    <FilterPanel
      sections={[
        { label: "Category", options: categoryOptions, value: category, set: setCategory },
        { label: "Price", options: PRICE_BANDS.map((b) => ({ value: b.label, label: b.label })), value: priceBand, set: setPriceBand },
        { label: "Colour", options: COLOURS.map((c) => ({ value: c, label: c })), value: colour, set: setColour },
      ]}
      activeCount={activeCount}
      clearAll={clearAll}
    />
  );

  return (
    <section className="mt-10">
      {/* Title + search + sort */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={fixedBrand ? `Search ${fixedBrand}…` : "Search pieces or brands…"}
              aria-label="Search products"
              className="w-56 sm:w-64 rounded-full border border-border bg-card pl-9 pr-8 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--plum)]/40"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <SortMenu sort={sort} setSort={setSort} />
          <button
            onClick={() => setOpenMobile(true)}
            className="lg:hidden inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeCount > 0 && <span className="ml-1 rounded-full bg-[color:var(--plum)] text-white text-[10px] px-1.5 py-0.5">{activeCount}</span>}
          </button>
        </div>
      </div>

      {/* Gender tabs */}
      {!fixedGender && (
        <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1 text-sm">
          {GENDERS.map((g) => (
            <button
              key={g.key}
              onClick={() => setGender(g.key)}
              className={`rounded-full px-4 py-1.5 transition ${gender === g.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid lg:grid-cols-[1fr_260px] gap-8">
        <div>
          <div className="text-xs text-muted-foreground min-h-5">
            {isLoading ? "Loading…" : `${rand(total).slice(1)} piece${total === 1 ? "" : "s"}`}
            {isFetching && !isLoading && <span className="ml-2 opacity-60">updating…</span>}
            {activeCount > 0 && (
              <button onClick={clearAll} className="ml-3 inline-flex items-center gap-1 hover:text-foreground">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>

          {isError ? (
            <div className="mt-3 rounded-3xl border border-dashed border-rose-300 p-10 text-center text-sm text-muted-foreground">
              Couldn't reach the products service. Check that it's running on port 8001.
            </div>
          ) : isLoading ? (
            <div className="mt-3 grid grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-3xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mt-3 rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nothing matches yet. <button onClick={clearAll} className="underline">Clear filters</button>.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {items.map((p) => <ProductCard key={p.id} p={p} inWish={wishlist.has(p.id)} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3 text-sm">
              <button disabled={page <= 1} onClick={() => goTo(page - 1)} className="rounded-full border border-border px-4 py-2 disabled:opacity-40 hover:bg-accent">
                ← Prev
              </button>
              <span className="text-muted-foreground">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => goTo(page + 1)} className="rounded-full border border-border px-4 py-2 disabled:opacity-40 hover:bg-accent">
                Next →
              </button>
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">{panel}</div>
        </aside>
      </div>

      {openMobile && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpenMobile(false)}>
          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-background border-l border-border overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-display text-xl">Filters</div>
              <button onClick={() => setOpenMobile(false)} aria-label="Close filters" className="h-8 w-8 grid place-items-center rounded-full bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            {panel}
            <button onClick={() => setOpenMobile(false)} className="mt-6 w-full rounded-full bg-primary text-primary-foreground py-3 text-sm">
              Show {total} piece{total === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function ProductCard({ p, inWish }: { p: ApiProduct; inWish: boolean }) {
  return (
    <article className="group rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lux)] transition">
      <Link to="/product/$id" params={{ id: p.id }} className="relative block aspect-[4/5] overflow-hidden bg-secondary">
        {p.img ? (
          <img src={p.img} alt={p.name} loading="lazy" className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105" />
        ) : <div className="h-full w-full bg-secondary" />}
        {p.onSale && (
          <div className="absolute top-3 left-3 rounded-full bg-[color:var(--plum)] text-white px-2.5 py-1 text-[10px] font-semibold">Sale</div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); shopStore.toggleWish(p.id); }}
          className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full glass bg-white/80"
          aria-label={inWish ? "Remove from wishlist" : "Save to wishlist"}
        >
          <Heart className={`h-4 w-4 ${inWish ? "fill-[color:var(--plum)] text-[color:var(--plum)]" : ""}`} />
        </button>
      </Link>
      <div className="p-4">
        <div className="text-xs text-muted-foreground truncate">{p.brand ?? "Superbalist"}</div>
        <Link to="/product/$id" params={{ id: p.id }} className="mt-1 block font-display text-base sm:text-lg leading-snug hover:text-[color:var(--plum)] line-clamp-2">
          {p.name}
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-medium text-sm">
            {rand(p.price)}
            {p.onSale && p.wasPrice ? <span className="ml-2 text-xs text-muted-foreground line-through">{rand(p.wasPrice)}</span> : null}
          </span>
          <button
            onClick={() => shopStore.addToCart(toProduct(p))}
            aria-label={`Add ${p.name} to cart`}
            className="rounded-full bg-secondary hover:bg-accent px-3 py-1.5 text-xs inline-flex items-center gap-1"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
    </article>
  );
}

function SortMenu({ sort, setSort }: { sort: SortKey; setSort: (s: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const current = SORTS.find((s) => s.key === sort)!;
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm">
        Sort: <span className="font-medium">{current.label}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-40 w-56 rounded-2xl border border-border bg-card shadow-[var(--shadow-lux)] p-1.5">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => { setSort(s.key); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-secondary ${sort === s.key ? "bg-secondary font-medium" : ""}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type Section = { label: string; options: Option[]; value: string | null; set: (v: string | null) => void };

function FilterPanel({ sections, activeCount, clearAll }: { sections: Section[]; activeCount: number; clearAll: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ Category: true, Price: true, Colour: true });
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1.5 font-display text-lg"><SlidersHorizontal className="h-4 w-4" /> Filters</div>
        {activeCount > 0 && <button onClick={clearAll} className="text-[11px] text-muted-foreground hover:text-foreground">Clear ({activeCount})</button>}
      </div>
      <div className="divide-y divide-border max-h-[70vh] overflow-y-auto pr-1">
        {sections.filter((s) => s.options.length > 0).map((s) => {
          const isOpen = open[s.label] ?? false;
          return (
            <div key={s.label} className="py-2.5">
              <button onClick={() => setOpen((p) => ({ ...p, [s.label]: !isOpen }))} className="w-full flex items-center justify-between text-sm py-1">
                <span className="font-medium">
                  {s.label}
                  {s.value ? <span className="ml-1.5 text-[10px] rounded-full bg-[color:var(--plum)] text-white px-1.5 py-0.5">1</span> : null}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.options.map((opt) => {
                    const active = s.value === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => s.set(active ? null : opt.value)}
                        className={`text-[11px] rounded-full px-2.5 py-1 border transition first-letter:uppercase
                          ${active ? "bg-[color:var(--plum)] text-white border-transparent" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
