import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle, CloudUpload, Eye, EyeOff, Loader2, Lock, LogOut } from 'lucide-react';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import useOnline from '@/hooks/useOnline';
import { currentUser } from '@/lib/offline/context';
import { logOut } from '@/lib/offline/install';
import { isLocked, lock, noteActivity, subscribeLock, triesLeft, unlock } from '@/lib/offline/lock';

// Report accounts lock after 15 idle minutes. Admin screens lock only by hand: they are
// often left open on an operations-room display.
function lockedNow() {
    const user = currentUser();
    const isAdmin = user?.roles?.some((role) => role.name === 'admin');
    return isLocked(user?.email, { idleLock: !isAdmin });
}

/**
 * Covers the app until the password is entered again, checked on the phone so it works without
 * internet. The server session stays signed in underneath, so unsent reports keep sending.
 */
export default function LockScreen() {
    const [locked, setLocked] = useState(lockedNow);

    useEffect(() => {
        const refresh = () => {
            const now = lockedNow();
            // Save an idle lock, so activity on the lock screen itself can't lift it.
            if (now) lock();
            setLocked(now);
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
        <DialogPrimitive.Root open={locked}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Content
                    className="fixed inset-0 z-[100] overflow-y-auto focus:outline-none"
                    onEscapeKeyDown={(event) => event.preventDefault()}
                    onInteractOutside={(event) => event.preventDefault()}
                >
                    <GuestLayout homeLinks={false}>{locked && <UnlockForm />}</GuestLayout>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function UnlockForm() {
    const user = currentUser();
    const online = useOnline();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [checking, setChecking] = useState(false);
    const [blocked, setBlocked] = useState(() => triesLeft() === 0);
    const [leaving, setLeaving] = useState(false);
    const passwordRef = useRef(null);

    const submit = async (event) => {
        event.preventDefault();
        if (!password || checking) return;
        setChecking(true);
        const result = await unlock(password);
        setChecking(false);
        setPassword('');
        if (result === 'ok') return; // the lock listener hides this screen
        if (result === 'blocked') {
            setBlocked(true);
            return;
        }
        const left = triesLeft();
        setError(`Wrong password. ${left} ${left === 1 ? 'try' : 'tries'} left, then you'll need internet to sign in again.`);
        passwordRef.current?.focus();
    };

    const signInAgain = () => logOut({ onStart: () => setLeaving(true), onFinish: () => setLeaving(false) });

    return (
        <div className="space-y-6">
            <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">
                    <Lock className="h-6 w-6" />
                </span>
                <DialogPrimitive.Title asChild>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">App locked</h1>
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-2 text-base text-muted-foreground [overflow-wrap:anywhere]">
                    {user?.name ? `${user.name}, enter` : 'Enter'} your password to continue. This works without internet.
                </DialogPrimitive.Description>
            </div>

            <p className="flex items-start gap-2 rounded-lg border border-border bg-background p-3 text-base text-foreground">
                <CloudUpload className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                Reports saved on this phone keep sending while it's locked.
            </p>

            {blocked ? (
                <div className="space-y-4">
                    <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-base text-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                        Too many wrong passwords. Sign in again with internet to continue. Unsent reports stay on this phone.
                    </p>
                    <Button type="button" size="lg" className="h-12 w-full gap-2 text-base" disabled={!online || leaving} onClick={signInAgain}>
                        {leaving ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <LogOut className="h-5 w-5" aria-hidden="true" />}
                        {online ? 'Sign in again' : 'Connect to the internet to sign in again'}
                    </Button>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="unlock-password" className="text-base">Password</Label>
                        <div className="relative">
                            <Input
                                ref={passwordRef}
                                id="unlock-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
                                autoFocus
                                required
                                aria-invalid={error ? true : undefined}
                                aria-describedby={error ? 'unlock-error' : undefined}
                                className="h-12 rounded-lg bg-background pr-11 text-lg focus-visible:ring-2 md:text-lg [&::-ms-clear]:hidden [&::-ms-reveal]:hidden"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((shown) => !shown)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                aria-pressed={showPassword}
                                aria-controls="unlock-password"
                                className="absolute right-0 top-0 flex h-12 w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                            </button>
                        </div>
                        <InputError id="unlock-error" message={error} className="text-base" role="alert" />
                    </div>
                    <Button type="submit" size="lg" className="h-12 w-full gap-2 text-base" disabled={checking}>
                        {checking && <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                        Unlock
                    </Button>
                </form>
            )}

            {!blocked && (
                <div className="border-t border-border pt-4 text-center">
                    <Button type="button" variant="ghost" className="min-h-11 gap-1.5 md:min-h-9" disabled={!online || leaving} onClick={signInAgain}>
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        {online ? `Not ${user?.name ?? 'you'}? Log out` : 'Logging out needs internet'}
                    </Button>
                </div>
            )}
        </div>
    );
}
