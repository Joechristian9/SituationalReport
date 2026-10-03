import axios from 'axios';
import { router } from '@inertiajs/react';
import { trackPages, currentPage, currentDisaster, currentSession, currentUser } from './context';
import { QUEUED_MESSAGE, endpointFor, enqueue, mergePayloads, openItemFor } from './queue';
import { removeItem } from './store';
import { needsReloadBeforeSaving, syncNow } from './sync';

const PAGE_CACHE_PREFIX = 'sitrep-pages';
const WARM_EVERY_MS = 30 * 60 * 1000;
// Pages to keep ready for offline use; ones the user can't open are simply skipped.
const OFFLINE_PAGES = [
    'dashboard',
    'situation-reports.index',
    'incident-monitored.index',
    'declaration-usc.index',
    'pre-positioning.index',
    'response-operations.index',
    'assistance.index',
    'admin.dashboard',
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

function appBase() {
    // eslint-disable-next-line no-undef
    const url = typeof Ziggy !== 'undefined' && Ziggy.url ? Ziggy.url : window.location.origin;
    const path = new URL(url, window.location.origin).pathname;
    return path.endsWith('/') ? path : `${path}/`;
}

function offlinePageUrls() {
    return OFFLINE_PAGES.filter((name) => route().has(name)).map((name) => route(name));
}

function lastWarmed() {
    try {
        return Number(sessionStorage.getItem('offline-warmed-at')) || 0;
    } catch {
        return 0;
    }
}

async function warmPages(registration) {
    if (!navigator.onLine || !currentUser() || Date.now() - lastWarmed() < WARM_EVERY_MS) return;
    const worker = registration.active || (await navigator.serviceWorker.ready).active;
    worker?.postMessage({ type: 'warm', urls: offlinePageUrls(), inertiaVersion: currentPage()?.version ?? '' });
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

async function registerServiceWorker() {
    // Production builds only: in dev the assets come from the Vite server. Needs https or localhost.
    if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !window.isSecureContext) return;
    try {
        const base = appBase();
        const registration = await navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
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
    registerServiceWorker();

    window.addEventListener('online', () => syncNow());
    setInterval(() => syncNow(), 30000);
    setTimeout(() => syncNow(), 2000);
}
