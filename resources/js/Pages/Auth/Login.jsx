import { useRef, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, CheckCircle2, CloudOff, Eye, EyeOff, LifeBuoy, Loader2, Lock, Mail } from 'lucide-react';
import EmailAutocompleteInput from '@/Components/EmailAutocompleteInput';
import InputError from '@/Components/InputError';
import InstallAppButton from '@/Components/InstallAppButton';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import useOnline from '@/hooks/useOnline';
import { cn } from '@/lib/utils';

const fieldIcon = 'pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary';
const fieldInput = 'h-12 rounded-lg bg-background pl-11 text-lg md:text-lg focus-visible:ring-2';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        // On by default: field phones lose signal for days, and staying signed in lets
        // reports saved offline send on their own when the connection returns.
        remember: true,
    });
    const online = useOnline();
    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onError: (errs) => (errs.email ? emailRef : passwordRef).current?.focus(),
            onFinish: () => reset('password'),
        });
    };

    const trackCapsLock = (e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);

    return (
        <GuestLayout>
            <Head title="Log in" />

            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-2 text-base text-muted-foreground">Sign in with the account issued by your CDRRMO administrator.</p>

            <div className="mt-6 space-y-3 empty:hidden" aria-live="polite">
                {status && (
                    <p className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-base text-success">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        {status}
                    </p>
                )}
                {!online && (
                    <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-base text-warning">
                        <CloudOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        You're offline. Signing in needs an internet connection.
                    </p>
                )}
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">Email address</Label>
                    <div className="group relative">
                        <Mail className={fieldIcon} aria-hidden="true" />
                        <EmailAutocompleteInput
                            ref={emailRef}
                            id="email"
                            name="email"
                            value={data.email}
                            onValueChange={(email) => setData('email', email)}
                            autoComplete="username"
                            inputMode="email"
                            autoCapitalize="none"
                            spellCheck={false}
                            autoFocus
                            required
                            placeholder="BarangayName@barangay.local"
                            aria-invalid={errors.email ? true : undefined}
                            aria-describedby={errors.email ? 'email-error' : undefined}
                            className={cn(fieldInput, errors.email && 'border-destructive focus-visible:ring-destructive')}
                        />
                    </div>
                    <InputError id="email-error" message={errors.email} className="text-base" />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="password" className="text-base">Password</Label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="-my-2 inline-flex min-h-11 items-center rounded-sm text-base font-medium text-accent-foreground underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-0"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>
                    <div className="group relative">
                        <Lock className={fieldIcon} aria-hidden="true" />
                        <Input
                            ref={passwordRef}
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            onKeyDown={trackCapsLock}
                            onKeyUp={trackCapsLock}
                            onBlur={() => setCapsLock(false)}
                            autoComplete="current-password"
                            required
                            aria-invalid={errors.password ? true : undefined}
                            aria-describedby={[errors.password && 'password-error', capsLock && 'caps-lock'].filter(Boolean).join(' ') || undefined}
                            className={cn(fieldInput, 'pr-11 [&::-ms-clear]:hidden [&::-ms-reveal]:hidden', errors.password && 'border-destructive focus-visible:ring-destructive')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            aria-pressed={showPassword}
                            aria-controls="password"
                            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                        </button>
                    </div>
                    {capsLock && (
                        <p id="caps-lock" className="flex items-center gap-1.5 text-base text-warning">
                            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                            Caps Lock is on
                        </p>
                    )}
                    <InputError id="password-error" message={errors.password} className="text-base" />
                </div>

                <label htmlFor="remember" className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md">
                    <input
                        id="remember"
                        type="checkbox"
                        name="remember"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
                    />
                    <span className="text-base">
                        <span className="font-medium text-foreground">Keep me signed in</span>
                        <span className="block text-muted-foreground">Lets reports saved offline send automatically.</span>
                    </span>
                </label>

                <Button
                    type="submit"
                    disabled={processing}
                    className="group h-12 w-full rounded-lg text-lg font-semibold shadow-lg shadow-primary/30 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                >
                    {processing ? (
                        <>
                            <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                            Signing in…
                        </>
                    ) : (
                        <>
                            Sign in
                            <ArrowRight className="transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-6 empty:hidden">
                <InstallAppButton />
            </div>

            <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground [text-wrap:balance]">
                <LifeBuoy className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
                Need an account or locked out? Contact your CDRRMO system administrator.
            </p>
        </GuestLayout>
    );
}
