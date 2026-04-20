// GrindKit service worker — push + conservative static cache.
//
// We intentionally DO NOT cache authed pages or API responses. Caching
// those on a shared device would mean a second user lands on the first
// user's rendered HTML. Only bundles/icons/manifest get cached so the
// shell still loads when offline.

const CACHE = "grindkit-static-v2";

const STATIC_PRECACHE = ["/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(STATIC_PRECACHE).catch(() => {
        // best-effort
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isCacheableStatic(url) {
  if (!url.origin.startsWith(self.location.origin)) return false;
  const p = url.pathname;
  return (
    p.startsWith("/_next/static/") ||
    p === "/icon.svg" ||
    p === "/manifest.webmanifest" ||
    p === "/favicon.ico"
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!isCacheableStatic(url)) return; // let network handle authed HTML / API

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      });
    })
  );
});

// Web Push handler.
self.addEventListener("push", (event) => {
  let data = { title: "GrindKit", body: "You have a new notification." };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: data.tag || "grindkit",
    data: { url: data.url || "/app" },
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/app";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(target);
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
