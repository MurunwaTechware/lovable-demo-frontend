import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Heart, ShoppingBag, Star, MapPin, Ruler, Truck, RefreshCw, Check, ArrowLeft, Scissors, Shirt,
  Store, Navigation, Search, Loader2, Phone, Clock, PackageCheck, PackageX, Package,
} from "lucide-react";
import twinImg from "@/assets/twin.jpg";
import { Nav } from "@/components/Nav";
import { getProduct, PRODUCTS, shopStore, useShop } from "@/lib/shop-store";


export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — ${loaderData.product.brand} · Mannequin AI` },
          { name: "description", content: loaderData.product.description.slice(0, 155) },
          { property: "og:title", content: `${loaderData.product.name} — ${loaderData.product.brand}` },
          { property: "og:description", content: loaderData.product.description.slice(0, 155) },
          { property: "og:image", content: loaderData.product.img },
        ]
      : [{ title: "Product · Mannequin AI" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="font-display text-3xl">Piece not found</h1>
        <Link to="/" className="mt-4 inline-flex text-sm text-[color:var(--plum)] underline">Back to marketplace</Link>
      </div>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { wishlist } = useShop();
  const [size, setSize] = useState(product.sizes[Math.floor(product.sizes.length / 2)]);
  const [addedToast, setAddedToast] = useState(false);
  const inWish = wishlist.has(product.id);

  const related = PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 3);
  const fallbackRelated = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);
  const suggestions = related.length ? related : fallbackRelated;

  const onAdd = () => {
    shopStore.addToCart(product);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 1800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="mx-auto max-w-7xl px-6 pt-24 pb-24">
        <Link to="/" hash="shop" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Marketplace
        </Link>

        <div className="mt-6 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-start">
          {/* Gallery + virtual twin preview */}
          <div className="space-y-4">
            <div className="relative rounded-[2rem] overflow-hidden shadow-[var(--shadow-lux)] aspect-[4/5] bg-secondary">
              <img src={product.img} alt={product.name} className="h-full w-full object-cover" />
              <div className="absolute top-4 left-4 glass rounded-full px-3 py-1 text-xs font-medium bg-white/80">
                <span className="text-[color:var(--plum)] font-semibold">{product.fit}%</span> fit for you
              </div>
              <button
                onClick={() => shopStore.toggleWish(product.id)}
                className="absolute top-4 right-4 h-10 w-10 grid place-items-center rounded-full glass bg-white/80"
                aria-label="Save to wishlist"
              >
                <Heart className={`h-4 w-4 transition ${inWish ? "fill-[color:var(--plum)] text-[color:var(--plum)]" : "text-foreground"}`} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative rounded-2xl overflow-hidden aspect-square" style={{ background: "var(--gradient-plum)" }}>
                <img src={twinImg} alt="On your twin" className="h-full w-full object-cover mix-blend-screen opacity-80" />
                <img src={product.img} alt="" className="absolute inset-0 h-full w-full object-contain p-3 mix-blend-multiply opacity-90" />
                <div className="absolute bottom-1 left-1 right-1 glass rounded-full px-2 py-0.5 text-[10px] bg-white/80 text-center">On your twin</div>
              </div>
              <img src={product.img} alt="" className="rounded-2xl object-cover aspect-square" />
              <img src={product.img} alt="" className="rounded-2xl object-cover aspect-square opacity-80" />
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest">{product.brand} · {product.retailer}</div>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="font-display text-2xl">${product.price}</span>
              <span className="flex items-center gap-1 text-muted-foreground"><Star className="h-3.5 w-3.5 fill-current" /> 4.9 (312)</span>
            </div>

            <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Sizes */}
            <div className="mt-8">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Ruler className="h-3 w-3" /> Size range</span>
                <span>Recommended: <span className="text-foreground font-medium">{size}</span></span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((s: string) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-11 h-11 px-3 rounded-full border text-sm transition ${
                      s === size ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to cart / wishlist */}
            <div className="mt-6 flex gap-2">
              <button
                onClick={onAdd}
                className="flex-1 rounded-full bg-primary text-primary-foreground py-3.5 text-sm inline-flex items-center justify-center gap-2 shadow-[var(--shadow-lux)]"
              >
                <ShoppingBag className="h-4 w-4" /> Add to universal cart · ${product.price}
              </button>
              <button
                onClick={() => shopStore.toggleWish(product.id)}
                aria-label="Toggle wishlist"
                className={`h-12 w-12 grid place-items-center rounded-full border transition ${
                  inWish ? "bg-[color:var(--plum)]/10 border-[color:var(--plum)]" : "border-border hover:bg-accent"
                }`}
              >
                <Heart className={`h-5 w-5 ${inWish ? "fill-[color:var(--plum)] text-[color:var(--plum)]" : ""}`} />
              </button>
            </div>

            {addedToast && (
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-700 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                <Check className="h-3.5 w-3.5" /> Added to your universal cart
              </div>
            )}

            {/* Trust row */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl border border-border bg-card p-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-[color:var(--plum)]" /> Free shipping
              </div>
              <div className="rounded-2xl border border-border bg-card p-3 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-[color:var(--plum)]" /> 30-day returns
              </div>
              <div className="rounded-2xl border border-border bg-card p-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-[color:var(--plum)]" /> Twin-verified fit
              </div>
            </div>

            {/* Materials */}
            <div className="mt-8 rounded-2xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Materials & care</div>
              <div className="mt-2 text-sm">{product.materials}</div>
              <div className="mt-1 text-sm text-muted-foreground">{product.care}</div>
            </div>

            {/* Tailor recommendations */}
            <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2">
                <span className="h-9 w-9 grid place-items-center rounded-full" style={{ background: "var(--gradient-plum)" }}>
                  <Scissors className="h-4 w-4 text-white" />
                </span>
                <div>
                  <div className="font-medium">Tailor recommendations</div>
                  <div className="text-xs text-muted-foreground">Personalised for your Digital Twin · size {size}</div>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {product.tailorTips.map((tip: string) => (
                  <li key={tip} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-[color:var(--plum)] shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/60 p-3">
                <div className="flex-1 text-xs">
                  <div className="font-medium text-foreground">Atelier Rosen</div>
                  <div className="text-muted-foreground">0.8 km · 4.9★ · 2-day turnaround</div>
                </div>
                <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Book tailor
                </button>
            </div>

            {/* Find in store */}
            <FindInStore productId={product.id} productName={product.name} size={size} retailer={product.retailer} />
          </div>

          </div>
        </div>

        {/* Complete the look */}
        <section className="mt-24">
          <div className="flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
                <span className="h-px w-6 bg-[color:var(--plum)]" /> Complete the look
              </div>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">Styled by your AI</h2>
            </div>
            <Link to="/" hash="shop" className="text-sm text-muted-foreground hover:text-foreground">View all →</Link>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((p) => (
              <Link
                key={p.id}
                to="/product/$id"
                params={{ id: p.id }}
                className="group rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lux)] transition"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute bottom-3 left-3 glass rounded-full px-3 py-1 text-[11px] font-medium bg-white/80">
                    <span className="text-[color:var(--plum)] font-semibold">{p.fit}%</span> fit
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-muted-foreground">{p.brand} · {p.retailer}</div>
                  <div className="mt-1 font-display text-lg">{p.name}</div>
                  <div className="mt-1 text-sm">${p.price}</div>
                </div>
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

// ---------- Find in Store ----------

type StoreStock = {
  id: string;
  name: string;
  address: string;
  city: string;
  distanceKm: number;
  stock: "in" | "low" | "out";
  hours: string;
  phone: string;
  reserveHours: number;
};

const CITY_COORDS: Record<string, { lat: number; lon: number; label: string }> = {
  johannesburg: { lat: -26.2041, lon: 28.0473, label: "Johannesburg, ZA" },
  "cape town": { lat: -33.9249, lon: 18.4241, label: "Cape Town, ZA" },
  london: { lat: 51.5074, lon: -0.1278, label: "London, UK" },
  "new york": { lat: 40.7128, lon: -74.006, label: "New York, US" },
  paris: { lat: 48.8566, lon: 2.3522, label: "Paris, FR" },
  milan: { lat: 45.4642, lon: 9.19, label: "Milan, IT" },
  dubai: { lat: 25.2048, lon: 55.2708, label: "Dubai, AE" },
};

function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h;
}

function buildStores(productId: string, retailer: string, cityLabel: string): StoreStock[] {
  const districts = ["Sandton City", "Rosebank Mall", "Mall of Africa", "V&A Waterfront", "Canal Walk", "Menlyn Park", "Gateway", "Cavendish Square"];
  const streets = ["Nelson Mandela Sq", "Cradock Ave", "Waterway Ln", "Dock Rd", "Century Blvd", "Atterbury Rd", "Umhlanga Rocks Dr", "Dreyer St"];
  return Array.from({ length: 6 }).map((_, i) => {
    const seed = hashSeed(`${productId}:${retailer}:${cityLabel}:${i}`);
    const stockRoll = seed % 10;
    const stock: StoreStock["stock"] = stockRoll < 5 ? "in" : stockRoll < 8 ? "low" : "out";
    const dist = ((seed % 240) / 10) + 0.4;
    return {
      id: `${retailer}-${i}`,
      name: `${retailer} · ${districts[i % districts.length]}`,
      address: `Shop ${100 + (seed % 80)}, ${streets[i % streets.length]}`,
      city: cityLabel,
      distanceKm: Math.round(dist * 10) / 10,
      stock,
      hours: (seed % 2) ? "09:00 – 21:00" : "10:00 – 20:00",
      phone: `+27 11 ${String(200 + (seed % 799)).padStart(3, "0")} ${String(1000 + (seed % 8999)).padStart(4, "0")}`,
      reserveHours: 2 + (seed % 22),
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

function FindInStore({ productId, productName, size, retailer }: { productId: string; productName: string; size: string; retailer: string }) {
  const [mode, setMode] = useState<"idle" | "locating" | "ready">("idle");
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reservedId, setReservedId] = useState<string | null>(null);

  const stores = useMemo(() => (mode === "ready" ? buildStores(productId, retailer, locationLabel) : []), [mode, productId, retailer, locationLabel]);

  const useMyLocation = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Geolocation isn't available on this device — search by city instead.");
      return;
    }
    setMode("locating");
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationLabel("Near you");
        setMode("ready");
      },
      () => {
        setError("We couldn't access your location — search by city instead.");
        setMode("idle");
      },
      { timeout: 8000 }
    );
  };

  const searchCity = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const key = query.trim().toLowerCase();
    if (!key) return;
    const match = CITY_COORDS[key];
    setLocationLabel(match ? match.label : query.trim());
    setMode("ready");
  };

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="h-9 w-9 grid place-items-center rounded-full" style={{ background: "var(--gradient-plum)" }}>
          <Store className="h-4 w-4 text-white" />
        </span>
        <div className="min-w-0">
          <div className="font-medium truncate">Find in store</div>
          <div className="text-xs text-muted-foreground">Not online? Check physical stock — size {size}</div>
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-[auto_1fr] gap-2">
        <button
          onClick={useMyLocation}
          disabled={mode === "locating"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-xs disabled:opacity-60"
        >
          {mode === "locating" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
          {mode === "locating" ? "Locating…" : "Use my location"}
        </button>
        <form onSubmit={searchCity} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search other cities — London, Cape Town…"
            className="w-full rounded-full border border-border bg-background pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[color:var(--plum)]/40"
          />
        </form>
      </div>

      {error && <div className="mt-3 text-xs text-rose-600">{error}</div>}

      {mode === "ready" && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <div className="inline-flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {locationLabel}
            </div>
            <button onClick={() => { setMode("idle"); setReservedId(null); }} className="text-[color:var(--plum)] hover:underline">Change</button>
          </div>

          <div className="mt-3 space-y-2">
            {stores.map((s) => {
              const badge = s.stock === "in"
                ? { icon: PackageCheck, label: "In stock", cls: "text-emerald-700 bg-emerald-500/10" }
                : s.stock === "low"
                ? { icon: Package, label: "Low stock", cls: "text-amber-700 bg-amber-500/10" }
                : { icon: PackageX, label: "Out of stock", cls: "text-rose-700 bg-rose-500/10" };
              const Icon = badge.icon;
              const reserved = reservedId === s.id;
              return (
                <div key={s.id} className="rounded-2xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.address} · {s.city}</div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Navigation className="h-3 w-3" /> {s.distanceKm} km</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {s.hours}</span>
                        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${badge.cls}`}>
                      <Icon className="h-3 w-3" /> {badge.label}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      disabled={s.stock === "out"}
                      onClick={() => setReservedId(s.id)}
                      className="rounded-full bg-primary text-primary-foreground px-3.5 py-1.5 text-[11px] inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Check className="h-3 w-3" /> {reserved ? "Reserved" : `Reserve · hold ${s.reserveHours}h`}
                    </button>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name} ${s.address} ${s.city}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-border px-3.5 py-1.5 text-[11px] inline-flex items-center gap-1.5 hover:bg-accent"
                    >
                      <MapPin className="h-3 w-3" /> Directions
                    </a>
                  </div>
                  {reserved && (
                    <div className="mt-2 text-[11px] text-emerald-700">
                      Held under your name — {productName}, size {size}. Collect within {s.reserveHours}h.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

