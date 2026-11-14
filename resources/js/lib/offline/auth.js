import axios from 'axios';
import {
    account,
    checkPassword,
    clearSavedPages,
    forgetAccount,
    hasAccount,
    isAdmin,
    matchesCheck,
    rememberAccount,
    savedPagesBelongTo,
    setSavedPagesOwner,
    triesLeft,
} from './accounts';
import { currentUser } from './context';
import { clearPendingLogout, coverNotice, pendingLogout, setPendingLogout, setSignedInHere, signOutHere } from './lock';
import { endOfflineSession, offlineSession, startOfflineSession } from './offlineSession';
import { syncNow } from './sync';

// Logging in and out, with or without a connection. One login form uses this everywhere
// (LoginForm.jsx): on the login page and on the screen that covers the app.
//
// The server decides whenever it answers. The phone's own check of the password (accounts.js)
// is used only for the account whose page is already open underneath, and when the server
// can't be reached: with mobile data on but no load the phone shows a connection and nothing
// gets through, so "can't be reached" means no answer in time, not what the browser reports.

export const SERVER_WAIT_MS = 10000;
// Background requests: a 419 must not reload the page (bootstrap.js).
const REQUEST = { offlineSync: true, timeout: SERVER_WAIT_MS, headers: { Accept: 'application/json' } };

const normal = (email) => String(email ?? '').trim().toLowerCase();
const fail = (field, message) => ({ ok: false, field, message });
const refusedByPhone = (result, email) => {
    if (result === 'blocked') return fail('password', 'Too many wrong passwords on this phone. Log in with internet to continue.');
    const left = triesLeft(email);
    return fail('password', `Wrong password. ${left} ${left === 1 ? 'try' : 'tries'} left on this phone without internet.`);
};

/** The server's answer, a refusal included; null when nothing came back. */
async function ask(request) {
    try {
        return await request();
    } catch (error) {
        return error.response ?? null;
    }
}

const freshToken = () => ask(() => axios.get(route('sanctum.csrf-cookie'), REQUEST));

/** 'done' (also when nobody was logged in), 'problem' (the server answered with an error) or 'unreachable'. */
async function logOutOfServer() {
    if (!(await freshToken())) return 'unreachable';
    const answer = await ask(() => axios.post(route('logout'), {}, REQUEST));
    if (answer?.status === 204 || answer?.status === 401) return 'done';
    // Any other "success" is not the server: a telco's "no load" page answers 200.
    return answer && answer.status >= 400 ? 'problem' : 'unreachable';
}

/** The server's answer to a login, or null when it couldn't be reached. */
async function logInToServer(credentials, someoneIsLoggedIn) {
    if (someoneIsLoggedIn) {
        // Otherwise the server would answer the login as the account already logged in.
        const left = await logOutOfServer();
        if (left === 'unreachable') return null;
        if (left === 'problem') return { status: 500 };
    } else if (!(await freshToken())) {
        return null;
    }
    const answer = await ask(() => axios.post(route('login'), credentials, REQUEST));
    if (!answer || (answer.status < 400 && !answer.data?.user?.id)) return null;
    return answer;
}

/**
 * Log in from the login form. Resolves to `{ ok: true }` (the app opens, by a page load or by
 * the cover lifting) or `{ ok: false, field, message }` to show under that field.
 */
export async function signIn({ email, password, remember = true }, queryClient) {
    const under = currentUser();
    const underneath = under && normal(under.email) === normal(email);

    // The account's own page is open underneath (it went idle, or logged out on this phone):
    // its server session is still there, so the phone's check is enough.
    if (underneath && !coverNotice()) {
        const result = await checkPassword(email, password);
        if (result === 'ok') {
            setSignedInHere(email);
            if (pendingLogout() === under.id) clearPendingLogout();
            return { ok: true };
        }
        if (result !== 'unknown') return refusedByPhone(result, email);
    }

    const answer = await logInToServer({ email: normal(email), password, remember }, Boolean(under || pendingLogout()));

    if (answer?.status === 200) {
        const { user, home } = answer.data;
        await rememberAccount(user, password);
        endOfflineSession();
        clearPendingLogout();
        setSignedInHere(user.email);
        if (under?.id === user.id) {
            // Logging in again after a password change: no reload, so a half-typed form stays.
            syncNow();
            return { ok: true };
        }
        if (!savedPagesBelongTo(user.id)) {
            await clearSavedPages();
            setSavedPagesOwner(user.id);
        }
        // A full page load, so the app starts as this account with a fresh CSRF token.
        window.location.assign(home);
        return { ok: true };
    }

    if (answer?.status === 422) {
        // Refused although the phone still accepts this password: it was changed elsewhere (or
        // the account removed), so the phone's check must stop working too.
        if (await matchesCheck(email, password)) {
            const stale = account(email);
            forgetAccount(email);
            if (savedPagesBelongTo(stale.user.id)) await clearSavedPages();
        }
        return fail('email', answer.data?.errors?.email?.[0] ?? 'These credentials do not match our records.');
    }
    if (answer?.status === 429) return fail('email', answer.data?.message ?? 'Too many login attempts. Try again in a minute.');
    if (answer) return fail('email', 'The server had a problem. Try again in a moment.');

    // No answer from the server: the phone's own check, for accounts it remembers.
    const entry = account(email);
    if (!entry || isAdmin(entry.user)) return fail('email', 'This account has not logged in on this phone before, so logging in needs internet.');
    const result = await checkPassword(email, password);
    if (result !== 'ok') return refusedByPhone(result, email);

    // Whoever's page is open is still logged in on the server (unless the server never knew
    // them): their reports go first when the connection returns (offlineSession.js).
    const serverKnowsUnder = under && under.id !== entry.user.id && !offlineSession();
    endOfflineSession();
    if (serverKnowsUnder && !pendingLogout()) setPendingLogout(under.id);
    startOfflineSession(entry, password, queryClient);
    return { ok: true };
}

/**
 * Log out of this phone. 'done': the server logged the account out and the app reloads.
 * 'local': logged out on this phone only (no connection); the server follows later, see
 * finishPendingLogout. 'needs-internet': nothing changed, because this account could not log
 * back in here without the server (an admin, or an account the phone has no check for).
 */
export async function logOut() {
    const user = currentUser();

    // The server never knew this login: there is nothing to tell it.
    if (offlineSession()) {
        endOfflineSession();
        signOutHere();
        return 'local';
    }

    if ((await logOutOfServer()) === 'done') {
        if (isAdmin(user)) {
            // An admin's check on a field phone is the most valuable thing to steal.
            forgetAccount(user.email);
            await clearSavedPages();
        }
        signOutHere();
        clearPendingLogout();
        // Full page load so the next login starts with a fresh CSRF token.
        window.location.href = '/';
        return 'done';
    }

    if (!user || isAdmin(user) || !hasAccount(user.email)) return 'needs-internet';
    signOutHere({ pendingLogout: user.id });
    return 'local';
}

/**
 * The connection is back after a logout made without one: send that account's reports through
 * its still-open session, then close it. Skipped during an offline session, which does the
 * same itself before logging in.
 */
export async function finishPendingLogout() {
    const userId = pendingLogout();
    if (!userId || offlineSession() || !navigator.onLine) return;
    await syncNow({ userId, evenIfHeld: true });
    if ((await logOutOfServer()) === 'done') clearPendingLogout();
}
