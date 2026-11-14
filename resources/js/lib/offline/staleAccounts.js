import axios from 'axios';
import { clearSavedPages, forgetAccount, rememberedAccounts, savedPagesBelongTo } from './accounts';
import { currentUser } from './context';
import { signOutHere, signedInHere } from './lock';
import { endOfflineSession, offlineSession } from './offlineSession';

// A remembered account opens the app with no internet for good, so the phone must find out
// when its password was changed or the account removed. It can only learn that from the
// server: whenever there is a connection it asks (OfflineAccountController) and forgets the
// accounts that are no longer current. Their unsent reports are not touched.

export const CHECK_EVERY_MS = 5 * 60 * 1000;
const MAX_ASKED = 20; // the server takes no more per request
let checking = false;

export async function forgetStaleAccounts() {
    const accounts = rememberedAccounts().slice(0, MAX_ASKED);
    if (checking || accounts.length === 0 || !navigator.onLine) return;
    checking = true;
    try {
        const response = await axios.post(
            route('offline.accounts.check'),
            { accounts: accounts.map(({ user, stamp }) => ({ id: user.id, stamp })) },
            { offlineSync: true, timeout: 10000, headers: { Accept: 'application/json' } },
        );
        // Only the server's own answer may forget an account: a telco's "no load" page
        // answers 200 too.
        if (!Array.isArray(response.data?.current)) return;
        const current = new Set(response.data.current);
        for (const { email, user } of accounts) {
            if (!current.has(user.id)) await forget(email, user);
        }
    } catch {
        // Unreachable, busy or limited: ask again later.
    } finally {
        checking = false;
    }
}

async function forget(email, user) {
    forgetAccount(email);
    if (savedPagesBelongTo(user.id)) await clearSavedPages();
    if (offlineSession()?.user.id === user.id) endOfflineSession();
    // In use right now: cover the app. The page stays underneath, so what is typed is kept.
    if (signedInHere() === email || currentUser()?.id === user.id) signOutHere({ notice: 'changed' });
}
