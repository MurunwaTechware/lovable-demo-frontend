// src/lib/products-api.ts
//
// Real Superbalist product data for the shop pages (Stores / Marketplace / Product).
// This talks to YOUR temporary FastAPI products API (products_api.py), which is a
// separate service from the try-on backend in lib/api.ts.
//
// In dev, Vite proxies "/api/..." to the products API (see vite.config.ts change).
// The try-on backend (lib/api.ts) is unaffected — it keeps its own proxied paths.
//
// The ApiProduct shape matches lib/shop-store.ts's `Product` where it can, so the
// existing cards/components keep working. Fields the catalogue can't know yet
// (fit %, tailorTips) come back null/empty and the UI simply hides them.

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
  total: number | null;
  pages?: number;
  query?: string;
};

// Same-origin in dev (Vite proxy forwards /api -> products API). Override with
// VITE_PRODUCTS_API if you host the products API elsewhere.
const BASE = (import.meta as any).env?.VITE_PRODUCTS_API ?? "/api";

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
    ? "?" + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";
  const res = await fetch(`${BASE}${path}${qs}`, { headers: { Accept: "application/json" } });
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
    get<ApiProductDetail>(`/products/${encodeURIComponent(id)}`, { detail: detail ? 1 : 0 }),
  sizes: (id: string) =>
    get<{ id: string; status: string; sizes: ApiProductDetail["sizesDetail"] }>(
      `/products/${encodeURIComponent(id)}/sizes`,
    ),
  brands: (gender?: string) => get<{ brands: string[] }>("/brands", { gender }),
  categories: (gender?: string) => get<{ categories: string[] }>("/categories", { gender }),
  health: () => get<{ ok: boolean; products: number }>("/health"),
};
