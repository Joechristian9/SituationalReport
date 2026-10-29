// Accounts an admin prepared on this phone (OfflineAccountController), so they can sign in here
// with no internet. Apart from the signed-in account's lock (lock.js): logging out doesn't remove
// them; each one lasts until it expires (30 days) or an admin removes it. Holds password checks,
// never passwords, and no report rows: an offline sign-in starts with blank forms.

import { MAX_TRIES, matchesCheck } from './lock';

const KEY = 'offline-prepared';
const listeners = new Set();

const normalEmail = (email) => String(email ?? '').trim().toLowerCase();

function read() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || null;
    } catch {
        return null;
    }
}

function write(phone) {
    try {
        if (phone && Object.keys(phone.accounts).length > 0) localStorage.setItem(KEY, JSON.stringify(phone));
        else localStorage.removeItem(KEY);
    } catch {
        // Storage blocked: nothing can be prepared on this browser.
    }
    listeners.forEach((listener) => listener());
}

/** The prepared accounts still valid (expired ones are dropped), and the forms template. */
export function preparedPhone() {
    const phone = read();
    if (!phone) return null;
    const now = Date.now();
    const accounts = Object.fromEntries(Object.entries(phone.accounts).filter(([, account]) => Date.parse(account.expiresAt) > now));
    if (Object.keys(accounts).length !== Object.keys(phone.accounts).length) write({ ...phone, accounts });
    return Object.keys(accounts).length > 0 ? { ...phone, accounts } : null;
}

/** Add (or renew) the accounts of an admin's download; the newest forms template replaces the old. */
export function savePrepared(download) {
    const accounts = { ...(preparedPhone()?.accounts ?? {}) };
    download.accounts.forEach(({ user, salt, hash }) => {
        accounts[normalEmail(user.email)] = { user, salt, hash, iterations: download.iterations, expiresAt: download.expiresAt, tries: 0 };
    });
    write({ template: download.template, accounts });
}

export function preparedAccount(email) {
    return preparedPhone()?.accounts[normalEmail(email)] ?? null;
}

/**
 * Check a password typed with no internet: 'ok', 'wrong', 'blocked' (too many wrong ones: only
 * an online sign-in now), or 'unknown' (this account isn't prepared on this phone).
 */
export async function checkPrepared(email, password) {
    const account = preparedAccount(email);
    if (!account) return 'unknown';
    if (account.tries >= MAX_TRIES) return 'blocked';
    const ok = await matchesCheck(password, account);
    const phone = read();
    phone.accounts[normalEmail(email)] = { ...account, tries: ok ? 0 : account.tries + 1 };
    write(phone);
    if (ok) return 'ok';
    return account.tries + 1 >= MAX_TRIES ? 'blocked' : 'wrong';
}

export const preparedTriesLeft = (email) => Math.max(0, MAX_TRIES - (preparedAccount(email)?.tries ?? MAX_TRIES));

export function removePrepared(email) {
    const phone = read();
    if (!phone) return;
    const accounts = { ...phone.accounts };
    delete accounts[normalEmail(email)];
    write({ ...phone, accounts });
}

export const clearPrepared = () => write(null);

export function subscribePrepared(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
