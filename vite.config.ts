// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

import { BACKEND_PATHS, PRODUCTS_API_PATHS, PRODUCTS_API_PREFIX } from "./src/lib/api-routes";

// The FastAPI try-on backend (gemini-ai-virtual-try-on). Override with BACKEND_URL if it runs elsewhere.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
// The Superbalist products API (products_api.py). Override with PRODUCTS_API_URL if it runs elsewhere.
const PRODUCTS_API_URL = process.env.PRODUCTS_API_URL ?? "http://localhost:8001";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      // Lovable's default, pinned here: with the proxy below added, some setups fell back to Vite's 5173
      port: 8080,
      // Dev only: the backend's API calls go through this server, so the browser sees one address.
      // That keeps the backend's same-origin check on uploads working with no CORS settings.
      // Only API paths are forwarded; the page routes (/scan, /tryon, ...) stay with the frontend.
      // Lovable's own preview drops this setting, and has no backend to reach anyway.
      // Which paths go where: src/lib/api-routes.ts, shared with the production server (src/server.ts).
      proxy: {
        // Includes session/logout/auth for sign-in (lib/auth.ts): the session cookie belongs to this address
        [BACKEND_PATHS.source]: {
          target: BACKEND_URL,
        },
        // Superbalist products API. The browser calls /api/products, /api/brands, ... and this
        // forwards to the products service, stripping the /api prefix (so /api/products -> /products).
        [PRODUCTS_API_PATHS.source]: {
          target: PRODUCTS_API_URL,
          rewrite: (p) => p.slice(PRODUCTS_API_PREFIX.length),
        },
      },
    },
  },
});
