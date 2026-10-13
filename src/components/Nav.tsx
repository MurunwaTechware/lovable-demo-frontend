import { Link } from "@tanstack/react-router";
import { Shirt, Moon, Sun, ShoppingBag, Heart, Menu, X, User, ShieldCheck, Settings, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useShop } from "@/lib/shop-store";

const LINKS = [
  { to: "/stores", label: "Stores" },
  { to: "/stylist", label: "Stylist & Journey" },
  { to: "/tailors", label: "Tailors" },
  { to: "/community", label: "Community" },
] as const;


export function Nav({ onOpenCart }: { onOpenCart?: () => void }) {
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { cart, wishlist } = useShop();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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
          <Link to="/" hash="scan" className="text-muted-foreground hover:text-foreground transition">Scan</Link>
          <Link to="/" hash="twin" className="text-muted-foreground hover:text-foreground transition">Twin</Link>
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
          <div ref={profileRef} className="relative hidden lg:block">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="h-9 w-9 grid place-items-center rounded-full border border-border hover:bg-accent"
              aria-label="Profile"
              aria-expanded={profileOpen}
            >
              <User className="h-4 w-4" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-background shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-border">
                  <div className="text-sm font-medium">Your account</div>
                  <div className="text-xs text-muted-foreground">Manage privacy & preferences</div>
                </div>
                <div className="py-1 text-sm">
                  <Link to="/trust" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent">
                    <ShieldCheck className="h-4 w-4 text-[color:var(--plum)]" /> Trust Centre
                  </Link>
                  <Link to="/privacy" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent">
                    <Settings className="h-4 w-4" /> Privacy settings
                  </Link>
                  <Link to="/wishlist" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent">
                    <Heart className="h-4 w-4" /> Wishlist
                  </Link>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-left text-muted-foreground">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
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
            <div className="border-t border-border pt-3 mt-1 flex flex-col gap-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground inline-flex items-center gap-2"><User className="h-3.5 w-3.5" /> Your account</div>
              <Link to="/trust" onClick={() => setOpen(false)} className="py-1.5 inline-flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--plum)]" /> Trust Centre
              </Link>
              <Link to="/privacy" onClick={() => setOpen(false)} className="py-1.5 inline-flex items-center gap-2">
                <Settings className="h-3.5 w-3.5" /> Privacy settings
              </Link>
              <button onClick={() => setOpen(false)} className="py-1.5 inline-flex items-center gap-2 text-left text-muted-foreground">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
