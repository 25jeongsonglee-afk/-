const CACHE_NAME = "meister-sarambook-cache-v1";
const OFFLINE_URL = "/offline.html";

// Assets to cache immediately on startup (App Shell)
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// 1. Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Prefetching App Shell cache...");
      // Try to cache all initial assets
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn("[Service Worker] Cache prefetch error on some assets, carrying on anyway: ", err);
      });
    })
  );
  // Force active service worker immediately
  self.skipWaiting();
});

// 2. Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch event (Network-First falling back to static cache)
self.addEventListener("fetch", (event) => {
  // Only handle HTTP/HTTPS protocols (avoid chrome-extension issues, Firebase SDK internal requests etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Optimize fetch handle
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If response is valid, put a copy of it in the cache for offline fallback
        if (response && response.status === 200 && response.type === "basic" && event.request.method === "GET") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network request failed - try fetching from Cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to offline indicator for HTML page requests if Cache misses
          if (event.request.mode === "navigate" || event.request.headers.get("accept").includes("text/html")) {
            return caches.match("/offline.html") || caches.match("/");
          }
        });
      })
  );
});
