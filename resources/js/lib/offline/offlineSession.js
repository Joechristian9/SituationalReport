import axios from 'axios';
import { router } from '@inertiajs/react';
import { toast } from 'react-hot-toast';
import { clearSavedPages, forgetAccount, rememberAccount, savedPagesBelongTo, setSavedPagesOwner, template } from './accounts';
import { currentUser } from './context';
import { clearPendingLogout, pendingLogout, setSignedInHere, signOutHere } from './lock';
import { SEND_TIMEOUT_MS, canRefreshWithoutLosingEdits, holdSync, refreshPage, syncNow, syncState } from './sync';

// An account logged in on this phone with no internet (auth.js checked its password against
// the phone's own check). The server knows nothing of it yet. The password waits here, in
// memory only and never stored, to log in to the server once the connection returns; closing
// or reloading the app ends the session, and the reports saved in it stay queued.

const RETRY_MS = 30000;
// Background requests: a 419 must not reload the page (bootstrap.js), and a weak signal must
// not leave one hanging and block every retry.
const REQUEST = { offlineSync: true, timeout: SEND_TIMEOUT_MS, headers: { Accept: 'application/json' } };
let session = null;
let signingIn = false;
let installed = false;

/** The account using the app offline; `blank` when its rows are not the ones saved on this phone. */
export const offlineSession = () => (session ? { user: session.user, blank: session.blank } : null);

export function endOfflineSession() {
    session = null;
    holdSync(false);
}

/**
 * While blank forms are open, the saved pages and saved background data (edit history,
 * suggestions) are another account's: keep them shut until the server can answer for this one.
 */
export const blocksRequest = (config) => Boolean(session?.blank) && String(config?.method).toLowerCase() === 'get' && !config.offlineSync;

function install() {
    if (installed) return;
    installed = true;
    router.on('before', (event) => {
        if (!session?.blank || event.detail.visit.method !== 'get') return undefined;
        toast.error('Logged in without internet: only the report forms are available until the connection returns.');
        return false;
    });
    window.addEventListener('online', () => signInToServer());
    setInterval(() => signInToServer(), RETRY_MS);
}

/** Open the app for an account the phone's own check accepted (see accounts.account). */
export function startOfflineSession(account, password, queryClient) {
    const { user } = account;
    session = { user, password, blank: !savedPagesBelongTo(user.id) };
    setSignedInHere(user.email);
    holdSync(true);
    install();
    toast.success('Logged in without internet. Reports are saved on this phone and sent when the connection returns.');

    if (!session.blank) {
        // Its own saved page may already be showing under the login form; otherwise the service
        // worker serves the saved copy.
        if (currentUser()?.id !== user.id) router.visit(route('situation-reports.index'));
        return;
    }

    const forms = template();
    // The communication form loads its service columns separately; nothing to load them from now.
    queryClient.setQueryData(['communication-services'], forms.communicationServices ?? {});
    router.push({
        component: 'SituationReports/Index',
        url: route('situation-reports.index'),
        props: {
            auth: { user },
            typhoon: forms.typhoon ?? { active: null, hasActive: false },
            barangays: forms.barangays ?? [],
            flash: { success: null, error: null },
            errors: {},
        },
    });
}

/** The server's answer, a refusal included; null when nothing came back. */
async function ask(request) {
    try {
        return await request();
    } catch (error) {
        return error.response ?? null;
    }
}

/**
 * Back online: log in to the server with the password typed offline, then send the reports.
 * No page reload, so whatever is half-typed in a form stays. Anything short of a clear answer
 * from the server changes nothing: it is tried again on the next 'online' event or RETRY_MS.
 */
export async function signInToServer() {
    if (!session || signingIn || !navigator.onLine) return;
    signingIn = true;
    try {
        await logInAndSend(session);
    } finally {
        signingIn = false;
    }
}

async function logInAndSend(current) {
    const { user, password, blank } = current;
    if (!(await ask(() => axios.get(route('sanctum.csrf-cookie'), REQUEST)))) return;

    // Whoever logged out here with no connection is still logged in on the server: their
    // reports go first, through their own session, before it is closed.
    const leaving = pendingLogout();
    if (leaving && leaving !== user.id) await syncNow({ userId: leaving, evenIfHeld: true });
    const loggedOut = await ask(() => axios.post(route('logout'), {}, REQUEST));
    // 401: nobody was logged in. Anything else (a telco "no load" page answers 200) is not the server.
    if (loggedOut?.status !== 204 && loggedOut?.status !== 401) return;
    clearPendingLogout();

    const answer = await ask(() => axios.post(route('login'), { email: user.email, password, remember: true }, REQUEST));
    if (session !== current) return; // logged out on the phone meanwhile

    if (answer?.status === 422) {
        // The password was changed or the account removed since this phone last saw the server.
        forgetAccount(user.email, { gone: true });
        if (savedPagesBelongTo(user.id)) await clearSavedPages();
        endOfflineSession();
        signOutHere({ notice: 'changed' });
        return;
    }
    if (answer?.status !== 200 || !answer.data?.user?.id) return;

    // An ordinary login from here on.
    await rememberAccount(answer.data.user, password);
    if (!savedPagesBelongTo(answer.data.user.id)) {
        await clearSavedPages();
        setSavedPagesOwner(answer.data.user.id);
    }
    endOfflineSession();
    toast.success(`Back online and logged in as ${answer.data.user.name}. Sending your reports…`);
    await syncNow();
    // Blank forms know none of the account's rows: load them, unless that would lose typing.
    if (blank && !syncState().reloadNeeded && canRefreshWithoutLosingEdits()) refreshPage();
}
