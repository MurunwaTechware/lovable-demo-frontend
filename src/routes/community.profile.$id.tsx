import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Star, Instagram, MessageCircle, DollarSign, Users2, ShieldCheck, Grid3x3, Heart, Share2 } from "lucide-react";
import { GOERS, communityStore, getGoer, getPostsByGoer, getReviewsByGoer, useCommunity } from "@/lib/community-store";

export const Route = createFileRoute("/community/profile/$id")({
  loader: ({ params }) => {
    const g = getGoer(params.id);
    if (!g) throw notFound();
    return { id: params.id };
  },
  component: ProfilePage,
  notFoundComponent: () => (
    <div className="p-12 text-center text-muted-foreground">
      Fashion Goer not found. <Link to="/community/explore" className="text-[color:var(--plum)] underline">Explore</Link>
    </div>
  ),
  errorComponent: () => (
    <div className="p-12 text-center text-muted-foreground">Something went wrong loading this profile.</div>
  ),
});

function ProfilePage() {
  const { id } = Route.useParams();
  const state = useCommunity();
  const goer = getGoer(id)!;
  const posts = getPostsByGoer(id);
  const reviews = getReviewsByGoer(id);
  const [tab, setTab] = useState<"posts" | "reviews" | "portfolio">("posts");
  const following = state.following.has(id);
  const collab = state.collabRequests[id] ?? "none";

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="rounded-3xl overflow-hidden border border-border bg-card">
        <div className="relative h-48 sm:h-64">
          <img src={goer.cover} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="p-5 sm:p-8 -mt-16 flex flex-col sm:flex-row sm:items-end gap-5">
          <img src={goer.avatar} alt={goer.name} className="h-28 w-28 rounded-full border-4 border-card object-cover" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl">{goer.name}</h1>
              <ShieldCheck className="h-4 w-4 text-[color:var(--plum)]" aria-label="Verified" />
            </div>
            <div className="text-sm text-muted-foreground">@{goer.handle}</div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {goer.location}</span>
              <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-[color:var(--plum)]" /> {goer.rating} · {goer.reviewsCount} reviews</span>
              {goer.socials.instagram && (
                <span className="inline-flex items-center gap-1"><Instagram className="h-3 w-3" /> @{goer.socials.instagram}</span>
              )}
              {goer.hourlyFrom && <span>From ${goer.hourlyFrom}/hr</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => communityStore.toggleFollow(id)}
              className={`text-xs h-9 px-4 rounded-full border transition ${
                following ? "border-border text-muted-foreground" : "bg-foreground text-background border-foreground"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
            <Link to="/community/messages" className="text-xs h-9 px-4 rounded-full border border-border inline-flex items-center gap-1.5 hover:bg-accent">
              <MessageCircle className="h-3.5 w-3.5" /> Message
            </Link>
            <button
              onClick={() =>
                communityStore.sendMessage(id, {
                  from: "me",
                  kind: "pricing",
                  text: `Hi ${goer.name.split(" ")[0]}, I'd like a quote for a personal styling session.`,
                })
              }
              className="text-xs h-9 px-4 rounded-full bg-primary text-primary-foreground inline-flex items-center gap-1.5"
            >
              <DollarSign className="h-3.5 w-3.5" /> Request pricing
            </button>
            <button
              onClick={() => communityStore.requestCollab(id)}
              className="text-xs h-9 px-4 rounded-full border border-[color:var(--plum)] text-[color:var(--plum)] inline-flex items-center gap-1.5 hover:bg-[color:var(--plum)]/10"
            >
              <Users2 className="h-3.5 w-3.5" />
              {collab === "approved" ? "Collab active" : collab === "requested" ? "Requesting…" : "Collaborate"}
            </button>
          </div>
        </div>

        <div className="px-5 sm:px-8 pb-6 grid grid-cols-3 gap-4 text-center text-sm border-t border-border pt-5">
          <div>
            <div className="font-display text-2xl">{goer.posts}</div>
            <div className="text-xs text-muted-foreground">Posts</div>
          </div>
          <div>
            <div className="font-display text-2xl">{(goer.followers / 1000).toFixed(1)}k</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          <div>
            <div className="font-display text-2xl">{goer.following}</div>
            <div className="text-xs text-muted-foreground">Following</div>
          </div>
        </div>

        <div className="px-5 sm:px-8 pb-6">
          <p className="text-sm text-muted-foreground">{goer.bio}</p>
        </div>
      </div>

      {collab === "approved" && (
        <div className="mt-5 rounded-2xl border border-[color:var(--plum)]/30 bg-[color:var(--plum)]/5 p-4 text-sm">
          <div className="font-medium flex items-center gap-2"><Users2 className="h-4 w-4 text-[color:var(--plum)]" /> Collaboration active</div>
          <div className="text-xs text-muted-foreground mt-1">
            {goer.name.split(" ")[0]} has temporary access to your Digital Twin, wishlist and style journey. Revoke anytime.
          </div>
          <button
            onClick={() => communityStore.revokeCollab(id)}
            className="mt-3 text-xs h-8 px-3 rounded-full border border-border hover:bg-accent"
          >
            Revoke access
          </button>
        </div>
      )}

      <div className="mt-8 flex items-center gap-1 border-b border-border">
        {([
          { k: "posts", label: "Looks", icon: Grid3x3 },
          { k: "portfolio", label: "Portfolio", icon: Heart },
          { k: "reviews", label: "Reviews", icon: Star },
        ] as const).map((t) => {
          const Icon = t.icon;
          const active = tab === t.k;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`inline-flex items-center gap-1.5 text-xs px-4 h-10 border-b-2 transition ${
                active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "posts" && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
          {posts.map((p) => (
            <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={p.media[0].src} alt={p.caption} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] flex items-center justify-between">
                <span>♥ {p.likes}</span>
                <span>{p.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "portfolio" && (
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {posts.slice(0, 3).map((p) => (
            <div key={p.id} className="rounded-2xl overflow-hidden border border-border bg-card">
              <img src={p.media[0].src} alt={p.caption} className="w-full aspect-[4/3] object-cover" />
              <div className="p-4">
                <div className="font-display">{p.occasion}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.caption}</div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.brands.map((b) => (
                    <span key={b} className="text-[10px] rounded-full bg-secondary px-2 py-0.5">{b}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground grid place-items-center text-center">
            <div>
              <Share2 className="h-5 w-5 mx-auto text-[color:var(--plum)]" />
              <div className="mt-2 font-medium text-foreground">Commission a signature look</div>
              <div className="text-xs mt-1">Send a brief — get a moodboard within 48h.</div>
            </div>
          </div>
        </div>
      )}

      {tab === "reviews" && (
        <div className="mt-6 space-y-4">
          {reviews.length === 0 && (
            <div className="text-sm text-muted-foreground">No reviews yet — be the first.</div>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <img src={r.avatar} alt={r.user} className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.user}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Overall {r.overall} · Communication {r.communication} · Creativity {r.creativity} · Styling {r.styling}
                  </div>
                </div>
                {r.recommend && <span className="text-[10px] rounded-full bg-[color:var(--plum)]/10 text-[color:var(--plum)] px-2 py-0.5">Recommends</span>}
              </div>
              <p className="mt-3 text-sm">{r.text}</p>
              {r.photo && <img src={r.photo} alt="" className="mt-3 rounded-xl w-full max-w-sm aspect-video object-cover" />}
            </div>
          ))}
        </div>
      )}

      <section className="mt-12">
        <h3 className="font-display text-xl">More Fashion Goers</h3>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GOERS.filter((g) => g.id !== id).slice(0, 4).map((g) => (
            <Link key={g.id} to="/community/profile/$id" params={{ id: g.id }} className="rounded-2xl overflow-hidden border border-border bg-card">
              <img src={g.cover} alt="" className="h-20 w-full object-cover" />
              <div className="p-3">
                <div className="text-sm font-medium truncate">{g.name}</div>
                <div className="text-[11px] text-muted-foreground">@{g.handle}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
