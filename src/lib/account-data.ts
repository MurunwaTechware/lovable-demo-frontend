// Orders, returns and wallet for the /account pages.
//
// MOCK DATA: none of this exists in the backend yet. Each store handles its own orders, so with real stores
// these would come from the stores' order APIs (or webhooks we keep a copy of), one order per store.
// Card details never come through us: cards are added on the payment provider's own form, and we only keep
// what it sends back (brand, last four digits, expiry, a token).

import { PRODUCTS, type Product } from "@/lib/shop-store";

const product = (id: string) => PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export type OrderLine = { product: Product; size: string; quantity: number; price: number };

export type Order = {
  orderNumber: string;
  placed: string; // ISO date-time
  store: string;
  status: OrderStatus;
  delivered?: string; // ISO date, once delivered
  estimatedDelivery?: string; // ISO date, while on the way
  trackingNumber?: string;
  lines: OrderLine[];
  shipping: number;
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  processing: "Processing",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// How long after delivery items can be returned. Each store sets its own; 30 days is the sample.
export const RETURN_DAYS = 30;

const line = (id: string, size: string, quantity = 1): OrderLine => {
  const p = product(id);
  return { product: p, size, quantity, price: p.price };
};

export const ORDERS: Order[] = [
  {
    orderNumber: "MQ-104382",
    placed: "2026-10-11T18:42:00",
    store: product("2").retailer,
    status: "shipped",
    estimatedDelivery: "2026-10-16",
    trackingNumber: "TCG8821904ZA",
    lines: [line("2", "39")],
    shipping: 0,
  },
  {
    orderNumber: "MQ-103917",
    placed: "2026-10-02T12:05:00",
    store: product("1").retailer,
    status: "delivered",
    delivered: "2026-10-07",
    lines: [line("1", "S")],
    shipping: 0,
  },
  {
    orderNumber: "MQ-103455",
    placed: "2026-09-20T09:30:00",
    store: product("9").retailer,
    status: "delivered",
    delivered: "2026-09-24",
    lines: [line("9", "S"), line("3", "One size")],
    shipping: 12,
  },
  {
    orderNumber: "MQ-102018",
    placed: "2026-08-03T20:15:00",
    store: product("7").retailer,
    status: "delivered",
    delivered: "2026-08-07",
    lines: [line("7", "M")],
    shipping: 0,
  },
  {
    orderNumber: "MQ-101776",
    placed: "2026-07-28T15:48:00",
    store: product("6").retailer,
    status: "cancelled",
    lines: [line("6", "M")],
    shipping: 12,
  },
];

/** "Size M", or just "One size". */
export const sizeLabel = (size: string) => (size === "One size" ? size : `Size ${size}`);

export const orderTotal = (o: Order) =>
  o.lines.reduce((sum, l) => sum + l.price * l.quantity, 0) + o.shipping;

/** The last day items from this order can be sent back, or null if they can't be. */
export function returnBy(o: Order): Date | null {
  if (o.status !== "delivered" || !o.delivered) return null;
  const d = new Date(`${o.delivered}T23:59:59`);
  d.setDate(d.getDate() + RETURN_DAYS);
  return d;
}

// ── Returns ───────────────────────────────────────────────────────────────────

// How a return gets back to the store. No home collection: the user takes it to a drop-off point or a branch.
export type ReturnMethod = "drop_off" | "in_store";

// Sample fees in rand, modelled on SA fashion stores (Zara charges R29 for a PostNet drop-off).
// The fee comes off the refund, and is waived when the item is faulty or wrong.
export const RETURN_FEES: Record<ReturnMethod, number> = { drop_off: 29, in_store: 0 };

export const RETURN_METHOD_LABELS: Record<ReturnMethod, string> = {
  drop_off: "Drop-off point",
  in_store: "In store",
};

export type ReturnStatus = "requested" | "dropped_off" | "received" | "refunded";

// The order a drop-off return moves through. In store skips straight from requested to received.
export const RETURN_STEPS: { status: ReturnStatus; label: string }[] = [
  { status: "requested", label: "Requested" },
  { status: "dropped_off", label: "Dropped off" },
  { status: "received", label: "Received by store" },
  { status: "refunded", label: "Refunded" },
];

export const RETURN_REASONS = [
  "Too small",
  "Too big",
  "Doesn't look like the photos",
  "Arrived damaged or faulty",
  "Wrong item sent",
  "Changed my mind",
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number];

/** Faulty or wrong items are the store's mistake, so returning them is free. */
export const isStoresFault = (reason: ReturnReason) =>
  reason === "Arrived damaged or faulty" || reason === "Wrong item sent";

export const returnFee = (method: ReturnMethod, reason: ReturnReason) =>
  isStoresFault(reason) ? 0 : RETURN_FEES[method];

/** Rand, for the return terms and fees. The rest of the mock app still shows dollars. */
export const rand = (n: number) => `R ${n.toFixed(2)}`;

export type ReturnRequest = {
  returnNumber: string;
  requested: string; // ISO date-time
  orderNumber: string;
  store: string;
  line: OrderLine;
  reason: ReturnReason;
  method: ReturnMethod;
  status: ReturnStatus;
  refund: number; // item price; any fee is listed separately
  fee: number;
};

export const RETURNS: ReturnRequest[] = [
  {
    returnNumber: "RT-20431",
    requested: "2026-09-27T10:12:00",
    orderNumber: "MQ-103455",
    store: product("9").retailer,
    line: line("9", "S"),
    reason: "Too small",
    method: "drop_off",
    status: "received",
    refund: product("9").price,
    fee: RETURN_FEES.drop_off,
  },
];

// ── Wallet ────────────────────────────────────────────────────────────────────

export type CardBrand = "Visa" | "Mastercard";

export type SavedCard = {
  id: string;
  brand: CardBrand;
  last4: string;
  expiry: string; // MM/YY
  holder: string;
  isDefault: boolean;
};

export const CARDS: SavedCard[] = [
  {
    id: "card_1",
    brand: "Visa",
    last4: "4242",
    expiry: "08/28",
    holder: "A Mokoena",
    isDefault: true,
  },
  {
    id: "card_2",
    brand: "Mastercard",
    last4: "5100",
    expiry: "02/27",
    holder: "A Mokoena",
    isDefault: false,
  },
];

export type PointsActivity = { date: string; description: string; points: number };

export const LOYALTY = {
  points: 1240,
  pointValue: 0.01, // each point is worth 1 cent
  nextReward: 2000,
  activity: [
    { date: "2026-10-07", description: "Order MQ-103917 delivered", points: 890 },
    { date: "2026-09-24", description: "Order MQ-103455 delivered", points: 350 },
    { date: "2026-09-01", description: "Joined Mannequin AI", points: 100 },
    { date: "2026-08-15", description: "Used on order MQ-102018", points: -100 },
  ] as PointsActivity[],
};

export type Voucher = { code: string; balance: number; expires: string; from?: string };

export const VOUCHERS: Voucher[] = [
  { code: "GIFT-7Q4M-28KD", balance: 50, expires: "2027-03-31", from: "Thandi" },
];

// Demo: the one code the "Add a voucher" form accepts. With a backend, the code is checked server-side.
export const DEMO_VOUCHER: Voucher = { code: "WELCOME25", balance: 25, expires: "2026-12-31" };

// ── Formatting ────────────────────────────────────────────────────────────────

// Prices across the app are shown in dollars, so these follow suit
export const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export const shortDate = (iso: string | Date) =>
  new Date(
    typeof iso === "string" && iso.length === 10 ? `${iso}T00:00:00` : iso,
  ).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
