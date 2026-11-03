// FleetPulse Service Worker — PWA Offline Shell & Caching
const CACHE_NAME = "fleetpulse-cache-v1"
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/favicon.svg",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[SW] Pre-cache warning:", err)
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return

  const url = new URL(event.request.url)

  // Skip chrome-extension and external analytics
  if (url.protocol !== "http:" && url.protocol !== "https:") return

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache valid static responses
        if (
          networkResponse.status === 200 &&
          (url.pathname.startsWith("/_next/static/") ||
            url.pathname.endsWith(".css") ||
            url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".svg") ||
            url.pathname === "/")
        ) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return networkResponse
      })
      .catch(async () => {
        // Fallback to cache when offline
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) return cachedResponse

        // If root page requested while offline, return cached root
        if (event.request.mode === "navigate") {
          const rootCached = await caches.match("/")
          if (rootCached) return rootCached
        }

        return new Response("Offline - FleetPulse requires an internet connection for this action", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({ "Content-Type": "text/plain" }),
        })
      })
  )
})
