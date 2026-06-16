// ─── DIETA PWA — Service Worker ──────────────────────────────────────────────
const CACHE_NAME = "dieta-v1";

// Arquivos que queremos cachear para funcionar offline
const STATIC_ASSETS = [
  "/dieta-app/",
  "/dieta-app/index.html",
  "/dieta-app/manifest.json",
  "/dieta-app/icons/icon-192x192.png",
  "/dieta-app/icons/icon-512x512.png",
];

// ─── INSTALL: pré-cacheia os assets estáticos ─────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATE: remove caches antigos ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── FETCH: Network First para Firebase, Cache First para assets ──────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Firebase e APIs externas: sempre rede, sem cache
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis.com")
  ) {
    return; // deixa passar direto
  }

  // Assets estáticos: Cache First (app funciona offline)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Só cacheia respostas válidas de origem própria
          if (
            response.status === 200 &&
            url.origin === self.location.origin
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline e sem cache: retorna index.html (SPA fallback)
          if (event.request.mode === "navigate") {
            return caches.match("/dieta-app/index.html");
          }
        });
    })
  );
});
