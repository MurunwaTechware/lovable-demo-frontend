import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Sparkles, Compass, MessageSquare, UserCircle2, Play } from "lucide-react";
import { useCommunity } from "@/lib/community-store";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Fashion Community · Mannequin AI" },
      { name: "description", content: "Follow Fashion Goers, discover outfit inspiration, request pricing, and collaborate on personal styling." },
      { property: "og:title", content: "Fashion Community · Mannequin AI" },
      { property: "og:description", content: "A social layer for outfits, inspiration and personal styling." },
    ],
  }),
  component: CommunityLayout,
});

const TABS: { to: string; label: string; icon: typeof Sparkles; exact?: boolean }[] = [
  { to: "/community", label: "Feed", icon: Sparkles, exact: true },
  { to: "/community/stylestream", label: "StyleStream", icon: Play },
  { to: "/community/explore", label: "Explore", icon: Compass },
  { to: "/community/messages", label: "Messages", icon: MessageSquare },
  { to: "/community/me", label: "You", icon: UserCircle2 },
];


function CommunityLayout() {
  const { threads } = useCommunity();
  const unread = Object.values(threads).reduce((s, t) => s + t.unread, 0);
  const loc = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <div className="pt-16">
        <div className="border-b border-border bg-background/70 backdrop-blur sticky top-16 z-30">
          <div className="mx-auto max-w-7xl px-6 h-12 flex items-center gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to as "/community"}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 h-8 text-xs transition ${
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                  {t.label === "Messages" && unread > 0 && (
                    <span className="ml-0.5 h-4 min-w-4 px-1 grid place-items-center rounded-full bg-[color:var(--plum)] text-white text-[10px]">
                      {unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
