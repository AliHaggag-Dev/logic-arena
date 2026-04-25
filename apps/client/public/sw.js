/* ============================================================
   Logic Arena — Service Worker v2.2.0
   Strategy: Network-first → Cache fallback
   ============================================================ */

const CACHE_NAME = "logic-arena-v2.2.0";

const PRECACHE_ASSETS = [
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Never cache these patterns
const BYPASS_PATTERNS = [
  /^\/api\//,
  /^\/socket\.io\//,
  /^wss?:\/\//,
  /^https?:\/\/[^/]+\/api\//,
  /\/_next\/webpack-hmr/,
];

// ── Install: pre-cache critical shell assets ──────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: evict old caches ────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: network-first, fallback to cache ───────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Bypass non-http(s) schemes
  if (!url.protocol.startsWith("http")) return;

  // Bypass API / socket patterns
  const shouldBypass = BYPASS_PATTERNS.some((pattern) =>
    pattern.test(url.pathname) || pattern.test(request.url)
  );
  if (shouldBypass) return;

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    // Cache successful GET responses (not opaque)
    if (networkResponse && networkResponse.status === 200 && networkResponse.type !== "opaque") {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Network failed — try cache
    const cached = await cache.match(request);
    if (cached) return cached;

    // Ultimate fallback for navigation requests
    if (request.mode === "navigate") {
      const offlinePage = await cache.match("/offline.html");
      if (offlinePage) return offlinePage;
    }

    // Nothing available
    return new Response("Network error", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
