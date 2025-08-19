// Vite SPA + Firebase-friendly service worker
const CACHE_PREFIX = "tracker-cache";
const CACHE_VERSION = "v2";
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

const APP_SHELL = [
  "/",                // SPA entry
  "/index.html",
  "/manifest.webmanifest",
  // Icons (optional; add if you want them precached)
  // "/icons/icon-192.png",
  // "/icons/icon-512.png",
];

// Helper: same-origin check
const sameOrigin = (url) => new URL(url).origin === self.location.origin;

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: SPA-friendly routing + caching strategies
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== "GET") return;

  // Don’t touch cross-origin (Firebase/Auth/analytics/CDNs)
  if (!sameOrigin(req.url)) return;

  // Navigation requests (address bar, links) → serve index.html (SPA fallback)
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Network-first so HTML updates deploy immediately
          const fresh = await fetch("/index.html", { cache: "no-store" });
          const cache = await caches.open(CACHE_NAME);
          cache.put("/index.html", fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match("/index.html");
          return cached || new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })()
    );
    return;
  }

  // Static assets (same-origin): stale-while-revalidate
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);

      const fetchAndUpdate = fetch(req)
        .then((resp) => {
          // Cache successful, basic/opaque GET responses
          if (resp && resp.status === 200 && (resp.type === "basic" || resp.type === "opaque")) {
            cache.put(req, resp.clone());
          }
          return resp;
        })
        .catch(() => null);

      // Return cached immediately if present; otherwise wait for network
      return cached || (await fetchAndUpdate) || new Response("Offline", { status: 503 });
    })()
  );
});
