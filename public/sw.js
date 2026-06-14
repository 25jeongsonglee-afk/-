const CACHE_NAME = "meister-sarambook-cache-v1";
const OFFLINE_URL = "/offline.html";

// Assets to cache immediately on startup (App Shell)
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/offline.html",
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

// 3. Fetch event (Robust caching strategy: Network-First for HTML/Nav safely avoiding stale references)
self.addEventListener("fetch", (event) => {
  // Only handle HTTP/HTTPS protocols with GET method for caching
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Skip caching for backend API requests to ensure real-time operation
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // AVOID stale index.html reference bugs:
  // For navigation & HTML requests, ALWAYS go to Network first, and fallback to cached `/offline.html` if offline.
  // DO NOT write the dynamic / index.html to the cache, preventing loading obsolete bundle hashes.
  if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match("/offline.html") || caches.match("/");
        })
    );
    return;
  }

  // Dynamic Cache-First or Network-First for static assets (images, icons, bundle files)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cache immediately if available, but fetch and update cache in the background (Stale-While-Revalidate)
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, still have cached response
        });

      return cachedResponse || networkFetch;
    })
  );
});
