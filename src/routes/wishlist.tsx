import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Heart, ShoppingBag, Share2, Users, Copy, Check, Sparkles, Plus, Shirt, MessageCircle, Trash2,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { PRODUCTS, shopStore, useShop } from "@/lib/shop-store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — Shared with friends & family · Mannequin AI" },
      { name: "description", content: "Save the pieces you love, share a private wishlist with friends and family, and shop together with fit-perfect suggestions from your AI stylist." },
      { property: "og:title", content: "Your Mannequin AI Wishlist" },
      { property: "og:description", content: "Collaborate on outfits with friends and family — every piece verified for fit." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist, collaborators } = useShop();
  const items = useMemo(() => PRODUCTS.filter((p) => wishlist.has(p.id)), [wishlist]);
  const total = items.reduce((s, p) => s + p.price, 0);

  const [copied, setCopied] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<{ from: string; text: string; color: string }[]>([
    { from: "Maya", text: "The camel coat is perfect for your Paris trip 🤍", color: "#c084fc" },
    { from: "Jules", text: "Try the slip dress with those gold earrings I gave you!", color: "#f472b6" },
  ]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/wishlist?ids=${items.map((i) => i.id).join(",")}` : "";

  const onCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const onInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    shopStore.addCollaborator(inviteName.trim(), inviteEmail.trim());
    setInviteName("");
    setInviteEmail("");
  };

  const onNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setNotes((n) => [...n, { from: "You", text: note.trim(), color: "var(--plum)" }]);
    setNote("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="mx-auto max-w-7xl px-6 pt-24 pb-24">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
              <span className="h-px w-6 bg-[color:var(--plum)]" /> Your wishlist
            </div>
            <h1 className="mt-3 font-display text-4xl md:text-5xl">
              Save it. <span className="italic">Share it.</span> Style it together.
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              A private wishlist you can co-curate with friends and family. Comments, votes, and fit-verified suggestions — all in one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {collaborators.slice(0, 4).map((c) => (
                <span
                  key={c.email}
                  className="h-9 w-9 rounded-full border-2 border-card grid place-items-center text-xs font-medium text-white"
                  style={{ background: c.color }}
                  title={`${c.name} · ${c.email}`}
                >
                  {c.name[0]}
                </span>
              ))}
              <span className="h-9 w-9 rounded-full border-2 border-card bg-secondary grid place-items-center text-xs font-medium">
                +{Math.max(0, collaborators.length - 4)}
              </span>
            </div>
            <button
              onClick={onCopy}
              className="rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm inline-flex items-center gap-2 shadow-[var(--shadow-lux)]"
            >
              {copied ? <><Check className="h-4 w-4" /> Link copied</> : <><Share2 className="h-4 w-4" /> Share wishlist</>}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <StatCard label="Saved pieces" value={items.length.toString()} icon={<Heart className="h-4 w-4" />} />
          <StatCard label="Collaborators" value={collaborators.length.toString()} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Wishlist value" value={`$${total.toLocaleString()}`} icon={<ShoppingBag className="h-4 w-4" />} />
        </div>

        <div className="mt-10 grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
          {/* Items */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl">Saved pieces</h2>
              {items.length > 0 && (
                <button
                  onClick={() => items.forEach((p) => shopStore.addToCart(p))}
                  className="text-xs rounded-full border border-border bg-card px-3 py-1.5 hover:bg-accent inline-flex items-center gap-1.5"
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Add all to cart
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                {items.map((p) => (
                  <article key={p.id} className="group rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)]">
                    <Link to="/product/$id" params={{ id: p.id }} className="block relative aspect-[4/5] overflow-hidden bg-secondary">
                      <img src={p.img} alt={p.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                      <div className="absolute bottom-3 left-3 glass rounded-full px-3 py-1 text-[11px] font-medium bg-white/80">
                        <span className="text-[color:var(--plum)] font-semibold">{p.fit}%</span> fit
                      </div>
                    </Link>
                    <div className="p-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{p.brand} · {p.retailer}</span>
                        <button
                          onClick={() => shopStore.toggleWish(p.id)}
                          className="h-7 w-7 grid place-items-center rounded-full hover:bg-accent text-muted-foreground"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Link to="/product/$id" params={{ id: p.id }} className="mt-1 block font-display text-lg hover:text-[color:var(--plum)]">
                        {p.name}
                      </Link>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-medium">${p.price}</span>
                        <button
                          onClick={() => shopStore.addToCart(p)}
                          className="rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs inline-flex items-center gap-1"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> Add
                        </button>
                      </div>
                      <div className="mt-3 flex -space-x-1.5">
                        {collaborators.slice(0, 2).map((c) => (
                          <span key={c.email} className="h-5 w-5 rounded-full border border-card text-[9px] grid place-items-center text-white"
                            style={{ background: c.color }} title={`${c.name} loves this`}>
                            {c.name[0]}
                          </span>
                        ))}
                        <span className="pl-3 text-[10px] text-muted-foreground">{collaborators.slice(0, 2).map((c) => c.name).join(" & ")} love this</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Collaboration panel */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2">
                <span className="h-9 w-9 grid place-items-center rounded-full" style={{ background: "var(--gradient-plum)" }}>
                  <Users className="h-4 w-4 text-white" />
                </span>
                <div>
                  <div className="font-medium">Invite friends & family</div>
                  <div className="text-xs text-muted-foreground">They can vote, comment and add pieces.</div>
                </div>
              </div>
              <form onSubmit={onInvite} className="mt-4 space-y-2">
                <input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--plum)]/40"
                />
                <div className="flex gap-2">
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--plum)]/40"
                  />
                  <button className="h-10 w-10 grid place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Send invite">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </form>

              <div className="mt-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Circle</div>
                <ul className="mt-2 space-y-2">
                  {collaborators.map((c) => (
                    <li key={c.email} className="flex items-center gap-3 text-sm">
                      <span className="h-8 w-8 rounded-full grid place-items-center text-xs font-medium text-white" style={{ background: c.color }}>
                        {c.name[0]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Editor</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 rounded-2xl border border-dashed border-border p-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Copy className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate flex-1">{shareUrl || "Share link ready once you save a piece."}</span>
                <button onClick={onCopy} className="rounded-full bg-secondary px-2 py-1 hover:bg-accent">
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Notes / chat */}
            <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2">
                <span className="h-9 w-9 grid place-items-center rounded-full" style={{ background: "var(--gradient-plum)" }}>
                  <MessageCircle className="h-4 w-4 text-white" />
                </span>
                <div>
                  <div className="font-medium">Notes from your circle</div>
                  <div className="text-xs text-muted-foreground">Live comments on this wishlist.</div>
                </div>
              </div>
              <ul className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                {notes.map((n, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-medium text-white shrink-0"
                      style={{ background: n.color }}>
                      {n.from[0]}
                    </span>
                    <div className="rounded-2xl bg-secondary px-3 py-2 text-sm">
                      <div className="text-[11px] text-muted-foreground">{n.from}</div>
                      {n.text}
                    </div>
                  </li>
                ))}
              </ul>
              <form onSubmit={onNote} className="mt-3 flex gap-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note…"
                  className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--plum)]/40"
                />
                <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm">Post</button>
              </form>
            </div>

            {/* AI insights */}
            <div className="rounded-3xl border border-border p-5" style={{ background: "var(--gradient-hero)" }}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-[color:var(--plum)]" /> AI insight
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Your circle keeps saving warm neutrals. Want a 5-piece autumn capsule built around your camel coat?
              </p>
              <Link to="/" hash="stylist" className="mt-3 inline-flex text-xs font-medium text-[color:var(--plum)]">
                Ask the stylist →
              </Link>
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

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="mt-1 font-display text-3xl">{value}</div>
      </div>
      <span className="h-10 w-10 grid place-items-center rounded-full bg-secondary text-[color:var(--plum)]">{icon}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
      <span className="mx-auto h-14 w-14 grid place-items-center rounded-full bg-secondary text-[color:var(--plum)]">
        <Heart className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-2xl">No pieces saved yet</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        Tap the heart on any product to save it here and start co-curating with your circle.
      </p>
      <Link to="/" hash="shop" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm">
        Browse marketplace
      </Link>
    </div>
  );
}
