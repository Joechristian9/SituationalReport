// Offline queue persisted in IndexedDB, so saves survive a reload or a closed tab.

const DB_NAME = 'sitrep-offline';
const STORE = 'queue';
const listeners = new Set();

function open() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function run(mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(request?.result);
        tx.onerror = () => reject(tx.error);
    });
}

function changed() {
    listeners.forEach((listener) => listener());
}

export function allItems() {
    return run('readonly', (store) => store.getAll()).then((items) => items.sort((a, b) => a.savedAt - b.savedAt));
}

export async function putItem(item) {
    await run('readwrite', (store) => store.put(item));
    changed();
}

export async function removeItem(id) {
    await run('readwrite', (store) => store.delete(id));
    changed();
}

/** Called whenever the queue changes; returns an unsubscribe function. */
export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function newKey() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    // randomUUID needs a secure context (https or localhost); LAN http falls back here.
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
}
