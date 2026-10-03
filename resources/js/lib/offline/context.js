import { router } from '@inertiajs/react';
import { newKey } from './store';

// What the app is showing right now: the signed-in user, the active disaster, and
// a "page session" that changes whenever the user moves to another page. Form
// state lives in the page, so a new page session means the forms were rebuilt
// from server (or cached) data and no longer hold earlier unsent rows.

let page = null;
let session = newKey();
let path = window.location.pathname;

export function trackPages(initialPage) {
    page = initialPage;
    router.on('navigate', (event) => {
        page = event.detail.page;
        const nextPath = new URL(page.url, window.location.origin).pathname;
        if (nextPath !== path) {
            path = nextPath;
            session = newKey();
        }
    });
}

export const currentPage = () => page;
export const currentUser = () => page?.props?.auth?.user ?? null;
export const currentDisaster = () => page?.props?.typhoon?.active ?? null;
export const currentSession = () => session;
