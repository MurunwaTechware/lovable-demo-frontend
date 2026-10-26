import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Heart, ShoppingBag, Star, MapPin, Ruler, Truck, RefreshCw, Check, ArrowLeft, Scissors, Shirt,
  Store, Navigation, Search, Loader2, Phone, Clock, PackageCheck, PackageX, Package,
} from "lucide-react";
import twinImg from "@/assets/twin.jpg";
import { Nav } from "@/components/Nav";
import { ProductTryOn } from "@/components/ProductTryOn";
import { shopStore, useShop, type Product } from "@/lib/shop-store";
import { productsApi, rand, type ApiProduct, type ApiProductDetail } from "@/lib/products-api";

// Adapt an API product (detail or card) to the `Product` shape the cart/wishlist
// store expects. Fields the catalogue can't supply yet get safe defaults.
function toProduct(p: ApiProductDetail | ApiProduct): Product {
  const detail = p as Partial<ApiProductDetail>;
  return {
    id: p.id,
    name: p.name ?? "",
    brand: p.brand ?? "Superbalist",
    price: p.price ?? 0,
    img: p.img ?? "",
    retailer: p.retailer ?? "Superbalist",
    category: p.category ?? "",
    fit: p.fit ?? 0,
    description: detail.description ?? "",
    sizes: detail.sizes ?? [],
    materials: detail.material ?? "",
    care: "",
    tailorTips: detail.tailorTips ?? [],
  };
}

export const Route = createFileRoute("/product/$id")({
  // async now: the product is fetched from the products API on demand
  loader: async ({ params }) => {
    try {
      const product = await productsApi.detail(params.id);
      return { product };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — ${loaderData.product.brand ?? "Superbalist"} · Mannequin AI` },
          { name: "description", content: (loaderData.product.description ?? loaderData.product.name ?? "").slice(0, 155) },
          { property: "og:title", content: `${loaderData.product.name} — ${loaderData.product.brand ?? "Superbalist"}` },
          { property: "og:description", content: (loaderData.product.description ?? loaderData.product.name ?? "").slice(0, 155) },
          { property: "og:image", content: loaderData.product.img ?? "" },
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
  const { product: apiProduct } = Route.useLoaderData();
  const product = toProduct(apiProduct);
  const { wishlist } = useShop();
  const [size, setSize] = useState<string>(
    product.sizes.length ? product.sizes[Math.floor(product.sizes.length / 2)] : "",
  );
  const [addedToast, setAddedToast] = useState(false);
  const inWish = wishlist.has(product.id);

  // Keep the recommended size valid once sizes load.
  useEffect(() => {
    if (product.sizes.length && !product.sizes.includes(size)) {
      setSize(product.sizes[Math.floor(product.sizes.length / 2)]);
    }
  }, [product.sizes, size]);

  // Related pieces in the same category (real products from the API).
  const [related, setRelated] = useState<Product[]>([]);
  useEffect(() => {
    let cancelled = false;
    productsApi
      .list({ category: product.category || undefined, gender: apiProduct.gender || undefined, page_size: 4 })
      .then((res) => {
        if (cancelled) return;
        setRelated(res.items.filter((p) => p.id !== product.id).slice(0, 3).map(toProduct));
      })
      .catch(() => { /* non-fatal: just no suggestions */ });
    return () => { cancelled = true; };
  }, [product.id, product.category, apiProduct.gender]);

  const hasFit = typeof apiProduct.fit === "number" && apiProduct.fit > 0;
  const gallery: string[] = Array.from(
    new Set((apiProduct.images && apiProduct.images.length ? apiProduct.images : [product.img]).filter(Boolean)),
  );
  // Which gallery image is shown large. Back to the first one when the product changes.
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => { setActiveIdx(0); }, [product.id]);
  const mainImg = gallery[activeIdx] ?? product.img;
  const priceLabel = rand(product.price);

  const onAdd = () => {
    shopStore.addToCart(product);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 1800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="mx-auto max-w-7xl px-6 pt-24 pb-24">
        <Link to="/shop" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Shop
        </Link>

        <div className="mt-6 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-start">
          {/* Gallery + virtual twin preview */}
          <div className="space-y-4">
            <div className="relative rounded-[2rem] overflow-hidden shadow-[var(--shadow-lux)] aspect-[4/5] bg-secondary">
              {mainImg ? (
                <img key={mainImg} src={mainImg} alt={product.name} className="h-full w-full object-cover object-top animate-fade-up" />
              ) : (
                <div className="h-full w-full bg-secondary" />
              )}
              {hasFit && (
                <div className="absolute top-4 left-4 glass rounded-full px-3 py-1 text-xs font-medium bg-white/80">
                  <span className="text-[color:var(--plum)] font-semibold">{apiProduct.fit}%</span> fit for you
                </div>
              )}
              <button
                onClick={() => shopStore.toggleWish(product.id)}
                className="absolute top-4 right-4 h-10 w-10 grid place-items-center rounded-full glass bg-white/80"
                aria-label="Save to wishlist"
              >
                <Heart className={`h-4 w-4 transition ${inWish ? "fill-[color:var(--plum)] text-[color:var(--plum)]" : "text-foreground"}`} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {/* Try-on preview tile (placeholder until the try-on backend is wired) */}
              <div className="relative rounded-2xl overflow-hidden aspect-square" style={{ background: "var(--gradient-plum)" }}>
                <img src={twinImg} alt="On your twin" className="h-full w-full object-cover mix-blend-screen opacity-80" />
                {product.img && <img src={product.img} alt="" className="absolute inset-0 h-full w-full object-contain p-3 mix-blend-multiply opacity-90" />}
                <div className="absolute bottom-1 left-1 right-1 glass rounded-full px-2 py-0.5 text-[10px] bg-white/80 text-center">On your twin</div>
              </div>
              {/* Clickable thumbnails: clicking one swaps the large image above */}
              {gallery.slice(0, 7).map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-pressed={i === activeIdx}
                  className={`relative rounded-2xl overflow-hidden aspect-square bg-secondary transition ${
                    i === activeIdx
                      ? "ring-2 ring-[color:var(--plum)] ring-offset-2 ring-offset-background"
                      : "opacity-75 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest">{product.brand} · {product.retailer}</div>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="font-display text-2xl">{priceLabel}</span>
              <span className="flex items-center gap-1 text-muted-foreground"><Star className="h-3.5 w-3.5 fill-current" /> 4.9 (312)</span>
            </div>

            {product.description && <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>}

            {/* Colour options — sibling colour variants from Superbalist */}
            {apiProduct.colourOptions && apiProduct.colourOptions.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  Colour{apiProduct.colour ? <span className="text-foreground font-medium normal-case tracking-normal">· {apiProduct.colour}</span> : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {/* current product first, as a selected swatch */}
                  <span
                    className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 border-[color:var(--plum)] shrink-0"
                    title={apiProduct.colour ?? "Current"}
                  >
                    {product.img && <img src={product.img} alt={apiProduct.colour ?? ""} className="h-full w-full object-cover" />}
                  </span>
                  {apiProduct.colourOptions
                    .filter((c: ApiProductDetail["colourOptions"][number]) => String(c.id) !== product.id)
                    .map((c: ApiProductDetail["colourOptions"][number]) => (
                      <Link
                        key={c.id}
                        to="/product/$id"
                        params={{ id: String(c.id) }}
                        className="relative h-16 w-16 rounded-2xl overflow-hidden border border-border hover:border-[color:var(--plum)] transition shrink-0"
                        title={c.colour ?? "Other colour"}
                      >
                        {c.image ? (
                          <img src={c.image} alt={c.colour ?? ""} className="h-full w-full object-cover" />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-[10px] text-muted-foreground capitalize">{c.colour}</span>
                        )}
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Ruler className="h-3 w-3" /> Size range</span>
                  {size && <span>Recommended: <span className="text-foreground font-medium">{size}</span></span>}
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
            )}

            {/* Add to cart / wishlist */}
            <div className="mt-6 flex gap-2">
              <button
                onClick={onAdd}
                className="flex-1 rounded-full bg-primary text-primary-foreground py-3.5 text-sm inline-flex items-center justify-center gap-2 shadow-[var(--shadow-lux)]"
              >
                <ShoppingBag className="h-4 w-4" /> Add to universal cart{priceLabel ? ` · ${priceLabel}` : ""}
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

            {/* Try it on: not shown for kids' products */}
            <ProductTryOn product={apiProduct} />

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
            {product.materials && (
              <div className="mt-8 rounded-2xl border border-border bg-card p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Materials & care</div>
                <div className="mt-2 text-sm">{product.materials}</div>
                {product.care && <div className="mt-1 text-sm text-muted-foreground">{product.care}</div>}
              </div>
            )}

            {/* Tailor recommendations — only when the AI backend supplies tips */}
            {product.tailorTips.length > 0 && (
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
              </div>
            )}

            {/* Find in store */}
            <FindInStore productId={product.id} productName={product.name} size={size} retailer={product.retailer} />
          </div>
        </div>

        {/* Complete the look */}
        {related.length > 0 && (
          <section className="mt-24">
            <div className="flex items-end justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
                  <span className="h-px w-6 bg-[color:var(--plum)]" /> Complete the look
                </div>
                <h2 className="mt-2 font-display text-3xl md:text-4xl">Styled by your AI</h2>
              </div>
              <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground">View all →</Link>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => (
                <Link
                  key={p.id}
                  to="/product/$id"
                  params={{ id: p.id }}
                  className="group rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lux)] transition"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                    {p.img && <img src={p.img} alt={p.name} className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105" />}
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-muted-foreground">{p.brand} · {p.retailer}</div>
                    <div className="mt-1 font-display text-lg">{p.name}</div>
                    {p.price ? <div className="mt-1 text-sm">{rand(p.price)}</div> : null}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
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

// ---------- Find in Store (unchanged — physical-stock demo) ----------

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
