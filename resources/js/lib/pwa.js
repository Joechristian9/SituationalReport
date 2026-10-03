// "Download app" support. Chrome/Edge/Samsung fire beforeinstallprompt once, early,
// when the site is installable (manifest + service worker + https); it is caught
// here at startup so a button rendered later can still use it. iPhone Safari never
// fires it, so iPhone users get Add to Home Screen instructions instead.

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // show our own button instead of the browser's mini bar
    deferredPrompt = event;
    notify();
});

window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
});

export const isInstalled = () =>
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

export const isIos = () =>
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

export const canPromptInstall = () => deferredPrompt !== null;

/** Opens the browser's install dialog; resolves true if the user accepted. */
export async function promptInstall() {
    if (!deferredPrompt) return false;
    const prompt = deferredPrompt;
    deferredPrompt = null;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    notify();
    return outcome === 'accepted';
}

export function subscribeInstall(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
