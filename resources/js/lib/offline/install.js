import axios from 'axios';
import { router } from '@inertiajs/react';
import { trackPages, currentPage, currentDisaster, currentSession, currentUser } from './context';
import { QUEUED_MESSAGE, endpointFor, enqueue, mergePayloads, openItemFor } from './queue';
import { removeItem } from './store';
import { forgetPassword } from './lock';
import { canRefreshWithoutLosingEdits, needsReloadBeforeSaving, refreshPage, subscribeSync, syncNow } from './sync';

const PAGE_CACHE_PREFIX = 'sitrep-pages';
const WARM_EVERY_MS = 30 * 60 * 1000;
// Pages to keep ready for offline use; ones the user can't open are simply skipped.
const OFFLINE_PAGES = [
    'situation-reports.index',
    'declaration-usc.index',
    'pre-positioning.index',
    'response-operations.index',
    'assistance.index',
    'assistance-extendeds.index',
];
// JSON the forms load when they open (field suggestions and the like), so they work offline too.
const OFFLINE_JSON = [
    'api.disaster.active',
    'communication-services.index',
    ...[
        'weather', 'water-level', 'electricity', 'water-service', 'communication', 'road', 'bridge', 'pre-emptive',
        'pre-positioning', 'incident-monitored', 'casualties', 'injured', 'missing', 'affected-tourists', 'damaged-houses',
        'usc-declaration', 'response-operations', 'assistance-extended', 'agriculture', 'suspension-classes', 'suspension-work',
    ].map((form) => `modifications.${form}`),
];

const isInertia = (config) => Boolean(config?.headers?.['X-Inertia'] ?? config?.headers?.get?.('X-Inertia'));
const parse = (data) => {
    if (typeof data !== 'string') return data ?? {};
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
};
const reloadRequired = () => window.dispatchEvent(new CustomEvent('offline:reload-required'));

function installAxios() {
    // Online save while an unsent offline save for the same form exists.
    axios.interceptors.request.use(async (config) => {
        const path = config.method === 'post' && !config.offlineSync && !isInertia(config) ? endpointFor(config.url) : null;
        if (!path) return config;

        if (needsReloadBeforeSaving(path)) {
            reloadRequired();
            throw Object.assign(new Error('Reload the page before saving again: your offline report for this form was just sent.'), {
                offlineReloadRequired: true,
            });
        }

        const user = currentUser();
        const pending = user ? await openItemFor(path, user.id) : null;
        if (pending && pending.disasterId === (currentDisaster()?.id ?? null)) {
            // Same page: this save already includes the pending rows, so it replaces them.
            // Another page: send the pending rows along with this save.
            if (pending.session !== currentSession()) {
                config.data = mergePayloads(pending.payload, parse(config.data) ?? {});
            }
            config.offlineSupersedes = pending.id;
        }
        return config;
    });

    axios.interceptors.response.use(
        async (response) => {
            if (response.config?.offlineSupersedes) await removeItem(response.config.offlineSupersedes);
            return response;
        },
        async (error) => {
            const config = error.config;
            const unreachable = !error.response && !axios.isCancel(error) && !error.offlineReloadRequired;
            const path = config?.method === 'post' && !config.offlineSync && !isInertia(config) ? endpointFor(config.url) : null;
            const payload = path && unreachable ? parse(config.data) : null;
            if (!payload) return Promise.reject(error);

            await enqueue({ url: config.url, payload, replacesPending: config.offlineSupersedes });
            // Forms treat this like a successful save and show the message.
            return { data: { queued: true, message: QUEUED_MESSAGE }, status: 202, statusText: 'Saved offline', headers: {}, config };
        },
    );
}

function installInertia() {
    router.on('before', (event) => {
        const visit = event.detail.visit;
        const path = visit.method === 'post' ? endpointFor(visit.url.href) : null;
        if (!path) return undefined;

        if (needsReloadBeforeSaving(path)) {
            reloadRequired();
            return false;
        }
        if (!navigator.onLine) {
            enqueue({ url: visit.url.href, payload: visit.data });
            return false;
        }
        return undefined;
    });

    // The device thinks it is online but the request never reached the server.
    router.on('exception', (event) => {
        const error = event.detail.exception;
        const config = error?.config;
        const path = !error?.response && config?.method === 'post' ? endpointFor(config.url) : null;
        const payload = path ? parse(config.data) : null;
        if (!payload) return undefined;

        enqueue({ url: config.url, payload });
        return false;
    });

    router.on('navigate', () => syncNow());
}

// After offline saves from this page are sent, its forms must reload to learn the new
// row ids. Do it automatically unless the user has typed since; then OfflineStatus asks.
function refreshAfterSync() {
    let wasRunning = false;
    subscribeSync((sync) => {
        const finished = wasRunning && !sync.running;
        wasRunning = sync.running;
        if (finished && sync.reloadNeeded && canRefreshWithoutLosingEdits()) refreshPage();
    });
}

function appBase() {
    // eslint-disable-next-line no-undef
    const url = typeof Ziggy !== 'undefined' && Ziggy.url ? Ziggy.url : window.location.origin;
    const path = new URL(url, window.location.origin).pathname;
    return path.endsWith('/') ? path : `${path}/`;
}

function offlinePageUrls() {
    // Only admins have a dashboard page; for everyone else that URL just redirects.
    const isAdmin = currentUser()?.roles?.some((role) => role.name === 'admin');
    return [...(isAdmin ? ['dashboard'] : []), ...OFFLINE_PAGES].filter((name) => route().has(name)).map((name) => route(name));
}

const offlineJsonUrls = () => OFFLINE_JSON.filter((name) => route().has(name)).map((name) => route(name));

/** The worker says when the pages are saved, so the app can tell the user it is ready for offline use. */
function listenForWarmed() {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type !== 'warmed') return;
        try {
            localStorage.setItem('offline-ready', JSON.stringify({ userId: currentUser()?.id ?? null, at: event.data.at, pages: event.data.pages }));
        } catch {
            // Storage blocked: the message below is still shown this time.
        }
        window.dispatchEvent(new CustomEvent('offline:ready', { detail: event.data }));
    });
}

function lastWarmed() {
    try {
        return Number(sessionStorage.getItem('offline-warmed-at')) || 0;
    } catch {
        return 0;
    }
}

async function warmPages(registration, force = false) {
    if (!navigator.onLine || !currentUser() || (!force && Date.now() - lastWarmed() < WARM_EVERY_MS)) return;
    const worker = registration.active || (await navigator.serviceWorker.ready).active;
    worker?.postMessage({ type: 'warm', urls: offlinePageUrls(), jsonUrls: offlineJsonUrls(), inertiaVersion: currentPage()?.version ?? '' });
    try {
        sessionStorage.setItem('offline-warmed-at', String(Date.now()));
    } catch {
        // Private mode: warming again next time is harmless.
    }
}

/** Remove cached pages (they hold the signed-in user's data). Queued saves are kept. */
export async function clearOfflinePages() {
    if (!('caches' in window)) return;
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(PAGE_CACHE_PREFIX)).map((key) => caches.delete(key)));
}

/**
 * Log out of this device (needs internet). Only once the server has logged the user out are the
 * saved pages and the offline password check removed: if the request fails, the user is still
 * signed in and keeps both. Unsent reports stay and are sent after the next login.
 */
export function logOut(options = {}) {
    router.post(route('logout'), {}, {
        ...options,
        onSuccess: async () => {
            await clearOfflinePages();
            forgetPassword();
            // Full page load so the next login starts with a fresh CSRF token.
            window.location.href = '/';
        },
    });
}

function forgetPagesOnUserChange() {
    const id = String(currentUser()?.id ?? '');
    try {
        const last = localStorage.getItem('offline-user');
        if (id && last && last !== id) clearOfflinePages();
        if (id) localStorage.setItem('offline-user', id);
    } catch {
        // Storage blocked: pages are still cleared on logout.
    }
}

/**
 * Ask the browser not to clear saved pages and unsent reports when the phone runs low on
 * space. Chrome, Edge and Safari decide silently; Firefox shows a prompt, so ask only in
 * the installed app or once a report has actually been saved offline.
 */
async function keepOfflineData() {
    try {
        if (!navigator.storage?.persist || (await navigator.storage.persisted())) return;
        await navigator.storage.persist();
    } catch {
        // Not granted: data is kept as long as the browser has room.
    }
}

const runningInstalled = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

async function registerServiceWorker() {
    // Production builds only: in dev the assets come from the Vite server. Needs https or localhost.
    if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !window.isSecureContext) return;
    try {
        const base = appBase();
        const updating = Boolean(navigator.serviceWorker.controller);
        const registration = await navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
        // A new worker deletes the old worker's caches when it takes over, including pages the
        // old one just saved for this session: save them again into the new worker's caches.
        if (updating) navigator.serviceWorker.addEventListener('controllerchange', () => warmPages(registration, true), { once: true });
        listenForWarmed();
        warmPages(registration);
        router.on('navigate', () => warmPages(registration));
    } catch {
        // Offline opening is a bonus; forms still queue without the service worker.
    }
}

export function installOffline(initialPage) {
    trackPages(initialPage);
    forgetPagesOnUserChange();
    router.on('navigate', forgetPagesOnUserChange);
    installAxios();
    installInertia();
    refreshAfterSync();
    registerServiceWorker();
    if (runningInstalled()) keepOfflineData();
    window.addEventListener('offline:queued', keepOfflineData);

    window.addEventListener('online', () => syncNow());
    setInterval(() => syncNow(), 30000);
    setTimeout(() => syncNow(), 2000);
}
