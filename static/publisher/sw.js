const CACHE_NAME = "jellyfish-publisher-v2";
const APP_SHELL = [
  "/publisher/",
  "/publisher/index.html",
  "/publisher/styles.css",
  "/publisher/app.js",
  "/publisher/manifest.webmanifest",
  "/publisher/icon-192.png",
  "/publisher/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.hostname === "api.github.com") {
    return;
  }

  if (event.request.mode === "navigate" && url.pathname.startsWith("/publisher")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/publisher/", copy));
          return response;
        })
        .catch(() => caches.match("/publisher/"))
    );
    return;
  }

  if (url.pathname.startsWith("/publisher/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
