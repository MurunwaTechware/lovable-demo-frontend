import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, RotateCcw, Truck } from "lucide-react";
import { useState } from "react";

import { Badge, EmptyState, PageTitle, buttonClass } from "@/components/AccountUI";
import {
  ORDERS,
  ORDER_STATUS_LABELS,
  money,
  orderTotal,
  returnBy,
  shortDate,
  sizeLabel,
  type Order,
  type OrderStatus,
} from "@/lib/account-data";

export const Route = createFileRoute("/account/orders")({
  head: () => ({ meta: [{ title: "Orders · Mannequin AI" }] }),
  component: OrdersPage,
});

const FILTERS: {
  id: "all" | "active" | "delivered" | "cancelled";
  label: string;
  statuses: OrderStatus[];
}[] = [
  { id: "all", label: "All", statuses: ["processing", "shipped", "delivered", "cancelled"] },
  { id: "active", label: "In progress", statuses: ["processing", "shipped"] },
  { id: "delivered", label: "Delivered", statuses: ["delivered"] },
  { id: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

const STATUS_TONE: Record<OrderStatus, "plum" | "good" | "muted" | "bad"> = {
  processing: "muted",
  shipped: "plum",
  delivered: "good",
  cancelled: "bad",
};

function OrdersPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const statuses = FILTERS.find((f) => f.id === filter)!.statuses;
  const orders = [...ORDERS]
    .filter((o) => statuses.includes(o.status))
    .sort((a, b) => b.placed.localeCompare(a.placed));

  return (
    <div>
      <PageTitle
        title="Orders"
        description="Everything you've bought through Mannequin AI. Each store sends its own parcel, so an outfit from two stores arrives as two orders."
      />

      <div className="mb-5 flex gap-1 overflow-x-auto" role="tablist" aria-label="Filter orders">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-3.5 h-8 text-xs transition ${
              filter === f.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="No orders here"
          text="Orders you place through the stores show up here."
          action={
            <Link to="/stores" className={buttonClass.primary}>
              Browse stores
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <OrderCard key={o.orderNumber} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const until = returnBy(order);
  const canReturn = until !== null && until.getTime() >= Date.now();

  return (
    <article className="rounded-3xl border border-border bg-card p-5 md:p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium font-sans tracking-normal">{order.orderNumber}</h3>
            <Badge tone={STATUS_TONE[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.store} · Ordered {shortDate(order.placed)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="font-medium tabular-nums">{money(orderTotal(order))}</div>
          {order.shipping > 0 && (
            <div className="text-xs text-muted-foreground">
              incl. {money(order.shipping)} delivery
            </div>
          )}
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {order.lines.map((l) => (
          <li key={l.product.id + l.size} className="flex items-center gap-4">
            <Link to="/product/$id" params={{ id: l.product.id }} className="shrink-0">
              <img
                src={l.product.img}
                alt=""
                className="h-20 w-16 rounded-xl object-cover bg-secondary"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                to="/product/$id"
                params={{ id: l.product.id }}
                className="hover:underline line-clamp-2"
              >
                {l.product.name}
              </Link>
              <div className="text-sm text-muted-foreground">
                {l.product.brand} · {sizeLabel(l.size)}
                {l.quantity > 1 && ` · Qty ${l.quantity}`}
              </div>
            </div>
            <div className="text-sm tabular-nums">{money(l.price * l.quantity)}</div>
          </li>
        ))}
      </ul>

      <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="text-muted-foreground">
          {order.status === "processing" && "The store is getting your order ready."}
          {order.status === "shipped" && (
            <span className="inline-flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Arriving by {shortDate(order.estimatedDelivery!)}
              {order.trackingNumber && (
                <span className="hidden sm:inline">· Tracking {order.trackingNumber}</span>
              )}
            </span>
          )}
          {order.status === "delivered" &&
            `Delivered ${shortDate(order.delivered!)} · ${
              canReturn ? `Returnable until ${shortDate(until!)}` : "Return window closed"
            }`}
          {order.status === "cancelled" && "Cancelled. Anything you paid is refunded to your card."}
        </div>
        {canReturn && (
          <Link to="/account/returns" className={buttonClass.secondary}>
            <RotateCcw className="h-3.5 w-3.5" /> Return an item
          </Link>
        )}
      </div>
    </article>
  );
}
