import { router } from '@inertiajs/react';
import { toast } from 'react-hot-toast';
import { preparedPhone } from './prepared';

// A prepared account signed in on this phone with no internet (Login.jsx). In memory only: the
// password waits here, never stored, to sign in to the server once the connection returns; closing
// or reloading the app ends the session. The server knows nothing of it until then, so reports go
// into the offline queue under this account.

let session = null;
let guarded = false;

export const offlineSession = () => session;

/** Open the forms page for a prepared account, with its permissions and blank forms. */
export function startOfflineSession(account, password, queryClient) {
    const template = preparedPhone()?.template ?? {};
    session = { user: account.user, password };

    // Any other page could only come from this phone's saved copies, maybe another account's.
    if (!guarded) {
        guarded = true;
        router.on('before', (event) => {
            if (!session || event.detail.visit.method !== 'get') return undefined;
            toast.error('Signed in without internet: only the forms are available until the connection returns.');
            return false;
        });
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
