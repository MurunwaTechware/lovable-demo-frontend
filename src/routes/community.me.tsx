import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { UserCircle2, Palette, Ruler, Bookmark, Heart, Users2, ShieldCheck } from "lucide-react";
import { communityStore, useCommunity, getGoer } from "@/lib/community-store";

export const Route = createFileRoute("/community/me")({
  component: MyProfilePage,
});

function MyProfilePage() {
  const state = useCommunity();
  const { consumer } = state;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(consumer);

  const savedPosts = state.posts.filter((p) => state.saved.has(p.id));
  const activeCollabs = Object.entries(state.collabRequests)
    .filter(([, s]) => s === "approved")
    .map(([id]) => getGoer(id))
    .filter(Boolean);

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start gap-5">
          <div className="h-20 w-20 rounded-full grid place-items-center bg-secondary">
            <UserCircle2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-xs tracking-[0.3em] uppercase text-[color:var(--plum)]">Consumer account</div>
            <h1 className="mt-1 font-display text-3xl">{consumer.name}</h1>
            <div className="text-sm text-muted-foreground">@{consumer.handle} · {consumer.location}</div>
            <p className="mt-2 text-sm">{consumer.bio}</p>
          </div>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-xs h-9 px-4 rounded-full border border-border hover:bg-accent"
          >
            {editing ? "Cancel" : "Edit profile"}
          </button>
        </div>

        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              communityStore.updateConsumer(draft);
              setEditing(false);
            }}
            className="mt-6 grid sm:grid-cols-2 gap-3 text-sm"
          >
            <Field label="Display name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
            <Field label="Handle" value={draft.handle} onChange={(v) => setDraft({ ...draft, handle: v })} />
            <Field label="Location" value={draft.location} onChange={(v) => setDraft({ ...draft, location: v })} />
            <Field label="Bio" value={draft.bio} onChange={(v) => setDraft({ ...draft, bio: v })} />
            <div className="sm:col-span-2 flex justify-end">
              <button className="rounded-full bg-primary text-primary-foreground text-xs h-9 px-4">Save changes</button>
            </div>
          </form>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card icon={Ruler} title="Sizes">
          <ul className="text-sm space-y-1">
            <li className="flex justify-between"><span>Top</span><span className="text-muted-foreground">{consumer.sizes.top}</span></li>
            <li className="flex justify-between"><span>Bottom</span><span className="text-muted-foreground">{consumer.sizes.bottom}</span></li>
            <li className="flex justify-between"><span>Shoe</span><span className="text-muted-foreground">{consumer.sizes.shoe}</span></li>
          </ul>
        </Card>
        <Card icon={Palette} title="Favourite colours">
          <div className="flex flex-wrap gap-2 mt-1">
            {consumer.favoriteColors.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 text-xs rounded-full border border-border px-2 py-1">
                <span className="h-3 w-3 rounded-full" style={{ background: c }} /> {c}
              </span>
            ))}
          </div>
        </Card>
        <Card icon={Heart} title="Preferred styles">
          <div className="flex flex-wrap gap-1.5 mt-1">
            {consumer.preferredStyles.map((s) => (
              <span key={s} className="text-[11px] rounded-full bg-secondary px-2 py-0.5">{s}</span>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users2 className="h-4 w-4 text-[color:var(--plum)]" />
          <h2 className="font-display text-xl">Active collaborations</h2>
        </div>
        {activeCollabs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No active collaborations. Invite a Fashion Goer from <Link to="/community/explore" className="text-[color:var(--plum)] underline">Explore</Link>.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {activeCollabs.map((g) => g && (
              <div key={g.id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                <img src={g.avatar} alt={g.name} className="h-12 w-12 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{g.name}</div>
                  <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-[color:var(--plum)]" /> Temporary profile access
                  </div>
                </div>
                <button
                  onClick={() => communityStore.revokeCollab(g.id)}
                  className="text-xs h-8 px-3 rounded-full border border-border hover:bg-accent"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bookmark className="h-4 w-4 text-[color:var(--plum)]" />
          <h2 className="font-display text-xl">Saved looks</h2>
        </div>
        {savedPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Save looks from the feed to build your inspiration board.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {savedPosts.map((p) => (
              <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden">
                <img src={p.media[0].src} alt={p.caption} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Card({ icon: Icon, title, children }: { icon: typeof Palette; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-[color:var(--plum)]" /> {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 h-10 outline-none focus:ring-2 focus:ring-[color:var(--plum)]/40"
      />
    </label>
  );
}
