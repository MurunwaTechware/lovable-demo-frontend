import "./lib/error-capture";

import { BACKEND_PATHS, PRODUCTS_API_PATHS, PRODUCTS_API_PREFIX } from "./lib/api-routes";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { forward } from "./lib/forward";

// Where the backends are, read when the server starts (e.g. the Cloud Run services' addresses). Only set in
// production: during development the Vite dev server forwards these paths itself (vite.config.ts).
const env = typeof process !== "undefined" ? process.env : {};
const BACKEND_URL = env.BACKEND_URL;
const PRODUCTS_API_URL = env.PRODUCTS_API_URL;

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

/** A backend request to pass on, or null for this app's own pages. */
function forwardIfBackend(request: Request): Promise<Response> | null {
  const { pathname } = new URL(request.url);
  if (BACKEND_URL && BACKEND_PATHS.test(pathname)) return forward(request, BACKEND_URL);
  if (PRODUCTS_API_URL && PRODUCTS_API_PATHS.test(pathname))
    return forward(request, PRODUCTS_API_URL, PRODUCTS_API_PREFIX);
  return null;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const forwarded = forwardIfBackend(request);
    if (forwarded) return forwarded;
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
