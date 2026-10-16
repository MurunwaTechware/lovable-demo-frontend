import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Heart,
  LifeBuoy,
  LogOut,
  Package,
  RotateCcw,
  UserRound,
  Wallet,
} from "lucide-react";

import { Avatar, Nav } from "@/components/Nav";
import { useAccount } from "@/lib/account-store";

// The account area: "Hi {name}" at the top, the menu on the left (on phones, a list on the main account page)
// and the chosen section on the right. Wishlist and Help centre are their own pages outside this area.
export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your account · Mannequin AI" },
      { name: "description", content: "Your details, orders, returns, wallet and settings." },
    ],
  }),
  component: AccountLayout,
});

type MenuItem = {
  to:
    | "/account"
    | "/account/orders"
    | "/account/returns"
    | "/account/wallet"
    | "/account/notifications"
    | "/wishlist"
    | "/trust";
  label: string;
  hint?: string;
  icon: typeof Bell;
  exact?: boolean;
};

const MENU: MenuItem[] = [
  { to: "/account", label: "Account details", icon: UserRound, exact: true },
  { to: "/account/orders", label: "Orders", hint: "My purchases", icon: Package },
  { to: "/account/returns", label: "Returns", icon: RotateCcw },
  { to: "/account/wallet", label: "Wallet", hint: "Cards, points & vouchers", icon: Wallet },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/notifications", label: "Notification settings", icon: Bell },
  { to: "/trust", label: "Help centre", hint: "FAQs, privacy & your data", icon: LifeBuoy },
];

function AccountLayout() {
  const account = useAccount();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onDetails = pathname.replace(/\/$/, "") === "/account";

  // Demo: nothing to clear yet. With the backend: POST /logout (ends the session cookie), then Firebase signOut().
  const signOut = () => navigate({ to: "/" });

  if (!account) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <main className="mx-auto max-w-md px-6 pt-32 text-center">
          <h1 className="font-display text-3xl">Sign in to see your account</h1>
          <p className="mt-2 text-muted-foreground">
            Your orders, wallet and details live here once you're signed in.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
        <header className="flex items-center gap-4">
          <Avatar account={account} size="h-14 w-14 text-lg" />
          <div className="min-w-0">
            <h1 className="font-display text-3xl md:text-4xl truncate">
              Hi, {account.firstName || "there"}
            </h1>
            <p className="text-sm text-muted-foreground truncate">{account.email}</p>
          </div>
        </header>

        <div className="mt-8 grid lg:grid-cols-[260px_1fr] gap-8 items-start">
          {/* Phones: the menu is the account page itself; each section links back to it */}
          <aside className={`${onDetails ? "" : "hidden lg:block"} lg:sticky lg:top-24`}>
            <nav aria-label="Account" className="rounded-2xl border border-border bg-card p-2">
              {MENU.map((item) => {
                const active = item.exact ? onDetails : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={`${item.exact ? "hidden lg:flex" : "flex"} w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                      active
                        ? "bg-[color:var(--plum)]/10 text-[color:var(--plum)]"
                        : "hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 min-w-0">
                      {item.label}
                      {item.hint && (
                        <span className="block text-xs text-muted-foreground">{item.hint}</span>
                      )}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                  </Link>
                );
              })}
              <div className="my-2 border-t border-border" />
              <button
                type="button"
                onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </nav>
          </aside>

          <div className="min-w-0">
            {!onDetails && (
              <Link
                to="/account"
                className="lg:hidden mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" /> Your account
              </Link>
            )}
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
