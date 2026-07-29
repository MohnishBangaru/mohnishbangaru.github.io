/*
 * Service worker.
 *
 * Strategy is split by request type so that shipping an update is never
 * blocked on bumping CACHE_NAME:
 *   - navigations  -> network first, cache as fallback (always fresh HTML)
 *   - static files -> stale-while-revalidate (instant, refreshes in background)
 */

// Bumped for the new profile photo: the filename is unchanged, so returning
// visitors would otherwise be served the previous image from the old cache.
const CACHE_NAME = 'mohnish-portfolio-v41';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/assets/profile.webp',
  '/assets/gradient-bg.webp',
  '/assets/mb-logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Added one at a time: cache.addAll() rejects the whole install if any
      // single URL 404s, which would leave the site with no cache at all.
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[sw] skipped precaching', url, err);
          })
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Leave anything we cannot safely replay alone: non-GET, cross-origin
  // (analytics, fonts), and range requests (PDF/media seeking).
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;
  if (request.headers.has('range')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/** Always try the network so a redeploy is visible on the next load. */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return (await cache.match(request)) || (await cache.match('/index.html')) || Response.error();
  }
}

/** Serve from cache immediately, then refresh the entry for next time. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || (await network) || Response.error();
}
