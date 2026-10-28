import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Truck, Sparkles, Shirt } from "lucide-react";
import { Nav } from "@/components/Nav";
import { BrowseGrid } from "@/components/BrowseGrid";
import { productsApi, brandSlug as slugify } from "@/lib/products-api";

function prettyFromSlug(slug: string) {
  return slug.split("-").map((s) => s[0]?.toUpperCase() + s.slice(1)).join(" ");
}

export const Route = createFileRoute("/stores/$name")({
  head: ({ params }) => ({
    meta: [
      { title: `${prettyFromSlug(params.name)} — Brand · Mannequin AI` },
      { name: "description", content: `Shop ${prettyFromSlug(params.name)} with your Digital Twin. Perfect fit, one universal cart.` },
    ],
  }),
  component: BrandPage,
});

function BrandPage() {
  const { name } = Route.useParams();

  // The URL carries a slug; the DB stores the exact brand name. Resolve the slug
  // back to the real brand by matching against the brand list.
  const { data: brandData } = useQuery({
    queryKey: ["brands"],
    queryFn: () => productsApi.brands(),
  });
  const realBrand = (brandData?.brands ?? []).find((b) => slugify(b) === name);
  const pretty = realBrand ?? prettyFromSlug(name);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-24">
        <Link to="/stores" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> All brands
        </Link>

        <div className="mt-6 rounded-[2rem] overflow-hidden border border-border shadow-[var(--shadow-lux)]" style={{ background: "var(--gradient-hero)" }}>
          <div className="p-10 md:p-14">
            <div className="text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">Brand</div>
            <h1 className="mt-2 font-display text-5xl md:text-6xl">{pretty}</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Shop {pretty} with your Digital Twin. Sizes translated, one universal cart.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full bg-white/70 backdrop-blur px-3 py-1.5 inline-flex items-center gap-1.5"><Truck className="h-3 w-3" /> 1–3 day delivery</span>
              <span className="rounded-full bg-white/70 backdrop-blur px-3 py-1.5 inline-flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-[color:var(--plum)]" /> Twin-verified</span>
              <span className="rounded-full bg-white/70 backdrop-blur px-3 py-1.5">30-day returns</span>
            </div>
          </div>
        </div>

        {/* Real products for this brand, with filter / sort / search */}
        {realBrand ? (
          <BrowseGrid fixedBrand={realBrand} title={`${pretty} pieces`} />
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {brandData ? (
              <>We don't have any {pretty} pieces right now. <Link to="/stores" className="underline">See all brands</Link>.</>
            ) : `Loading ${pretty}…`}
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
