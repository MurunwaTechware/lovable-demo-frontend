import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Truck, Sparkles, Heart, Shirt, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { Nav } from "@/components/Nav";
import { getRetailerCatalog, PRODUCTS, shopStore, useShop, type Product } from "@/lib/shop-store";

export const Route = createFileRoute("/stores/$name")({
  head: ({ params }) => ({
    meta: [
      { title: `${getRetailerCatalog(params.name)?.name ?? prettyName(params.name)} — Retailer store · Mannequin AI` },
      { name: "description", content: `Shop ${getRetailerCatalog(params.name)?.name ?? prettyName(params.name)} with your Digital Twin. Perfect fit, tailor-recommended, one universal cart.` },
    ],
  }),
  component: RetailerPage,
});

function prettyName(slug: string) {
  return slug.split("-").map((s) => s[0]?.toUpperCase() + s.slice(1)).join(" ");
}

// ---------- Deterministic pseudo-attributes for filtering ----------
const COLORS = ["Black", "White", "Cream", "Camel", "Navy", "Plum", "Olive", "Red"];
const MATERIALS = ["Leather", "Cotton", "Wool", "Silk", "Linen", "Denim", "Cashmere"];
const FABRICS = ["Woven", "Knit", "Jersey", "Twill", "Satin"];
const NECKLINES = ["Crew", "V-neck", "Scoop", "Halter", "Off-shoulder", "Turtleneck"];
const SLEEVES = ["Sleeveless", "Short", "3/4", "Long"];
const TOP_LENGTHS = ["Cropped", "Regular", "Longline", "Tunic"];
const TOP_TYPES = ["T-shirt", "Blouse", "Shirt", "Hoodie", "Knit", "Tank"];
const SHIRT_STYLES = ["Classic", "Oversized", "Fitted", "Relaxed", "Boxy"];
const SNEAKER_STYLES = ["Court", "Runner", "Retro", "Skate", "Chunky"];
const FLAT_STYLES = ["Ballet", "Loafer", "Mule", "Sandal", "Slide"];
const BAG_STYLES = ["Tote", "Shoulder", "Crossbody", "Clutch", "Backpack", "Bucket"];
const FRAGRANCE_FOR = ["Women", "Men", "Unisex"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function pick<T>(arr: T[], seed: number) { return arr[seed % arr.length]; }

type Attrs = {
  color: string;
  material: string;
  fabric: string;
  neckline: string;
  sleeve: string;
  topLength: string;
  topType: string;
  shirtStyle: string;
  sneakerStyle: string;
  flatStyle: string;
  bagStyle: string;
  fragranceFor: string;
  discount: number; // %
  isNew: boolean;
  popularity: number;
  rating: number;
};

function attrsFor(p: Product): Attrs {
  const h = hash(p.id + p.name);
  return {
    color: pick(COLORS, h),
    material: pick(MATERIALS, h >> 2),
    fabric: pick(FABRICS, h >> 3),
    neckline: pick(NECKLINES, h >> 4),
    sleeve: pick(SLEEVES, h >> 5),
    topLength: pick(TOP_LENGTHS, h >> 6),
    topType: pick(TOP_TYPES, h >> 7),
    shirtStyle: pick(SHIRT_STYLES, h >> 8),
    sneakerStyle: pick(SNEAKER_STYLES, h >> 9),
    flatStyle: pick(FLAT_STYLES, h >> 10),
    bagStyle: pick(BAG_STYLES, h >> 11),
    fragranceFor: pick(FRAGRANCE_FOR, h >> 12),
    discount: [0, 10, 20, 30, 50][h % 5],
    isNew: h % 3 === 0,
    popularity: (h % 100),
    rating: 3.5 + ((h % 15) / 10),
  };
}

// Which filter groups apply, based on categories present in this retailer's products
function buildGroups(products: Product[]) {
  const cats = new Set(products.map((p) => p.category.toLowerCase()));
  const hasClothing = ["outerwear","dresses","suiting","tops","clothing","trend","editorial","menswear","local design","everyday","luxury"].some((c) => cats.has(c));
  const hasShoes = cats.has("shoes");
  const hasBags = cats.has("accessories") || cats.has("bags");
  const hasFragrance = cats.has("fragrance") || cats.has("beauty");

  const groups: Array<{ key: keyof Attrs | "category" | "brand" | "sizes" | "discount" | "price"; label: string; options: string[] }> = [
    { key: "category", label: "Category", options: Array.from(new Set(products.map((p) => p.category))) },
    { key: "brand", label: "Brand", options: Array.from(new Set(products.map((p) => p.brand))) },
    { key: "sizes", label: "Sizes", options: Array.from(new Set(products.flatMap((p) => p.sizes))) },
    { key: "price", label: "Price", options: ["Under $50", "$50–$150", "$150–$400", "$400+"] },
    { key: "discount", label: "Discount", options: ["10%+", "20%+", "30%+", "50%+"] },
    { key: "color", label: "Primary colour", options: COLORS },
    { key: "material", label: "Material", options: MATERIALS },
  ];
  if (hasClothing) {
    groups.push(
      { key: "fabric", label: "Fabric", options: FABRICS },
      { key: "neckline", label: "Neckline", options: NECKLINES },
      { key: "sleeve", label: "Sleeve length", options: SLEEVES },
      { key: "topLength", label: "Top length", options: TOP_LENGTHS },
      { key: "topType", label: "Tops type", options: TOP_TYPES },
      { key: "shirtStyle", label: "Shirt & top style", options: SHIRT_STYLES },
    );
  }
  if (hasShoes) {
    groups.push(
      { key: "sneakerStyle", label: "Sneaker style", options: SNEAKER_STYLES },
      { key: "flatStyle", label: "Flat shoe style", options: FLAT_STYLES },
    );
  }
  if (hasBags) groups.push({ key: "bagStyle", label: "Bag style", options: BAG_STYLES });
  if (hasFragrance) groups.push({ key: "fragranceFor", label: "Fragrance for", options: FRAGRANCE_FOR });
  return groups;
}

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "popular", label: "Popular" },
  { key: "topRated", label: "Top rated" },
  { key: "priceLow", label: "Price (low to high)" },
  { key: "priceHigh", label: "Price (high to low)" },
  { key: "discountHigh", label: "Discount (high to low)" },
] as const;
type SortKey = typeof SORTS[number]["key"];

function RetailerPage() {
  const { name } = Route.useParams();
  const catalog = getRetailerCatalog(name);
  const pretty = catalog?.name ?? prettyName(name);
  const { wishlist } = useShop();
  const baseProducts = catalog?.products ?? PRODUCTS;

  const enriched = useMemo(() => baseProducts.map((p) => ({ p, a: attrsFor(p) })), [baseProducts]);
  const groups = useMemo(() => buildGroups(baseProducts), [baseProducts]);

  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [sort, setSort] = useState<SortKey>("popular");
  const [openMobile, setOpenMobile] = useState(false);

  const toggle = (g: string, o: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      const s = new Set(next[g] ?? []);
      if (s.has(o)) s.delete(o); else s.add(o);
      next[g] = s;
      return next;
    });
  };
  const clearAll = () => setSelected({});
  const activeCount = Object.values(selected).reduce((n, s) => n + s.size, 0);

  const filtered = useMemo(() => {
    let list = enriched.filter(({ p, a }) => {
      for (const [key, set] of Object.entries(selected)) {
        if (!set.size) continue;
        if (key === "category" && !set.has(p.category)) return false;
        else if (key === "brand" && !set.has(p.brand)) return false;
        else if (key === "sizes" && !p.sizes.some((s) => set.has(s))) return false;
        else if (key === "price") {
          const ok = Array.from(set).some((r) =>
            (r === "Under $50" && p.price < 50) ||
            (r === "$50–$150" && p.price >= 50 && p.price <= 150) ||
            (r === "$150–$400" && p.price > 150 && p.price <= 400) ||
            (r === "$400+" && p.price > 400)
          );
          if (!ok) return false;
        } else if (key === "discount") {
          const min = Math.min(...Array.from(set).map((d) => parseInt(d)));
          if (a.discount < min) return false;
        } else if (key in a) {
          const v = (a as unknown as Record<string, string | number>)[key];
          if (!set.has(String(v))) return false;
        }
      }
      return true;
    });
    const sorters: Record<SortKey, (x: typeof enriched[number], y: typeof enriched[number]) => number> = {
      newest: (x, y) => Number(y.a.isNew) - Number(x.a.isNew),
      popular: (x, y) => y.a.popularity - x.a.popularity,
      topRated: (x, y) => y.a.rating - x.a.rating,
      priceLow: (x, y) => x.p.price - y.p.price,
      priceHigh: (x, y) => y.p.price - x.p.price,
      discountHigh: (x, y) => y.a.discount - x.a.discount,
    };
    return [...list].sort(sorters[sort]);
  }, [enriched, selected, sort]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-24">
        <Link to="/stores" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> All retailers
        </Link>

        <div className="mt-6 rounded-[2rem] overflow-hidden border border-border shadow-[var(--shadow-lux)]" style={{ background: "var(--gradient-hero)" }}>
          <div className="p-10 md:p-14">
            <div className="text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">Retailer</div>
            <h1 className="mt-2 font-display text-5xl md:text-6xl">{pretty}</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Shop {pretty} with your Digital Twin. Sizes translated, tailoring suggested, one universal cart.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full bg-white/70 backdrop-blur px-3 py-1.5 inline-flex items-center gap-1.5"><Truck className="h-3 w-3" /> 2–4 day delivery</span>
              <span className="rounded-full bg-white/70 backdrop-blur px-3 py-1.5 inline-flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-[color:var(--plum)]" /> Twin-verified</span>
              <span className="rounded-full bg-white/70 backdrop-blur px-3 py-1.5">30-day returns</span>
            </div>
          </div>
        </div>

        {/* Sort + filter toolbar */}
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl">Curated for your twin</h2>
            <div className="flex items-center gap-2">
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

          <div className="mt-6 grid lg:grid-cols-[1fr_280px] gap-8">
            {/* Product grid */}
            <div>
              <div className="text-xs text-muted-foreground">
                {filtered.length} piece{filtered.length === 1 ? "" : "s"}
                {activeCount > 0 && (
                  <button onClick={clearAll} className="ml-3 inline-flex items-center gap-1 hover:text-foreground">
                    <X className="h-3 w-3" /> Clear all
                  </button>
                )}
              </div>
              <div className="mt-3 grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map(({ p, a }) => {
                  const inWish = wishlist.has(p.id);
                  return (
                    <article key={p.id} className="group rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)]">
                      <Link to="/product/$id" params={{ id: p.id }} className="relative block aspect-[4/5] overflow-hidden bg-secondary">
                        <img src={p.img} alt={p.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                        <div className="absolute bottom-3 left-3 glass rounded-full px-3 py-1 text-[11px] font-medium bg-white/80">
                          <span className="text-[color:var(--plum)] font-semibold">{p.fit}%</span> fit
                        </div>
                        {a.discount > 0 && (
                          <div className="absolute top-3 left-3 rounded-full bg-[color:var(--plum)] text-white px-2.5 py-1 text-[10px] font-semibold">-{a.discount}%</div>
                        )}
                        <button
                          onClick={(e) => { e.preventDefault(); shopStore.toggleWish(p.id); }}
                          className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full glass bg-white/80"
                          aria-label="Save"
                        >
                          <Heart className={`h-4 w-4 ${inWish ? "fill-[color:var(--plum)] text-[color:var(--plum)]" : ""}`} />
                        </button>
                      </Link>
                      <div className="p-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{p.brand}</span>
                          <span>★ {a.rating.toFixed(1)}</span>
                        </div>
                        <Link to="/product/$id" params={{ id: p.id }} className="mt-1 block font-display text-lg hover:text-[color:var(--plum)]">
                          {p.name}
                        </Link>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-medium">${p.price}</span>
                          <button
                            onClick={() => shopStore.addToCart(p)}
                            className="rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="col-span-full rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                    No pieces match your filters. <button onClick={clearAll} className="underline">Clear all</button>.
                  </div>
                )}
              </div>
            </div>

            {/* Right-hand filter panel */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <FilterPanel groups={groups} selected={selected} toggle={toggle} clearAll={clearAll} activeCount={activeCount} />
              </div>
            </aside>
          </div>
        </section>

        {/* Mobile filter sheet */}
        {openMobile && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpenMobile(false)}>
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-background border-l border-border overflow-y-auto p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="font-display text-xl">Filters</div>
                <button onClick={() => setOpenMobile(false)} className="h-8 w-8 grid place-items-center rounded-full bg-secondary"><X className="h-4 w-4" /></button>
              </div>
              <FilterPanel groups={groups} selected={selected} toggle={toggle} clearAll={clearAll} activeCount={activeCount} />
              <button
                onClick={() => setOpenMobile(false)}
                className="mt-6 w-full rounded-full bg-primary text-primary-foreground py-3 text-sm"
              >
                Show {filtered.length} piece{filtered.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        )}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-display text-foreground text-lg"><Shirt className="h-5 w-5" /> Mannequin AI</div>
          <div>© {new Date().getFullYear()} Mannequin AI</div>
        </div>
      </footer>
    </div>
  );
}

function SortMenu({ sort, setSort }: { sort: SortKey; setSort: (s: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const current = SORTS.find((s) => s.key === sort)!;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm"
      >
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

function FilterPanel({
  groups,
  selected,
  toggle,
  clearAll,
  activeCount,
}: {
  groups: ReturnType<typeof buildGroups>;
  selected: Record<string, Set<string>>;
  toggle: (g: string, o: string) => void;
  clearAll: () => void;
  activeCount: number;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ category: true, price: true, brand: true });
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1.5 font-display text-lg"><SlidersHorizontal className="h-4 w-4" /> Filters</div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-[11px] text-muted-foreground hover:text-foreground">Clear ({activeCount})</button>
        )}
      </div>
      <div className="divide-y divide-border max-h-[70vh] overflow-y-auto pr-1">
        {groups.map((g) => {
          const isOpen = open[g.key as string] ?? false;
          const sel = selected[g.key as string];
          return (
            <div key={g.key as string} className="py-2.5">
              <button
                onClick={() => setOpen((p) => ({ ...p, [g.key as string]: !isOpen }))}
                className="w-full flex items-center justify-between text-sm py-1"
              >
                <span className="font-medium">
                  {g.label}
                  {sel?.size ? <span className="ml-1.5 text-[10px] rounded-full bg-[color:var(--plum)] text-white px-1.5 py-0.5">{sel.size}</span> : null}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {g.options.map((opt) => {
                    const active = sel?.has(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggle(g.key as string, opt)}
                        className={`text-[11px] rounded-full px-2.5 py-1 border transition
                          ${active
                            ? "bg-[color:var(--plum)] text-white border-transparent"
                            : "bg-background border-border text-muted-foreground hover:text-foreground"}`}
                      >
                        {opt}
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
