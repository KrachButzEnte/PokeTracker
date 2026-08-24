const SHELL_CACHE = "pokedex-shell-v1";
const RUNTIME_CACHE = "pokedex-runtime-v1";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/db.js",
  "./js/api.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isApiRequest(url) {
  return url.hostname === "pokeapi.co" || url.hostname === "raw.githubusercontent.com";
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;

  if (isApiRequest(url)) {
    // Netzwerk zuerst (frische Daten), bei Fehler/offline auf Cache zurückfallen.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    // App-Shell: Cache zuerst, im Hintergrund aktualisieren.
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, clone));
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
