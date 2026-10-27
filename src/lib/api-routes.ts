// Which request paths belong to the backends rather than to this app's pages. Shared by the dev server's
// proxy (vite.config.ts) and, in production, this app's own server (src/server.ts), so the two can't drift.
//
// Everything goes through this app's address, so the browser sees one site: the backend's session cookie
// then belongs to it, and the backend's same-site check on uploads and sign-in passes.

/** The try-on backend (gemini-ai-virtual-try-on): uploads, progress stream, try-on, sign-in, the user's data */
export const BACKEND_PATHS =
  /^\/(process_upload|job_events|measurements_data|defaults|try-on|me|session|logout|auth)(\/.*)?$/;

/** The products API (superbalist/products_api.py), reached as /api/...; the /api prefix is removed on the way */
export const PRODUCTS_API_PATHS = /^\/api\/(.*)?$/;
export const PRODUCTS_API_PREFIX = "/api";
