import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Gift, Lock, Plus, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge, Field, PageTitle, Panel, buttonClass, inputClass } from "@/components/AccountUI";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CARDS,
  DEMO_VOUCHER,
  LOYALTY,
  VOUCHERS,
  money,
  shortDate,
  type SavedCard,
  type Voucher,
} from "@/lib/account-data";

export const Route = createFileRoute("/account/wallet")({
  head: () => ({ meta: [{ title: "Wallet · Mannequin AI" }] }),
  component: WalletPage,
});

function WalletPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Wallet"
        description="How you pay, plus the points and vouchers you can spend."
      />
      <Cards />
      <Points />
      <Vouchers />
    </div>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────────

/** A card stops working after the last day of its expiry month. */
function isExpired(expiry: string, now = new Date()) {
  const [mm, yy] = expiry.split("/").map(Number);
  return new Date(2000 + yy, mm, 1).getTime() <= now.getTime(); // first day of the month after
}

function Cards() {
  // Demo: changes live in this page's state
  const [cards, setCards] = useState<SavedCard[]>(CARDS);
  const [adding, setAdding] = useState(false);

  const makeDefault = (id: string) =>
    setCards((cs) => cs.map((c) => ({ ...c, isDefault: c.id === id })));
  const remove = (id: string) =>
    setCards((cs) => {
      const left = cs.filter((c) => c.id !== id);
      // Keep a default if there's a card left
      if (left.length && !left.some((c) => c.isDefault)) left[0] = { ...left[0], isDefault: true };
      return left;
    });

  return (
    <Panel
      title="Payment cards"
      description="Your default card is used at checkout unless you choose another."
      action={
        <button type="button" onClick={() => setAdding(true)} className={buttonClass.secondary}>
          <Plus className="h-4 w-4" /> Add card
        </button>
      }
    >
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No saved cards. You can add one now or at checkout.
        </p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-4">
          {cards.map((card) => {
            const expired = isExpired(card.expiry);
            return (
              <li key={card.id} className="rounded-2xl border border-border p-4">
                <div
                  className="relative aspect-[1.586] rounded-xl p-4 text-white flex flex-col justify-between overflow-hidden"
                  style={{
                    background:
                      card.brand === "Visa"
                        ? "var(--gradient-plum)"
                        : "linear-gradient(135deg, oklch(0.3 0.03 40), oklch(0.18 0.02 30))",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <CreditCard className="h-5 w-5 opacity-80" />
                    <span className="text-sm font-semibold tracking-wide">{card.brand}</span>
                  </div>
                  <div>
                    <div className="font-mono text-lg tracking-[0.2em]">•••• {card.last4}</div>
                    <div className="mt-1 flex justify-between text-xs opacity-80">
                      <span>{card.holder}</span>
                      <span>{card.expiry}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {card.isDefault && <Badge tone="plum">Default</Badge>}
                  {expired && <Badge tone="bad">Expired</Badge>}
                  <div className="ml-auto flex gap-3 text-sm">
                    {!card.isDefault && !expired && (
                      <button
                        type="button"
                        onClick={() => makeDefault(card.id)}
                        className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                      >
                        Make default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(card.id)}
                      className="text-muted-foreground hover:text-red-600 underline-offset-4 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        We never see or store your full card number. Cards are saved by our payment partner, and we
        only keep the last four digits and expiry date so you can tell them apart.
      </p>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Add a card</DialogTitle>
            <DialogDescription>
              Cards are added on our payment partner's secure form, so your card number never
              reaches our servers. That form isn't connected in this demo yet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" onClick={() => setAdding(false)} className={buttonClass.primary}>
              Got it
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

// ── Loyalty points ────────────────────────────────────────────────────────────

function Points() {
  const { points, pointValue, nextReward, activity } = LOYALTY;
  const progress = Math.min(100, Math.round((points / nextReward) * 100));

  return (
    <Panel
      title="Loyalty points"
      description="Earn points on every order. They're added once the order is delivered."
    >
      <div className="grid md:grid-cols-[1fr_1.2fr] gap-6">
        <div className="rounded-2xl p-5 text-white" style={{ background: "var(--gradient-plum)" }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] opacity-80">
            <Sparkles className="h-3.5 w-3.5" /> Your balance
          </div>
          <div className="mt-2 font-display text-5xl tabular-nums">
            {points.toLocaleString("en-US")}
          </div>
          <div className="text-sm opacity-90">points · worth {money(points * pointValue)} off</div>
          <div
            className="mt-5 h-2 rounded-full bg-white/20 overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress to your next reward"
          >
            <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 text-xs opacity-90">
            {points >= nextReward
              ? "You can use a reward at checkout."
              : `${(nextReward - points).toLocaleString("en-US")} points to a ${money(nextReward * pointValue)} reward`}
          </div>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-sans">
            Recent activity
          </h3>
          <ul className="mt-2 divide-y divide-border">
            {activity.map((a) => (
              <li
                key={a.date + a.description}
                className="flex items-center justify-between gap-4 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate">{a.description}</div>
                  <div className="text-xs text-muted-foreground">{shortDate(a.date)}</div>
                </div>
                <span
                  className={`tabular-nums font-medium ${a.points > 0 ? "text-[color:var(--plum)]" : "text-muted-foreground"}`}
                >
                  {a.points > 0 ? "+" : "−"}
                  {Math.abs(a.points).toLocaleString("en-US")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

// ── Gift vouchers ─────────────────────────────────────────────────────────────

const normaliseCode = (s: string) => s.toUpperCase().replace(/[\s-]/g, "");

function Vouchers() {
  // Demo: the form only knows DEMO_VOUCHER. With a backend, the code is checked and claimed server-side.
  const [vouchers, setVouchers] = useState<Voucher[]>(VOUCHERS);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const total = vouchers.reduce((s, v) => s + v.balance, 0);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setAdded(null);
    const entered = normaliseCode(code);
    if (!entered) return setError("Enter the code from your voucher.");
    if (vouchers.some((v) => normaliseCode(v.code) === entered))
      return setError("That voucher is already in your wallet.");
    if (entered !== normaliseCode(DEMO_VOUCHER.code))
      return setError("We couldn't find that code. Check it and try again.");
    setVouchers((vs) => [...vs, DEMO_VOUCHER]);
    setAdded(`${money(DEMO_VOUCHER.balance)} added to your wallet.`);
    setCode("");
  };

  return (
    <Panel
      title="Gift vouchers"
      description={
        vouchers.length
          ? `${money(total)} available to spend at checkout.`
          : "Add a voucher to spend it at checkout."
      }
    >
      {vouchers.length > 0 && (
        <ul className="grid sm:grid-cols-2 gap-3">
          {vouchers.map((v) => (
            <li
              key={v.code}
              className="flex items-center gap-4 rounded-2xl border border-dashed border-[color:var(--plum)]/40 bg-[color:var(--plum)]/5 p-4"
            >
              <span className="h-10 w-10 rounded-full grid place-items-center bg-background text-[color:var(--plum)] shrink-0">
                <Gift className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-2xl tabular-nums">{money(v.balance)}</div>
                <div className="text-xs text-muted-foreground">
                  {v.from ? `From ${v.from} · ` : ""}Expires {shortDate(v.expires)}
                </div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{v.code}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={add}
        noValidate
        className="mt-5 grid sm:grid-cols-[1fr_auto] gap-3 items-start"
      >
        <Field label="Add a voucher" hint={`Demo: try ${DEMO_VOUCHER.code}`} error={error}>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder="Voucher code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className={`${inputClass(!!error)} font-mono uppercase`}
            aria-invalid={!!error}
          />
        </Field>
        <button type="submit" className={`${buttonClass.primary} sm:mt-7 h-12`}>
          Add
        </button>
      </form>
      {added && (
        <p className="mt-3 text-sm text-[color:var(--plum)]" role="status">
          {added}
        </p>
      )}
    </Panel>
  );
}
