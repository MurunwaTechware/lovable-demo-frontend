// Production only: this app's server passes backend requests on (src/server.ts), the way the Vite dev server's
// proxy does during development. Bodies stream both ways, so uploads aren't held in memory and the progress
// stream (/job_events, Server-Sent Events) arrives as it's sent. Cookies go both ways untouched.

// Request headers that only describe this one connection, so they aren't passed on. ("expect" is what
// some clients send before a large upload; Node's fetch refuses to pass it on.)
const HOP_BY_HOP = [
  "expect",
  "connection",
  "keep-alive",
  "proxy-connection",
  "transfer-encoding",
  "upgrade",
  "te",
  "trailer",
];

export async function forward(
  request: Request,
  baseUrl: string,
  stripPrefix = "",
): Promise<Response> {
  const incoming = new URL(request.url);
  const path = incoming.pathname.slice(stripPrefix.length) || "/";
  const target = new URL(path + incoming.search, baseUrl);

  const headers = new Headers(request.headers);
  headers.delete("host"); // fetch sets the backend's own
  for (const name of HOP_BY_HOP) headers.delete(name);
  headers.set("x-forwarded-host", incoming.host);
  headers.set("x-forwarded-proto", incoming.protocol.replace(":", ""));

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual", // the browser follows redirects itself, at this app's address
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half"; // required by Node's fetch to stream a request body
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (error) {
    console.error(
      `Forwarding ${request.method} ${incoming.pathname} to ${target.origin} failed:`,
      error,
    );
    return new Response(
      JSON.stringify({ detail: "Can't reach the service right now. Please try again." }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const responseHeaders = new Headers(upstream.headers);
  // Node's fetch has already decompressed the body, so these would describe the wrong bytes
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
