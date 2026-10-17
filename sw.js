/* AK Garage — offline shell for the command center.
 * Keeps the dashboard installable and shows the last records it managed to
 * fetch when the phone loses signal. Reads are cached; writes never are.
 */
const VERSION = 'v2';
const SHELL_CACHE = `ak-garage-shell-${VERSION}`;
const DATA_CACHE = `ak-garage-data-${VERSION}`;

const SHELL_FILES = [
  './index.html',
  './supabase-client.js',
  './auth-gate.js',
  './manifest.webmanifest',
  './assets/hero-car.jpg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(SHELL_FILES.map(async (file) => {
      try {
        const response = await fetch(file, { cache: 'reload' });
        if (response.ok) await cache.put(file, response);
      } catch (error) {
        // A missing optional asset must not block the install.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, DATA_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

function isDataRequest(url) {
  return url.pathname.includes('/rest/v1/') || url.hostname.endsWith('.supabase.co');
}

function isSvgDoc(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function tag(response) {
  // Lets the page (and DevTools) tell a cached reply apart from a live one.
  try {
    const headers = new Headers(response.headers);
    headers.set('X-AK-Offline', '1');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch (error) {
    return response;
  }
}

function offlineJSON() {
  return new Response(JSON.stringify({ message: 'offline and not cached yet' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json', 'X-AK-Offline': '1' }
  });
}

async function networkFirst(request, cacheName, fallbackUrl) {
  try {
    const response = await fetch(request);
    // The Cache API only stores GET requests, so HEAD count queries stay live-only.
    if (request.method === 'GET' && response && (response.ok || response.type === 'cors')) {
      const copy = response.clone();
      const fallbackCopy = fallbackUrl ? response.clone() : null;
      caches.open(cacheName).then(async (cache) => {
        await cache.put(request, copy).catch(() => {});
        // Keep the offline dashboard copy in step with what was just served.
        if (fallbackCopy) await cache.put(fallbackUrl, fallbackCopy).catch(() => {});
      }).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return tag(cached);
    if (fallbackUrl) {
      const shell = await caches.match(fallbackUrl);
      if (shell) return tag(shell);
    }
    if (isDataRequest(new URL(request.url))) return offlineJSON();
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const copy = response.clone();
    caches.open(cacheName).then((cache) => cache.put(request, copy)).catch(() => {});
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const network = fetch(request).then((response) => {
    if (response && (response.ok || response.type === 'opaque')) {
      const copy = response.clone();
      caches.open(cacheName).then((cache) => cache.put(request, copy)).catch(() => {});
    }
    return response;
  }).catch(() => null);
  if (cached) return cached;
  const response = await network;
  if (response) return response;
  throw new Error('offline');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' && request.method !== 'HEAD') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.origin === self.location.origin && url.pathname.endsWith('/sw.js')) return;

  if (isDataRequest(url)) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }
  if (url.origin === self.location.origin) {
    if (isSvgDoc(request)) {
      // Only the dashboard falls back to itself; other pages must not show it.
      const isDashboard = url.pathname === '/' || url.pathname.endsWith('/index.html');
      event.respondWith(networkFirst(request, SHELL_CACHE, isDashboard ? './index.html' : null));
      return;
    }
    // Code and manifests are network-first so a deploy is never served stale;
    // images can come straight from cache.
    event.respondWith(request.destination === 'image'
      ? cacheFirst(request, SHELL_CACHE)
      : networkFirst(request, SHELL_CACHE));
    return;
  }
  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
});
