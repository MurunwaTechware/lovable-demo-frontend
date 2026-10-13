import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Sparkles, MapPin, Star } from "lucide-react";
import { GOERS, communityStore, useCommunity } from "@/lib/community-store";

export const Route = createFileRoute("/community/explore")({
  component: ExplorePage,
});

const CATEGORIES = ["All", "Streetwear", "Corporate", "Wedding", "Casual", "Traditional", "Formal", "Editorial", "Seasonal"];

function ExplorePage() {
  const state = useCommunity();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const goers = useMemo(() => {
    return GOERS.filter((g) => {
      const matchesQ =
        !q ||
        g.name.toLowerCase().includes(q.toLowerCase()) ||
        g.handle.toLowerCase().includes(q.toLowerCase()) ||
        g.styles.some((s) => s.toLowerCase().includes(q.toLowerCase()));
      const matchesCat = cat === "All" || g.styles.some((s) => s.toLowerCase().includes(cat.toLowerCase()));
      return matchesQ && matchesCat;
    });
  }, [q, cat]);

  const trending = useMemo(() => [...state.posts].sort((a, b) => b.likes - a.likes).slice(0, 9), [state.posts]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">Explore</div>
      <h1 className="mt-1 font-display text-4xl">Discover Fashion Goers</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-xl">
        Follow stylists, request pricing on any look, or invite them to collaborate on your Digital Twin.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <label className="flex-1 flex items-center gap-2 rounded-full border border-border bg-card px-4 h-11">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search stylists, styles, cities…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`text-xs px-3 h-8 rounded-full border transition ${
              cat === c ? "bg-foreground text-background border-foreground" : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Trending looks</h2>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Updated hourly</div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
          {trending.map((p) => (
            <Link key={p.id} to="/community" className="relative aspect-square overflow-hidden rounded-xl group">
              <img src={p.media[0].src} alt={p.caption} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px]">
                ♥ {p.likes} · {p.category}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Fashion Goers</h2>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goers.map((g) => {
            const isFollowing = state.following.has(g.id);
            return (
              <div key={g.id} className="rounded-3xl border border-border bg-card overflow-hidden shadow-[var(--shadow-card)]">
                <div className="relative h-28">
                  <img src={g.cover} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="p-4 -mt-8">
                  <Link to="/community/profile/$id" params={{ id: g.id }} className="flex items-end gap-3">
                    <img src={g.avatar} alt={g.name} className="h-16 w-16 rounded-full border-4 border-card object-cover" />
                    <div className="pb-1">
                      <div className="font-medium">{g.name}</div>
                      <div className="text-[11px] text-muted-foreground">@{g.handle}</div>
                    </div>
                  </Link>
                  <div className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> {g.location}
                    <span>·</span>
                    <Star className="h-3 w-3 text-[color:var(--plum)]" /> {g.rating} ({g.reviewsCount})
                  </div>
                  <p className="mt-2 text-xs leading-relaxed">{g.bio}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {g.styles.map((s) => (
                      <span key={s} className="text-[10px] rounded-full bg-secondary px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => communityStore.toggleFollow(g.id)}
                      className={`flex-1 text-xs h-9 rounded-full border transition ${
                        isFollowing ? "border-border text-muted-foreground" : "bg-foreground text-background border-foreground"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                    <Link
                      to="/community/profile/$id"
                      params={{ id: g.id }}
                      className="text-xs h-9 px-3 grid place-items-center rounded-full border border-border hover:bg-accent"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
