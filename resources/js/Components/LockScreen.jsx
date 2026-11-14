import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import LoginForm from '@/Components/LoginForm';
import GuestLayout from '@/Layouts/GuestLayout';
import { isAdmin } from '@/lib/offline/accounts';
import { currentUser } from '@/lib/offline/context';
import { coverNotice, holdIdleCover, isCovered, noteActivity, subscribeLock } from '@/lib/offline/lock';

// Report accounts are asked to log in again after 15 idle minutes. Admin screens only when
// locked by hand: they are often left open on an operations-room display.
// `hold` saves an idle cover so activity on the login form can't lift it. Not while rendering:
// saving tells other components, and React forbids updating them mid-render.
function coveredNow(hold = true) {
    const user = currentUser();
    return (hold ? holdIdleCover : isCovered)(user, { idleLock: !isAdmin(user) });
}

/**
 * Covers the app with the normal login form when nobody is logged in on this phone: after a
 * logout made here, after the idle time, or when the server no longer accepts the account. The
 * form works without internet for accounts that logged in on this phone before. The page stays
 * underneath, so a half-filled form is still there when its account logs back in.
 */
export default function LockScreen() {
    const [covered, setCovered] = useState(() => coveredNow(false));
    const [notice, setNotice] = useState(coverNotice);

    useEffect(() => {
        const refresh = () => {
            setCovered(coveredNow());
            setNotice(coverNotice());
        };
        refresh();
        const unsubscribe = subscribeLock(refresh);
        const offNavigate = router.on('navigate', refresh);
        const timer = setInterval(refresh, 30000);
        const onVisible = () => document.visibilityState === 'visible' && refresh();
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('pointerdown', noteActivity, true);
        window.addEventListener('keydown', noteActivity, true);
        return () => {
            unsubscribe();
            offNavigate();
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('pointerdown', noteActivity, true);
            window.removeEventListener('keydown', noteActivity, true);
        };
    }, []);

    return (
        <DialogPrimitive.Root open={covered}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Content
                    className="fixed inset-0 z-[100] overflow-y-auto focus:outline-none"
                    onEscapeKeyDown={(event) => event.preventDefault()}
                    onInteractOutside={(event) => event.preventDefault()}
                >
                    <GuestLayout homeLinks={false}>
                        {covered && (
                            <>
                                <DialogPrimitive.Title asChild>
                                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
                                </DialogPrimitive.Title>
                                {notice === 'changed' ? (
                                    <DialogPrimitive.Description asChild>
                                        <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-base text-foreground">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                                            Your password was changed or this account was removed. Log in again to continue. What you typed is kept on this phone.
                                        </p>
                                    </DialogPrimitive.Description>
                                ) : (
                                    <DialogPrimitive.Description className="mt-2 text-base text-muted-foreground">
                                        Log in to continue. This works without internet on this phone.
                                    </DialogPrimitive.Description>
                                )}
                                <div className="mt-6">
                                    <LoginForm />
                                </div>
                            </>
                        )}
                    </GuestLayout>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
