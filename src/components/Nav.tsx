import { Link } from "@tanstack/react-router";
import { Shirt, Moon, Sun, ShoppingBag, Heart, Menu, X, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useShop } from "@/lib/shop-store";
import { fullName, initials, useAccount, type Account } from "@/lib/account-store";

const LINKS = [
  { to: "/stores", label: "Stores" },
  { to: "/community", label: "Community" },
] as const;



export function Nav({ onOpenCart }: { onOpenCart?: () => void }) {
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const { cart, wishlist } = useShop();
  const account = useAccount();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="fixed top-0 inset-x-0 z-40 glass border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-medium">
          <span className="h-8 w-8 rounded-full grid place-items-center" style={{ background: "var(--gradient-plum)" }}>
            <Shirt className="h-4 w-4 text-white" />
          </span>
          <span className="hidden sm:inline">Mannequin<span className="text-[color:var(--plum)]">AI</span></span>
          <span className="sm:hidden">MQ<span className="text-[color:var(--plum)]">AI</span></span>
        </Link>
        <nav className="hidden lg:flex items-center gap-7 text-sm">
          <Link
            to="/scan"
            className="text-muted-foreground hover:text-foreground transition"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Scan
          </Link>
          <Link
            to="/twin"
            className="text-muted-foreground hover:text-foreground transition"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Twin
          </Link>
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-muted-foreground hover:text-foreground transition"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/wishlist"
            className="text-muted-foreground hover:text-foreground transition inline-flex items-center gap-1.5"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            <Heart className="h-3.5 w-3.5" /> Wishlist
            {wishlist.size > 0 && (
              <span className="h-4 min-w-4 px-1 grid place-items-center rounded-full bg-[color:var(--plum)] text-white text-[10px]">
                {wishlist.size}
              </span>
            )}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={() => setDark(!dark)} className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-accent">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {onOpenCart ? (
            <button onClick={onOpenCart} className="relative h-9 rounded-full border border-border px-3 hidden lg:inline-flex items-center gap-2 text-sm hover:bg-accent">
              <ShoppingBag className="h-4 w-4" /> Cart
              {cart.length > 0 && <span className="ml-1 h-5 min-w-5 px-1 grid place-items-center rounded-full bg-[color:var(--plum)] text-white text-[10px]">{cart.length}</span>}
            </button>
          ) : (
            <Link to="/" hash="shop" className="relative h-9 rounded-full border border-border px-3 hidden lg:inline-flex items-center gap-2 text-sm hover:bg-accent">
              <ShoppingBag className="h-4 w-4" /> Cart
              {cart.length > 0 && <span className="ml-1 h-5 min-w-5 px-1 grid place-items-center rounded-full bg-[color:var(--plum)] text-white text-[10px]">{cart.length}</span>}
            </Link>
          )}
          <Link
            to="/account"
            aria-label={account ? `Your account (${fullName(account)})` : "Your account"}
            title={account ? `${fullName(account)}\n${account.email}` : "Your account"}
            className="hidden lg:grid rounded-full outline-none ring-offset-2 ring-offset-background hover:ring-2 hover:ring-border focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar account={account} size="h-9 w-9 text-sm" />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-accent"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur">
          <nav className="mx-auto max-w-7xl px-6 py-4 flex flex-col gap-3 text-sm">
            <Link to="/scan" onClick={() => setOpen(false)} className="py-1.5">
              Scan
            </Link>
            <Link to="/twin" onClick={() => setOpen(false)} className="py-1.5">
              Twin
            </Link>
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="py-1.5">
                {l.label}
              </Link>
            ))}
            <Link to="/wishlist" onClick={() => setOpen(false)} className="py-1.5 inline-flex items-center gap-2">
              <Heart className="h-3.5 w-3.5" /> Wishlist {wishlist.size > 0 && <span className="text-[color:var(--plum)]">({wishlist.size})</span>}
            </Link>
            {onOpenCart ? (
              <button onClick={() => { setOpen(false); onOpenCart(); }} className="py-1.5 inline-flex items-center gap-2 text-left">
                <ShoppingBag className="h-3.5 w-3.5" /> Cart {cart.length > 0 && <span className="text-[color:var(--plum)]">({cart.length})</span>}
              </button>
            ) : (
              <Link to="/" hash="shop" onClick={() => setOpen(false)} className="py-1.5 inline-flex items-center gap-2">
                <ShoppingBag className="h-3.5 w-3.5" /> Cart {cart.length > 0 && <span className="text-[color:var(--plum)]">({cart.length})</span>}
              </Link>
            )}
            <div className="border-t border-border pt-3 mt-1">
              <Link to="/account" onClick={() => setOpen(false)} className="py-1.5 inline-flex items-center gap-3">
                <Avatar account={account} size="h-8 w-8 text-xs" />
                <span>
                  Your account
                  {account && <span className="block text-xs text-muted-foreground">{account.email}</span>}
                </span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

// Like a Google account without a profile picture: initials on a coloured circle. Shows the photo once there is one.
export function Avatar({ account, size }: { account: Account | null; size: string }) {
  if (account?.photoUrl) {
    return <img src={account.photoUrl} alt="" className={`${size} rounded-full object-cover`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`${size} grid place-items-center rounded-full font-medium text-white select-none`}
      style={{ background: "var(--gradient-plum)" }}
    >
      {account ? initials(account) : <User className="h-4 w-4" />}
    </span>
  );
}
