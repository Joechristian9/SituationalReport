/*
 * Service worker: lets the app open and show forms with no internet.
 *
 * - Built assets (/build/*, hashed file names): cache first.
 * - Pages and JSON data: network first, so online use is always live; the last
 *   copy is kept for when the network is gone.
 * - Saves (POST) are never touched here; the app queues them itself.
 */
const VERSION = 'v1';
const ASSETS = `sitrep-assets-${VERSION}`;
const PAGES = `sitrep-pages-${VERSION}`;
const BASE = new URL(self.registration.scope).pathname;
const OFFLINE_URL = `${BASE}offline.html`;

async function precacheBuild() {
    try {
        const response = await fetch(`${BASE}build/manifest.json`, { cache: 'no-store' });
        if (!response.ok) return;
        const manifest = await response.json();
        const files = new Set();
        Object.values(manifest).forEach((entry) => {
            files.add(entry.file);
            (entry.css || []).forEach((file) => files.add(file));
            (entry.assets || []).forEach((file) => files.add(file));
        });
        const cache = await caches.open(ASSETS);
        await Promise.all(
            [...files].map(async (file) => {
                const url = `${BASE}build/${file}`;
                if (!(await cache.match(url))) await cache.add(url).catch(() => {});
            }),
        );
    } catch {
        // Offline during install: assets are cached as they are used instead.
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(ASSETS)
            .then((cache) => cache.add(OFFLINE_URL))
            .then(precacheBuild)
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key.startsWith('sitrep-') && ![ASSETS, PAGES].includes(key)).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

function cacheable(response) {
    if (!response || !response.ok || response.redirected || response.type !== 'basic') return false;
    const type = response.headers.get('Content-Type') || '';
    // Pages and JSON data only: never PDFs, Excel exports or other downloads.
    return type.includes('text/html') || type.includes('application/json');
}

async function networkFirst(request, isPage) {
    const cache = await caches.open(PAGES);
    try {
        const response = await fetch(request);
        if (cacheable(response)) cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        if (isPage) {
            const offline = await caches.match(OFFLINE_URL);
            if (offline) return offline;
        }
        throw error;
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) (await caches.open(ASSETS)).put(request, response.clone());
    return response;
}

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
    if (url.pathname === `${BASE}sw.js` || url.pathname === `${BASE}build/manifest.json`) return;
    // Partial reloads (live refresh) return only some props; caching one under the page
    // URL would later open that page offline with most of its data missing.
    if (request.headers.has('X-Inertia-Partial-Data') || request.headers.has('X-Inertia-Partial-Except')) return;

    if (url.pathname.startsWith(`${BASE}build/`)) {
        event.respondWith(cacheFirst(request));
        return;
    }
    event.respondWith(networkFirst(request, request.mode === 'navigate'));
});

// The app asks for the form pages to be cached while online, both as a full page
// (for opening the app offline) and as Inertia data (for moving between pages offline).
async function warm(urls, inertiaVersion) {
    const cache = await caches.open(PAGES);
    await precacheBuild();
    for (const url of urls) {
        try {
            const page = new Request(url, { credentials: 'same-origin' });
            const pageResponse = await fetch(page);
            if (cacheable(pageResponse)) await cache.put(page, pageResponse);

            const data = new Request(url, {
                credentials: 'same-origin',
                headers: {
                    'X-Inertia': 'true',
                    'X-Inertia-Version': inertiaVersion || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'text/html, application/xhtml+xml',
                },
            });
            const dataResponse = await fetch(data);
            if (cacheable(dataResponse)) await cache.put(data, dataResponse);
        } catch {
            // Lost the connection part-way: the rest is cached on the next visit.
        }
    }
}

self.addEventListener('message', (event) => {
    if (event.data?.type === 'warm') event.waitUntil(warm(event.data.urls || [], event.data.inertiaVersion));
});
