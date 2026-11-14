// The accounts this phone remembers, so they can log in here with no internet.
//
// After a login the server accepted, the phone keeps for that account: a slow, salted hash of
// the password (never the password itself), the account as the pages see it, and the server's
// stamp for it, which changes when the password does (see staleAccounts.js). This survives
// logout, for any number of accounts, with no expiry.
//
// It stops someone who picks up the phone, not someone reading the browser's storage directly:
// that would need the saved data encrypted.

const KEY = 'offline-accounts';
const OLD_LOCK_KEY = 'offline-lock';
// Whose rows the service worker's saved pages hold: only that account sees them offline.
const PAGES_OWNER_KEY = 'offline-user';
const PAGE_CACHE_PREFIX = 'sitrep-pages';
const ITERATIONS = 310000; // PBKDF2-SHA256, OWASP 2023
export const MAX_TRIES = 5;
const listeners = new Set();

function read() {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY));
        return { accounts: saved?.accounts ?? {}, template: saved?.template ?? {}, gone: saved?.gone ?? [] };
    } catch {
        return { accounts: {}, template: {}, gone: [] };
    }
}

function write(phone) {
    try {
        localStorage.setItem(KEY, JSON.stringify(phone));
    } catch {
        // Storage blocked: no login without internet on this browser.
    }
    listeners.forEach((listener) => listener());
}

const normal = (email) => String(email ?? '').trim().toLowerCase();
const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromBase64 = (text) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

async function derive(password, salt, iterations) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    return toBase64(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

const matches = async (entry, password) => (await derive(password, fromBase64(entry.salt), entry.iterations)) === entry.hash;

function setEntry(email, change) {
    const phone = read();
    const entry = change(phone.accounts[normal(email)]);
    if (entry) phone.accounts[normal(email)] = entry;
    else delete phone.accounts[normal(email)];
    write(phone);
}

/** Called after a login the server accepted. Needs https (or localhost); without it nothing is remembered. */
export async function rememberAccount(user, password) {
    if (!globalThis.crypto?.subtle || !user?.email || !password) return;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derive(password, salt, ITERATIONS);
    const phone = read();
    phone.accounts[normal(user.email)] = { user, stamp: user.offline_stamp, salt: toBase64(salt), hash, iterations: ITERATIONS, tries: 0 };
    phone.gone = phone.gone.filter((id) => id !== user.id);
    write(phone);
}

/**
 * A page shows this account: keep its details current. The page's stamp is taken only when the
 * entry has none yet (a phone converted by takeOldLock). Pages also open from the phone's saved
 * copies, which can be older than the check, so a page never replaces or removes it: only a
 * login (rememberAccount) and the server's answer (staleAccounts.js) do.
 */
export function rememberUser(user) {
    if (!read().accounts[normal(user?.email)]) return;
    setEntry(user.email, (entry) => ({ ...entry, user, stamp: entry.stamp ?? user.offline_stamp }));
}

/** The account if this phone can check its password: it has both the check and the details. */
export function account(email) {
    const entry = read().accounts[normal(email)];
    return entry?.hash && entry?.user ? entry : null;
}

export const hasAccount = (email) => Boolean(account(email));

/** Every account the server can be asked about (staleAccounts.js). */
export function rememberedAccounts() {
    return Object.entries(read().accounts)
        .filter(([, entry]) => entry.user && entry.stamp)
        .map(([email, entry]) => ({ email, user: entry.user, stamp: entry.stamp }));
}

/** 'ok', 'wrong', 'blocked' (too many wrong tries: only an online login opens it now) or 'unknown'. */
export async function checkPassword(email, password) {
    const entry = account(email);
    if (!entry) return 'unknown';
    if (entry.tries >= MAX_TRIES) return 'blocked';
    const ok = await matches(entry, password);
    const tries = ok ? 0 : entry.tries + 1;
    setEntry(email, (current) => current && { ...current, tries });
    if (ok) return 'ok';
    return tries >= MAX_TRIES ? 'blocked' : 'wrong';
}

/** Whether the phone would accept this password, without counting a try. */
export async function matchesCheck(email, password) {
    const entry = account(email);
    return entry ? matches(entry, password) : false;
}

export const triesLeft = (email) => Math.max(0, MAX_TRIES - (account(email)?.tries ?? MAX_TRIES));

/**
 * `gone`: the server no longer accepts the account (password changed, or removed). Its unsent
 * reports can't send until it logs in here again, which a removed account never will, so the
 * offline status shows them to whoever uses the phone next (see accountsGone).
 */
export function forgetAccount(email, { gone = false } = {}) {
    const phone = read();
    const id = phone.accounts[normal(email)]?.user?.id;
    delete phone.accounts[normal(email)];
    if (gone && id != null && !phone.gone.includes(id)) phone.gone.push(id);
    write(phone);
}

/** Ids of accounts forgotten as `gone` that have not logged in on this phone since. */
export const accountsGone = () => read().gone;

export const isAdmin = (user) => Boolean(user?.roles?.some((role) => role.name === 'admin'));

export function savedPagesBelongTo(userId) {
    try {
        return localStorage.getItem(PAGES_OWNER_KEY) === String(userId);
    } catch {
        return false;
    }
}

export function setSavedPagesOwner(userId) {
    try {
        localStorage.setItem(PAGES_OWNER_KEY, String(userId));
    } catch {
        // Storage blocked: the pages are still cleared when another account logs in.
    }
}

function savedPagesOwner() {
    try {
        return localStorage.getItem(PAGES_OWNER_KEY);
    } catch {
        return null;
    }
}

/** Remove the service worker's saved pages (they hold one account's rows). Queued saves are kept. */
export async function clearSavedPages() {
    if (typeof caches === 'undefined') return;
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(PAGE_CACHE_PREFIX)).map((key) => caches.delete(key)));
}

/** What the report forms need besides an account's own rows, for opening them blank offline. */
export const template = () => read().template;

export function saveTemplate(partial) {
    const phone = read();
    write({ ...phone, template: { ...phone.template, ...partial } });
}

/**
 * Called for every page the app shows. A page without a user is the logged-out app: nothing is
 * forgotten, so the same phone can log in again with no internet. During an offline session the
 * pages are built on the phone and say nothing about what the server would show.
 */
export function notePage(page, inOfflineSession) {
    const user = page?.props?.auth?.user;
    if (!user || inOfflineSession) return;
    rememberUser(user);
    const owner = savedPagesOwner();
    // Another account's rows must not open for this one.
    if (owner && owner !== String(user.id)) clearSavedPages().catch(() => {});
    setSavedPagesOwner(user.id);
    if (page.component === 'SituationReports/Index') saveTemplate({ typhoon: page.props.typhoon, barangays: page.props.barangays });
}

/**
 * Phones signed in before several accounts were remembered hold one record under another key.
 * Turn it into an entry (its details arrive with the next page, see rememberUser) and hand back
 * what the lock needs, so nobody has to log in again after the update.
 */
export function takeOldLock() {
    let old;
    try {
        old = JSON.parse(localStorage.getItem(OLD_LOCK_KEY));
        localStorage.removeItem(OLD_LOCK_KEY);
    } catch {
        return null;
    }
    if (!old?.email || !old.salt || !old.hash) return null;
    setEntry(old.email, (entry) => entry ?? { salt: old.salt, hash: old.hash, iterations: old.iterations, tries: old.tries ?? 0 });
    return { email: normal(old.email), locked: Boolean(old.locked), lastActive: old.lastActive ?? Date.now() };
}

export function subscribeAccounts(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
