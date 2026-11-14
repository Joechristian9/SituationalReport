// Who may use the app on this phone right now.
//
// The login form covers the app (LockScreen.jsx) when the account whose page is showing is not
// the one logged in here: after a logout on this phone, after the idle time, or when the server
// said its password changed. The password checks themselves live in accounts.js. The server
// session stays open underneath, which is what lets unsent reports send on their own.

import { hasAccount, subscribeAccounts } from './accounts';

const KEY = 'offline-screen';
export const IDLE_MS = 15 * 60 * 1000;
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());

const normal = (email) => String(email ?? '').trim().toLowerCase();

function read() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
        return {};
    }
}

function save(screen) {
    try {
        localStorage.setItem(KEY, JSON.stringify(screen));
    } catch {
        // Storage blocked: nothing is remembered either, so nothing is ever covered.
    }
}

function write(screen) {
    save(screen);
    emit();
}

/** The email logged in on this phone, or null. */
export const signedInHere = () => read().email ?? null;

export function setSignedInHere(email, lastActive = Date.now()) {
    write({ ...read(), email: normal(email), lastActive, notice: null });
}

/**
 * Nobody is logged in on this phone any more. `notice` says why, when the person didn't choose
 * it. `pendingLogout` is the account whose server session is still open because the logout
 * happened with no connection (auth.js finishes it later).
 */
export function signOutHere({ notice = null, pendingLogout: userId } = {}) {
    const screen = read();
    write({ ...screen, email: null, notice, pendingLogout: userId ?? screen.pendingLogout ?? null });
}

/** 'changed': the server no longer accepts the account that was in use (staleAccounts.js). */
export const coverNotice = () => read().notice ?? null;

export const pendingLogout = () => read().pendingLogout ?? null;
export const setPendingLogout = (userId) => write({ ...read(), pendingLogout: userId });
export const clearPendingLogout = () => write({ ...read(), pendingLogout: null });

/**
 * Which account the server still has logged in on this phone, as far as the phone knows (null:
 * nobody). While it is the account whose page is showing, that account only needs the phone's
 * own check to come back (auth.js). Otherwise a login with no connection must keep the password
 * to log in to the server later, or the reports saved meanwhile would never send by themselves.
 * A phone logged in before this was tracked knows nothing: it is taken to be that account.
 */
export function serverHasSession(userId) {
    const known = read().serverSession;
    return known === undefined || known === userId;
}
export const noteServerSession = (userId) => save({ ...read(), serverSession: userId });

/**
 * Whether the login form must cover the page of `user`. Only an account whose password this
 * phone knows is covered, so nobody is shut out with no way back; the exception is a notice,
 * which sends the person to log in with internet.
 */
export function isCovered(user, { idleLock = true } = {}) {
    if (!user) return false;
    const screen = read();
    if (screen.notice) return true;
    if (!hasAccount(user.email)) return false;
    if (screen.email !== normal(user.email)) return true;
    return idleLock && Date.now() - (screen.lastActive ?? 0) > IDLE_MS;
}

/**
 * For the cover itself (LockScreen.jsx): whether `user`'s page is covered. A cover that came
 * from the idle time is saved, so activity on the login form can't lift it. Only then: when
 * another account has just logged in over this page, that account must stay logged in.
 */
export function holdIdleCover(user, options) {
    const covered = isCovered(user, options);
    const here = signedInHere();
    if (covered && here && here === normal(user?.email)) signOutHere();
    return covered;
}

export const canLock = hasAccount;

/** Cover the app by hand. The server session stays open, so reports keep sending. */
export const lock = () => signOutHere();

/**
 * The person is using the app: push the idle time back. Writes at most every 30 seconds, and
 * not once the idle time has run out: a tap must not lift a cover that is just about to show.
 */
export function noteActivity() {
    const screen = read();
    const idle = Date.now() - (screen.lastActive ?? 0);
    if (screen.email && idle > 30000 && idle < IDLE_MS) save({ ...screen, lastActive: Date.now() });
}

export function subscribeLock(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

// Forgetting or remembering an account changes what is covered.
subscribeAccounts(emit);
