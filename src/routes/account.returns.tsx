import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, RotateCcw, Store } from "lucide-react";
import { useState } from "react";

import { Badge, EmptyState, PageTitle, Panel, buttonClass } from "@/components/AccountUI";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ORDERS,
  RETURNS,
  RETURN_DAYS,
  RETURN_FEES,
  RETURN_METHOD_LABELS,
  RETURN_REASONS,
  RETURN_STEPS,
  isStoresFault,
  money,
  rand,
  returnBy,
  returnFee,
  shortDate,
  sizeLabel,
  type OrderLine,
  type ReturnMethod,
  type ReturnReason,
  type ReturnRequest,
} from "@/lib/account-data";

// Returns: what the user has sent back, what they can still send back, and the terms and fees.
// There's no home collection: items go to a drop-off point (PostNet) or a store branch, like Zara and Cotton On.
export const Route = createFileRoute("/account/returns")({
  head: () => ({ meta: [{ title: "Returns · Mannequin AI" }] }),
  component: ReturnsPage,
});

type Returnable = { orderNumber: string; store: string; line: OrderLine; until: Date };

const REFUND_DAYS = 10; // working days after the store receives the return

function ReturnsPage() {
  // Demo: new returns live in this page's state. With stores connected, the store creates the return.
  const [returns, setReturns] = useState<ReturnRequest[]>(RETURNS);
  const [starting, setStarting] = useState<Returnable | null>(null);

  const alreadyReturned = new Set(
    returns.map((r) => r.orderNumber + r.line.product.id + r.line.size),
  );
  const returnable: Returnable[] = ORDERS.flatMap((o) => {
    const until = returnBy(o);
    if (!until || until.getTime() < Date.now()) return [];
    return o.lines
      .filter((l) => !alreadyReturned.has(o.orderNumber + l.product.id + l.size))
      .map((line) => ({ orderNumber: o.orderNumber, store: o.store, line, until }));
  });

  const submit = (item: Returnable, reason: ReturnReason, method: ReturnMethod) => {
    setReturns((rs) => [
      {
        returnNumber: `RT-${20432 + rs.length}`,
        requested: new Date().toISOString(),
        orderNumber: item.orderNumber,
        store: item.store,
        line: item.line,
        reason,
        method,
        status: "requested",
        refund: item.line.price * item.line.quantity,
        fee: returnFee(method, reason),
      },
      ...rs,
    ]);
    setStarting(null);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="Returns"
        description="Send items back at a drop-off point or at one of the store's branches. We don't collect from your home."
      />

      <Panel title="Your returns">
        {returns.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't returned anything.</p>
        ) : (
          <ul className="divide-y divide-border">
            {returns.map((r) => (
              <ReturnRow key={r.returnNumber} item={r} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Start a return"
        description="Items from delivered orders that are still within their return window."
      >
        {returnable.length === 0 ? (
          <EmptyState
            icon={<RotateCcw className="h-5 w-5" />}
            title="Nothing to return right now"
            text="Once an order is delivered, its items show up here until the return window closes."
            action={
              <Link to="/account/orders" className={buttonClass.secondary}>
                See your orders
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {returnable.map((item) => (
              <li
                key={item.orderNumber + item.line.product.id + item.line.size}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <img
                  src={item.line.product.img}
                  alt=""
                  className="h-16 w-12 rounded-lg object-cover bg-secondary shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2">{item.line.product.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {sizeLabel(item.line.size)} · {item.orderNumber} · Return by{" "}
                    {shortDate(item.until)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStarting(item)}
                  className={buttonClass.secondary}
                >
                  Return
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <WaysToReturn />
      <ReturnTerms />

      <StartReturnDialog item={starting} onClose={() => setStarting(null)} onSubmit={submit} />
    </div>
  );
}

// ── Your returns ──────────────────────────────────────────────────────────────

/** What the user needs to know, or do, at each status. */
function nextStep(r: ReturnRequest) {
  switch (r.status) {
    case "requested":
      return r.method === "drop_off"
        ? `Drop it off at a PostNet with the QR code we emailed you, by ${shortDate(returnByFor(r))}.`
        : `Take it to any ${r.store} branch with order number ${r.orderNumber}.`;
    case "dropped_off":
      return `On its way to ${r.store}.`;
    case "received":
      return `${r.store} has it. Your refund follows within ${REFUND_DAYS} working days.`;
    case "refunded":
      return "Refunded to the card you paid with.";
  }
}

function returnByFor(r: ReturnRequest) {
  const order = ORDERS.find((o) => o.orderNumber === r.orderNumber);
  return (order && returnBy(order)) ?? new Date(r.requested);
}

function ReturnRow({ item }: { item: ReturnRequest }) {
  const label = RETURN_STEPS.find((s) => s.status === item.status)!.label;
  return (
    <li className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
      <img
        src={item.line.product.img}
        alt=""
        className="h-16 w-12 rounded-lg object-cover bg-secondary shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="line-clamp-2">{item.line.product.name}</span>
          <Badge tone={item.status === "refunded" ? "good" : "plum"}>{label}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {item.returnNumber} · {item.store} · {RETURN_METHOD_LABELS[item.method]} · {item.reason}
        </div>
        <div className="mt-1 text-sm">{nextStep(item)}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Refund {money(item.refund)}
          {item.fee > 0 ? `, less the ${rand(item.fee)} drop-off fee` : ""}
        </div>
      </div>
    </li>
  );
}

// ── Ways to return and terms ──────────────────────────────────────────────────

function WaysToReturn() {
  const ways = [
    {
      icon: MapPin,
      title: "Drop-off point",
      price: rand(RETURN_FEES.drop_off),
      priceNote: "taken off your refund",
      steps: [
        "Request the return above.",
        "We email you a QR code, or a label for each box.",
        "Pack the items in any sealed bag or box. The original packaging isn't needed.",
        "Drop it off at any PostNet before your return deadline. No receipt needed.",
      ],
    },
    {
      icon: Store,
      title: "In store",
      price: "Free",
      priceNote: "where the store has branches",
      steps: [
        "Take the items to any of the store's branches.",
        "Show your order number from Orders. Someone else can return it for you.",
        "Swap for another size on the spot if it's in stock, or get a refund.",
      ],
    },
  ];

  return (
    <Panel
      title="Ways to return"
      description="Returning a faulty or wrong item is free, whichever way you choose."
    >
      <div className="grid sm:grid-cols-2 gap-4">
        {ways.map((w) => {
          const Icon = w.icon;
          return (
            <div key={w.title} className="rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="h-10 w-10 rounded-full grid place-items-center bg-secondary text-[color:var(--plum)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="text-right">
                  <div className="font-display text-2xl">{w.price}</div>
                  <div className="text-xs text-muted-foreground">{w.priceNote}</div>
                </div>
              </div>
              <h3 className="mt-3 font-display text-xl">{w.title}</h3>
              <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                {w.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

const FEES: [string, string][] = [
  ["Drop-off point", `${rand(RETURN_FEES.drop_off)} per return request, taken off your refund`],
  ["In store", "Free"],
  ["Faulty, damaged or wrong item", "Free either way, and we refund the delivery fee too"],
  ["Original delivery fee", "Not refunded when you change your mind"],
];

function ReturnTerms() {
  return (
    <Panel title="Return terms">
      <div className="space-y-6 text-sm">
        <Term title="Return window">
          You have {RETURN_DAYS} days from delivery. Each order shows its exact deadline. If a
          store's own policy gives you longer, theirs applies.
        </Term>

        <Term title="What it costs">
          <table className="w-full mt-1 text-sm">
            <tbody className="divide-y divide-border">
              {FEES.map(([what, cost]) => (
                <tr key={what}>
                  <th
                    scope="row"
                    className="py-2 pr-4 text-left font-normal text-foreground align-top"
                  >
                    {what}
                  </th>
                  <td className="py-2 text-muted-foreground">{cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Term>

        <Term title="Condition">
          Items must be unworn, unwashed and unused, with the original tags still attached. Swimwear
          needs its hygiene sticker. You don't need the original packaging.
        </Term>

        <Term title="What can't be returned">
          Underwear, earrings and other pierced jewellery, cosmetics and fragrance, personalised
          items and gift vouchers, unless they arrive faulty.
        </Term>

        <Term title="Refunds">
          We refund the card you paid with within {REFUND_DAYS} working days of the store receiving
          your return, and email you when it's done. Anything you paid with a gift voucher or points
          goes back to your Wallet.
        </Term>

        <Term title="Exchanges">
          To swap for another size, return the item in store and swap it there. With a drop-off
          return, you get a refund and can place a new order.
        </Term>

        <Term title="Faulty items">
          Under the Consumer Protection Act, you can return a faulty item within six months of
          delivery for a repair, replacement or refund.
        </Term>

        <Term title="Several items">
          One return request can cover several items from the same store, with one label per box.
          Each store handles its own returns, so items from different stores go back separately.
        </Term>
      </div>
    </Panel>
  );
}

function Term({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[180px_1fr] gap-1 sm:gap-6">
      <h3 className="font-sans font-medium tracking-normal">{title}</h3>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}

// ── Start a return ────────────────────────────────────────────────────────────

function StartReturnDialog({
  item,
  onClose,
  onSubmit,
}: {
  item: Returnable | null;
  onClose: () => void;
  onSubmit: (item: Returnable, reason: ReturnReason, method: ReturnMethod) => void;
}) {
  const [reason, setReason] = useState<ReturnReason | null>(null);
  const [method, setMethod] = useState<ReturnMethod>("drop_off");

  const close = () => {
    setReason(null);
    setMethod("drop_off");
    onClose();
  };

  const fee = reason ? returnFee(method, reason) : RETURN_FEES[method];
  const refund = item ? item.line.price * item.line.quantity : 0;

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Return this item?</DialogTitle>
              <DialogDescription>
                {item.line.product.name} (
                {item.line.size === "One size" ? "one size" : `size ${item.line.size}`}) from{" "}
                {item.store}. Return by {shortDate(item.until)}.
              </DialogDescription>
            </DialogHeader>

            <fieldset>
              <legend className="text-sm font-medium mb-2">Why are you sending it back?</legend>
              <div className="grid gap-2">
                {RETURN_REASONS.map((r) => (
                  <Choice
                    key={r}
                    name="reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  >
                    {r}
                  </Choice>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium mb-2">How will you send it back?</legend>
              <div className="grid gap-2">
                {(["drop_off", "in_store"] as const).map((m) => {
                  const cost = reason ? returnFee(m, reason) : RETURN_FEES[m];
                  return (
                    <Choice
                      key={m}
                      name="method"
                      checked={method === m}
                      onChange={() => setMethod(m)}
                    >
                      <span className="flex-1">{RETURN_METHOD_LABELS[m]}</span>
                      <span className="text-muted-foreground">{cost ? rand(cost) : "Free"}</span>
                    </Choice>
                  );
                })}
              </div>
            </fieldset>

            <p className="rounded-xl bg-secondary px-3 py-2.5 text-sm text-muted-foreground">
              {method === "drop_off"
                ? "We'll email you a QR code to drop it off at any PostNet."
                : `Take it to any ${item.store} branch with order number ${item.orderNumber}.`}{" "}
              {reason && isStoresFault(reason)
                ? "It's free because the item was faulty or wrong."
                : fee > 0
                  ? `Refund: ${money(refund)}, less the ${rand(fee)} drop-off fee.`
                  : `Refund: ${money(refund)}.`}
              {(reason === "Too small" || reason === "Too big") &&
                " Thanks, this also helps us improve your size recommendations."}
            </p>

            <DialogFooter className="gap-2 sm:gap-2">
              <button type="button" onClick={close} className={buttonClass.secondary}>
                Cancel
              </button>
              <button
                type="button"
                disabled={!reason}
                onClick={() => {
                  onSubmit(item, reason!, method);
                  setReason(null);
                  setMethod("drop_off");
                }}
                className={buttonClass.primary}
              >
                Request return
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Choice({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm cursor-pointer transition ${
        checked
          ? "border-[color:var(--plum)] bg-[color:var(--plum)]/5"
          : "border-border hover:bg-accent"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="accent-[color:var(--plum)]"
      />
      {children}
    </label>
  );
}
