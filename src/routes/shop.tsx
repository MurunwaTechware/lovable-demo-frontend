import { createFileRoute } from "@tanstack/react-router";
import { Shirt } from "lucide-react";
import { Nav } from "@/components/Nav";
import { BrowseGrid } from "@/components/BrowseGrid";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop everywhere — One cart · Mannequin AI" },
      { name: "description", content: "Browse every piece across every brand with your Digital Twin. Filter, sort and search — one universal cart." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-24">
        <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
          <span className="h-px w-6 bg-[color:var(--plum)]" /> Retail Marketplace
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Shop <span className="italic">everywhere</span>, in one cart.</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Every piece, every brand — browse, filter and search, then check out once with your Digital Twin.
        </p>

        <BrowseGrid title="All pieces" />
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
