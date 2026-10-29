import axios from 'axios';
import { router } from '@inertiajs/react';
import { toast } from 'react-hot-toast';
import { rememberPassword } from './lock';
import { preparedPhone, removePrepared } from './prepared';
import { SEND_TIMEOUT_MS, holdSync, syncNow } from './sync';

// A prepared account signed in on this phone with no internet (Login.jsx). In memory only: the
// password waits here, never stored, to sign in to the server once the connection returns; closing
// or reloading the app ends the session. The server knows nothing of it until then, so reports go
// into the offline queue under this account.

const RETRY_MS = 30000;
let session = null;
let installed = false;

export const offlineSession = () => session;

/**
 * Back online: sign in to the server with the password typed offline, then send the reports.
 * No page reload, so whatever is half-typed in a form stays. A connection too weak to answer
 * changes nothing: it is tried again on the next 'online' event or within RETRY_MS.
 */
export async function signInToServer() {
    if (!session || session.signingIn || session.refused || !navigator.onLine) return;
    session.signingIn = true;
    const { user, password } = session;
    try {
        // Time-limited like sending: a request hanging on a weak signal would keep `signingIn`
        // set and stop every retry. A timeout has no response, so it is simply tried again.
        await axios.get(route('sanctum.csrf-cookie'), { timeout: SEND_TIMEOUT_MS });
        await axios.post(route('login'), { email: user.email, password, remember: true }, { headers: { Accept: 'application/json' }, timeout: SEND_TIMEOUT_MS });
    } catch (error) {
        session.signingIn = false;
        if (error.response?.status !== 422) return; // unreachable, busy or limited: later
        // Refused: the password was changed or the account removed since this phone was prepared.
        session.refused = true;
        removePrepared(user.email);
        holdSync(false);
        toast.error("Couldn't sign in to send your reports: this account's password was changed or the account was removed. The reports stay on this phone; sign in again to send them.", { duration: 10000 });
        syncNow(); // shows "Log in to send…" with its sign-in button
        return;
    }

    // An ordinary session from here on: the lock and sending work as after any online sign-in.
    session = null;
    await rememberPassword(user.email, password);
    toast.success(`Back online and signed in as ${user.name}. Sending your reports…`);
    holdSync(false);
    syncNow();
}

/** Open the forms page for a prepared account, with its permissions and blank forms. */
export function startOfflineSession(account, password, queryClient) {
    const template = preparedPhone()?.template ?? {};
    session = { user: account.user, password };
    holdSync(true);

    if (!installed) {
        installed = true;
        // Any other page could only come from this phone's saved copies, maybe another account's.
        // Once the server refused the password, the sign-in page has to be reachable.
        router.on('before', (event) => {
            if (!session || session.refused || event.detail.visit.method !== 'get') return undefined;
            toast.error('Signed in without internet: only the forms are available until the connection returns.');
            return false;
        });
        window.addEventListener('online', () => signInToServer());
        setInterval(() => signInToServer(), RETRY_MS);
    }

    // The communication form loads its service columns separately; nothing to load them from now.
    queryClient.setQueryData(['communication-services'], template.communicationServices ?? {});
    router.push({
        component: 'SituationReports/Index',
        url: route('situation-reports.index'),
        props: {
            auth: { user: account.user },
            typhoon: template.typhoon ?? { active: null, hasActive: false },
            barangays: template.barangays ?? [],
            flash: { success: null, error: null },
            errors: {},
        },
    });
}

/** Back to the sign-in page; reports saved in the session stay queued under the account. */
export function endOfflineSession() {
    session = null;
    window.location.href = route('login');
}
