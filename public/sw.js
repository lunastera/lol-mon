// Cache-first proxy for Data Dragon images. Once an image has been
// displayed — or pre-downloaded from the home screen (app/lib/imageCache.ts)
// — it is served from the user's local Cache Storage without hitting the CDN.
const IMAGE_CACHE = "ddragon-images";
const CDN_PREFIX = "https://ddragon.leagueoflegends.com/cdn/";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(CDN_PREFIX)) return;
  event.respondWith(
    caches.open(IMAGE_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    }),
  );
});
