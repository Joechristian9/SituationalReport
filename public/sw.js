/*
 * Service worker: lets the app open and show forms with no internet.
 *
 * - Built assets (/build/*, hashed file names): cache first. Files from earlier deploys
 *   are deleted when a new version is cached, so the cache does not grow on every release.
 * - Pages and JSON data: network first, so online use is always live; the last copy is
 *   kept for when the network is gone, or used when a weak signal takes too long.
 * - Saves (POST) are never touched here; the app queues them itself.
 *
 * Full HTML pages and Inertia page data live in separate caches. They share one URL, and
 * the Cache API keeps a single response per URL, so one used to overwrite the other: the
 * app then opened with no connection only if the last thing cached happened to be HTML.
 *
 * Reopening the app after closing it loads a full page, which only a few pages have saved as
 * HTML (moving between pages saves data only): see rebuildPage for how the rest still open.
 */
const VERSION = 'v2';
const ASSETS = `sitrep-assets-${VERSION}`;
// Both page caches start with "sitrep-pages": the app clears them by that prefix on logout.
const PAGES = `sitrep-pages-${VERSION}`; // full HTML documents: opening the app with no connection
const DATA = `sitrep-pages-data-${VERSION}`; // Inertia page data and JSON: moving between pages offline
const MAX_PAGES = 40;
const MAX_DATA = 120;
// Longest to wait on the network when a saved copy exists (a weak signal can hang for minutes).
const NETWORK_TIMEOUT = 8000;
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

        // Hashed names never come back, so files from earlier deploys are dead weight.
        const current = new Set([...files].map((file) => `${BASE}build/${file}`));
        for (const request of await cache.keys()) {
            const { pathname } = new URL(request.url);
            if (pathname.startsWith(`${BASE}build/`) && !current.has(pathname)) await cache.delete(request);
        }
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
            .then((keys) => Promise.all(keys.filter((key) => key.startsWith('sitrep-') && ![ASSETS, PAGES, DATA].includes(key)).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

function cacheable(response) {
    if (!response || !response.ok || response.redirected || response.type !== 'basic') return false;
    const type = response.headers.get('Content-Type') || '';
    // Pages and JSON data only: never PDFs, Excel exports or other downloads.
    return type.includes('text/html') || type.includes('application/json');
}

/** Keep only the newest `max` entries (a cache lists its entries oldest first). */
async function trim(cache, max) {
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key, { ignoreVary: true })));
}

async function remember(cache, request, response, max) {
    await cache.put(request, response);
    await trim(cache, max);
}

// Addresses a phone shortcut or restored tab may reopen on. With no saved copy of their own
// they open the saved home page instead of the offline page.
const ENTRY_PATHS = [BASE, `${BASE}login`];
const HOME_PATHS = [`${BASE}situation-reports`, `${BASE}dashboard`];

const escapeAttribute = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Put an Inertia page (JSON) into saved page HTML, in either way Inertia embeds it. */
function withPageData(html, json) {
    const attribute = /(<div id="app" data-page=")[^"]*(")/;
    if (attribute.test(html)) return html.replace(attribute, (_, open, close) => open + escapeAttribute(json) + close);
    const element = /(<script data-page="app" type="application\/json">)[\s\S]*?(<\/script>)/;
    return html.replace(element, (_, open, close) => open + json.replace(/</g, '\\u003C') + close);
}

/**
 * Opening the app after it was closed is a full page load, but moving between pages only saved
 * page data, so most pages have no HTML of their own. Build one from a saved page plus the page's
 * saved data (all scripts are cached, so the app renders it), or open the home page for the
 * entry addresses. Returns nothing when there is nothing saved to build from.
 */
async function rebuildPage(request) {
    const pages = await caches.open(PAGES);
    let shell;
    for (const path of HOME_PATHS) {
        shell = shell || (await pages.match(path, { ignoreVary: true }));
    }
    if (!shell) {
        const [first] = await pages.keys();
        shell = first && (await pages.match(first, { ignoreVary: true }));
    }
    if (!shell) return null;

    const saved = await (await caches.open(DATA)).match(request, { ignoreVary: true });
    const json = saved ? await saved.clone().text() : '';
    let hasPage = false;
    try {
        hasPage = Boolean(JSON.parse(json).component);
    } catch {
        // Not page data (plain JSON saved under the same address): treat as not saved.
    }
    if (hasPage) {
        return new Response(withPageData(await shell.clone().text(), json), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return ENTRY_PATHS.includes(new URL(request.url).pathname) ? shell.clone() : null;
}

async function networkFirst(event, request, isPage) {
    const cache = await caches.open(isPage ? PAGES : DATA);
    const cached = await cache.match(request, { ignoreVary: true });
    const network = fetch(request).then((response) => {
        // waitUntil keeps the worker alive until the copy is saved, even after the page has its response.
        if (cacheable(response)) event.waitUntil(remember(cache, request, response.clone(), isPage ? MAX_PAGES : MAX_DATA).catch(() => {}));
        return response;
    });

    try {
        if (!cached) return await network;
        // A signal that is up but weak can hang for minutes: with a saved copy, stop waiting.
        network.catch(() => {});
        const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), NETWORK_TIMEOUT));
        return await Promise.race([network, timeout]);
    } catch {
        if (cached) return cached;
        if (isPage) {
            const rebuilt = await rebuildPage(request).catch(() => null);
            if (rebuilt) return rebuilt;
            const offline = await caches.match(OFFLINE_URL);
            if (offline) return offline;
        }
        // A page the app asked for but never saved: have Inertia load it as a normal page
        // visit, which ends on the offline page (listing what is available) instead of an error box.
        if (request.headers.has('X-Inertia')) {
            return new Response('', { status: 409, headers: { 'X-Inertia-Location': request.url } });
        }
        // Same failure the page would see with no service worker, without the
        // "Uncaught (in promise)" console error from rethrowing inside the worker.
        return Response.error();
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
    event.respondWith(networkFirst(event, request, request.mode === 'navigate'));
});

// The app asks for the form pages to be cached while online: as a full page (for opening the
// app offline), as Inertia data (for moving between pages offline) and, for `jsonUrls`, as
// plain JSON (field suggestions and similar data the forms load).
async function warm(urls, jsonUrls, inertiaVersion) {
    const pages = await caches.open(PAGES);
    const data = await caches.open(DATA);
    await precacheBuild();
    let saved = 0;

    for (const url of urls) {
        try {
            const page = new Request(url, { credentials: 'same-origin' });
            const pageResponse = await fetch(page);
            const pageOk = cacheable(pageResponse);
            if (pageOk) await pages.put(page, pageResponse);

            const inertia = new Request(url, {
                credentials: 'same-origin',
                headers: {
                    'X-Inertia': 'true',
                    'X-Inertia-Version': inertiaVersion || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'text/html, application/xhtml+xml',
                },
            });
            const dataResponse = await fetch(inertia);
            const dataOk = cacheable(dataResponse);
            if (dataOk) await data.put(inertia, dataResponse);
            if (pageOk && dataOk) saved += 1;
        } catch {
            // Lost the connection part-way: the rest is cached on the next visit.
        }
    }

    for (const url of jsonUrls) {
        try {
            const request = new Request(url, { credentials: 'same-origin', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
            const response = await fetch(request);
            if (cacheable(response)) await data.put(request, response);
        } catch {
            // Optional data: forms work without it.
        }
    }

    await Promise.all([trim(pages, MAX_PAGES), trim(data, MAX_DATA)]);

    // Tell the open pages, so the app can say it is ready to work offline.
    const windows = await self.clients.matchAll({ type: 'window' });
    windows.forEach((client) => client.postMessage({ type: 'warmed', pages: saved, total: urls.length, at: Date.now() }));
}

self.addEventListener('message', (event) => {
    if (event.data?.type === 'warm') event.waitUntil(warm(event.data.urls || [], event.data.jsonUrls || [], event.data.inertiaVersion));
});
