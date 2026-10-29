// Offline sign-in. After an online login the phone keeps a slow, salted hash of the password
// (never the password itself), so the app can be unlocked with no internet. The server session
// stays signed in underneath, which is what lets unsent reports send on their own when the
// connection returns. It stops someone who picks up the phone, not someone reading the
// browser's storage directly: that would need the saved data encrypted.

const KEY = 'offline-lock';
const ITERATIONS = 310000; // PBKDF2-SHA256, OWASP 2023
export const IDLE_MS = 15 * 60 * 1000;
export const MAX_TRIES = 5;
const listeners = new Set();

function read() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || null;
    } catch {
        return null;
    }
}

function write(record) {
    try {
        if (record) localStorage.setItem(KEY, JSON.stringify(record));
        else localStorage.removeItem(KEY);
    } catch {
        // Storage blocked: no offline sign-in on this browser.
    }
    listeners.forEach((listener) => listener());
}

const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromBase64 = (text) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
const sameEmail = (record, email) => Boolean(record && email && record.email === email.trim().toLowerCase());

async function derive(password, salt, iterations) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    return toBase64(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

/** Called after an online login. Needs https (or localhost); without it there is no offline sign-in. */
export async function rememberPassword(email, password) {
    if (!globalThis.crypto?.subtle || !email || !password) return;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    write({
        email: email.trim().toLowerCase(),
        salt: toBase64(salt),
        hash: await derive(password, salt, ITERATIONS),
        iterations: ITERATIONS,
        locked: false,
        tries: 0,
        lastActive: Date.now(),
    });
}

/** Logging out, or another account on this phone: its password check must not stay behind. */
export const forgetPassword = () => write(null);

/** Only an account whose password this phone knows can be locked, so nobody is shut out with no way back. */
export const canLock = (email) => sameEmail(read(), email);

/** Locked by hand, or idle longer than IDLE_MS (also across closing and reopening the app). */
export function isLocked(email, { idleLock = true } = {}) {
    const record = read();
    if (!sameEmail(record, email)) return false;
    return record.locked || (idleLock && Date.now() - record.lastActive > IDLE_MS);
}

export function lock() {
    const record = read();
    if (record && !record.locked) write({ ...record, locked: true });
}

/**
 * The person is using the app: push the idle lock back. Writes at most every 30 seconds, and
 * not once the idle time has run out: a tap must not lift a lock that is just about to show.
 */
export function noteActivity() {
    const record = read();
    const idle = record ? Date.now() - record.lastActive : 0;
    if (record && !record.locked && idle > 30000 && idle < IDLE_MS) {
        try {
            localStorage.setItem(KEY, JSON.stringify({ ...record, lastActive: Date.now() }));
        } catch {
            // Storage blocked.
        }
    }
}

export const triesLeft = () => Math.max(0, MAX_TRIES - (read()?.tries ?? 0));

/** 'ok', 'wrong' or 'blocked' (too many wrong tries: only an online sign-in opens it now). */
export async function unlock(password) {
    const record = read();
    if (!record || record.tries >= MAX_TRIES) return 'blocked';
    const matches = (await derive(password, fromBase64(record.salt), record.iterations)) === record.hash;
    if (matches) {
        write({ ...record, locked: false, tries: 0, lastActive: Date.now() });
        return 'ok';
    }
    const tries = record.tries + 1;
    write({ ...record, locked: true, tries });
    return tries >= MAX_TRIES ? 'blocked' : 'wrong';
}

export function subscribeLock(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
