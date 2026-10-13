import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, Bookmark, MessageCircle, Share2, DollarSign, Users2, Send } from "lucide-react";
import { communityStore, getGoer, useCommunity, type Post } from "@/lib/community-store";

export const Route = createFileRoute("/community/")({
  component: FeedPage,
});

function FeedPage() {
  const state = useCommunity();
  const [filter, setFilter] = useState<"for-you" | "following">("for-you");

  const posts = useMemo(() => {
    const list = filter === "following"
      ? state.posts.filter((p) => state.following.has(p.goerId))
      : state.posts;
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [state.posts, state.following, filter]);

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">Community</div>
          <h1 className="mt-1 font-display text-3xl">Your feed</h1>
        </div>
        <div className="inline-flex rounded-full border border-border p-1 text-xs bg-card">
          {(["for-you", "following"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 h-7 rounded-full transition ${filter === k ? "bg-foreground text-background" : "text-muted-foreground"}`}
            >
              {k === "for-you" ? "For You" : "Following"}
            </button>
          ))}
        </div>
      </div>

      {posts.length === 0 && (
        <div className="mt-10 rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          You're not following anyone yet. <Link to="/community/explore" className="text-[color:var(--plum)] underline">Explore Fashion Goers</Link>.
        </div>
      )}

      <div className="mt-8 space-y-8">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </main>
  );
}

function PostCard({ post }: { post: Post }) {
  const state = useCommunity();
  const goer = getGoer(post.goerId)!;
  const liked = state.liked.has(post.id);
  const saved = state.saved.has(post.id);
  const [comment, setComment] = useState("");

  return (
    <article className="rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)]">
      <header className="flex items-center justify-between p-4">
        <Link to="/community/profile/$id" params={{ id: goer.id }} className="flex items-center gap-3">
          <img src={goer.avatar} alt={goer.name} className="h-10 w-10 rounded-full object-cover" />
          <div>
            <div className="text-sm font-medium">{goer.name}</div>
            <div className="text-[11px] text-muted-foreground">@{goer.handle} · {post.location}</div>
          </div>
        </Link>
        <button
          onClick={() => communityStore.toggleFollow(goer.id)}
          className={`text-xs px-3 h-8 rounded-full border transition ${
            state.following.has(goer.id)
              ? "border-border text-muted-foreground"
              : "border-foreground bg-foreground text-background"
          }`}
        >
          {state.following.has(goer.id) ? "Following" : "Follow"}
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 bg-background">
        {post.media.map((m, i) => (
          <div key={i} className={`relative ${post.media.length === 1 ? "sm:col-span-2 aspect-[4/5]" : "aspect-square"}`}>
            {m.type === "video" ? (
              <video src={m.src} className="h-full w-full object-cover" autoPlay muted loop playsInline />
            ) : (
              <img src={m.src} alt={post.caption} className="h-full w-full object-cover" />
            )}
            <div className="absolute top-3 left-3 rounded-full bg-white/85 backdrop-blur px-2.5 py-1 text-[10px] text-foreground">
              {post.category} · {post.occasion}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-1">
          <IconBtn active={liked} onClick={() => communityStore.toggleLike(post.id)} label={`${post.likes}`}>
            <Heart className={`h-5 w-5 ${liked ? "fill-[color:var(--plum)] text-[color:var(--plum)]" : ""}`} />
          </IconBtn>
          <IconBtn label={`${post.comments.length}`}>
            <MessageCircle className="h-5 w-5" />
          </IconBtn>
          <IconBtn>
            <Share2 className="h-5 w-5" />
          </IconBtn>
          <div className="flex-1" />
          <IconBtn active={saved} onClick={() => communityStore.toggleSave(post.id)}>
            <Bookmark className={`h-5 w-5 ${saved ? "fill-foreground" : ""}`} />
          </IconBtn>
        </div>

        <p className="text-sm">
          <span className="font-medium">{goer.name}</span> <span className="text-foreground/90">{post.caption}</span>
        </p>

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {post.palette.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} /> {c}
            </span>
          ))}
          {post.brands.map((b) => (
            <span key={b} className="rounded-full bg-secondary px-2 py-0.5">{b}</span>
          ))}
          {post.hashtags.map((h) => (
            <span key={h} className="text-[color:var(--plum)]">{h}</span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() =>
              communityStore.sendMessage(goer.id, {
                from: "me",
                kind: "pricing",
                text: `Hi ${goer.name.split(" ")[0]}, could you price recreating this "${post.caption}" look for me?`,
                meta: { postId: post.id },
              })
            }
            className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground text-xs px-3 h-8"
          >
            <DollarSign className="h-3.5 w-3.5" /> Request pricing
          </button>
          <button
            onClick={() => {
              communityStore.requestCollab(goer.id);
              communityStore.sendMessage(goer.id, {
                from: "me",
                kind: "collab",
                text: `I'd love to collaborate — sending a temporary profile access request.`,
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border text-xs px-3 h-8 hover:bg-accent"
          >
            <Users2 className="h-3.5 w-3.5" /> Collaborate with me
          </button>
          <Link
            to="/community/messages"
            className="inline-flex items-center gap-1.5 rounded-full border border-border text-xs px-3 h-8 hover:bg-accent"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Message
          </Link>
        </div>

        <div className="pt-2 border-t border-border space-y-1.5">
          {post.comments.slice(-2).map((c) => (
            <div key={c.id} className="text-xs">
              <span className="font-medium">@{c.user}</span> <span className="text-muted-foreground">{c.text}</span>
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              communityStore.comment(post.id, comment);
              setComment("");
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 rounded-full border border-border bg-background text-xs px-3 h-8 outline-none focus:ring-2 focus:ring-[color:var(--plum)]/40"
            />
            <button className="h-8 w-8 grid place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Send comment">
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 h-9 text-xs hover:bg-accent transition ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {children}
      {label && <span>{label}</span>}
    </button>
  );
}
