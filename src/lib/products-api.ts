// src/lib/products-api.ts
//
// Real Superbalist product data for the shop pages, from the products API
// (superbalist/products_api.py). Separate from the try-on backend in lib/api.ts.
//
// Two ways a request reaches the products API:
//   - In the BROWSER: calls go to "/api/...", and the Vite dev server forwards
//     them to the products API (see vite.config.ts).
//   - On the SERVER (TanStack Start renders a page on the server when you open
//     or refresh its URL directly): there is no Vite proxy and no page origin,
//     so a relative "/api" URL can't work. The server calls the products API
//     directly instead. Without this, refreshing a product page showed
//     "Piece not found".

export type ApiProduct = {
  id: string;
  name: string;
  brand: string | null;
  price: number | null;
  wasPrice: number | null;
  onSale: boolean;
  currency: string;
  img: string | null;
  retailer: string;        // always "Superbalist" for now
  category: string | null;
  subcategory?: string | null;
  gender: string | null;
  colour: string | null;
  url: string | null;
  fit: number | null;      // null until the try-on backend scores it
};

export type ApiProductDetail = ApiProduct & {
  images: string[];
  description: string | null;
  material: string | null;
  sizes: string[];
  sizesDetail: { size: string; available: boolean; stock: number | null; price: number | null }[];
  inStockSizes: string[];
  colourOptions: { id: number; colour: string | null; url: string | null; image: string | null }[];
  modelFit: { wears: string | null; height: string | null } | null;
  tailorTips: string[];
};

export type ProductPage = {
  items: ApiProduct[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
};

export type BrandCard = { name: string; count: number; img: string | null };

const BASE: string = import.meta.env.SSR
  ? (import.meta.env.VITE_PRODUCTS_API_SERVER_URL ?? "http://localhost:8001")
  : (import.meta.env.VITE_PRODUCTS_API ?? "/api");

export class ProductsApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ProductsApiError";
  }
}

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const qs = params
    ? new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";
  const res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ""}`, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json())?.detail ?? detail; } catch { /* ignore */ }
    throw new ProductsApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export type BrowseFilters = {
  gender?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  colour?: string;
  min_price?: number;
  max_price?: number;
  q?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  page_size?: number;
};

export const productsApi = {
  list: (f: BrowseFilters = {}) => get<ProductPage>("/products", f),
  detail: (id: string, detail = true) =>
    get<ApiProductDetail>(`/products/${encodeURIComponent(id)}`, { detail: detail ? "true" : "false" }),
  sizes: (id: string) =>
    get<{ id: string; status: string; sizes: ApiProductDetail["sizesDetail"] }>(
      `/products/${encodeURIComponent(id)}/sizes`,
    ),
  brands: (gender?: string) => get<{ brands: string[] }>("/brands", { gender }),
  brandCards: (gender?: string) => get<{ brands: BrandCard[] }>("/brands/cards", { gender }),
  categories: (opts: { gender?: string; brand?: string } = {}) =>
    get<{ categories: string[] }>("/categories", opts),
  health: () => get<{ ok: boolean; products: number }>("/health"),
};

// Shared helpers used by several pages ------------------------------------

/** "adidas Originals" -> "adidas-originals" (used in /stores/<slug> URLs). */
export function brandSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const CATEGORY_LABELS: Record<string, string> = {
  "jeans-pants-shorts": "Jeans, pants & shorts",
  "jackets-coats": "Jackets & coats",
  "underwear-socks": "Underwear & socks",
  "t-shirts-vests": "T-shirts & vests",
  "plus-size": "Plus size",
};

/** "jeans-pants-shorts" -> "Jeans, pants & shorts", "girls-8-16" -> "Girls 8–16". */
export function prettyCategory(slug: string) {
  if (CATEGORY_LABELS[slug]) return CATEGORY_LABELS[slug];
  const age = slug.match(/^(baby-)?(boys|girls)-(\d+)-(\d+)$/);
  if (age) return `${age[1] ? "Baby " : ""}${age[2]} ${age[3]}–${age[4]}`.replace(/^./, (c) => c.toUpperCase());
  const text = slug.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** 1299 -> "R1 299". Same output on server and browser (no locale lookup). */
export function rand(n: number | null | undefined) {
  if (n === null || n === undefined) return "";
  return `R${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
}
