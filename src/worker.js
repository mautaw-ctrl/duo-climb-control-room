import app from "./index.js";

const KEEPERFX_WINE_PATH = "/keeperfx/runtime-web/fullWine1.7.55-v8.zip";
const KEEPERFX_WINE_UPSTREAM = "https://www.boxedwine.org/boxedwine/fs/fullWine1.7.55-v8.zip";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Cloudflare static assets are capped at 25 MiB. The full BoxedWine Wine
    // root is ~48 MiB, so stream it from upstream through the Worker instead.
    // Preserve Range requests because BoxedWine reads the ZIP in byte ranges.
    if (url.pathname === KEEPERFX_WINE_PATH) {
      return proxyKeeperFxWine(request);
    }

    return app.fetch(request, env, ctx);
  }
};

async function proxyKeeperFxWine(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders() });
  }

  const headers = new Headers();
  const range = request.headers.get("Range");
  const ifRange = request.headers.get("If-Range");
  const ifNoneMatch = request.headers.get("If-None-Match");
  if (range) headers.set("Range", range);
  if (ifRange) headers.set("If-Range", ifRange);
  if (ifNoneMatch) headers.set("If-None-Match", ifNoneMatch);

  const upstream = await fetch(KEEPERFX_WINE_UPSTREAM, {
    method: request.method,
    headers,
    redirect: "follow",
    cf: { cacheEverything: !range, cacheTtl: range ? 0 : 86400 }
  });

  const out = new Headers(upstream.headers);
  for (const [key, value] of Object.entries(corsHeaders())) out.set(key, value);
  out.set("Content-Type", "application/zip");
  out.set("X-Miracle442-KeeperFX-Wine-Proxy", "1");
  out.set("Cache-Control", range || upstream.status === 206 ? "no-store" : "public, max-age=86400");

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, If-Range, If-None-Match, If-Modified-Since",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges, ETag",
    "Access-Control-Max-Age": "86400"
  };
}
