import { useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import EmailAutocompleteInput from '@/Components/EmailAutocompleteInput';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { signIn } from '@/lib/offline/auth';
import { cn } from '@/lib/utils';

const fieldIcon = 'pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary';
const fieldInput = 'h-12 rounded-lg bg-background pl-11 text-lg md:text-lg focus-visible:ring-2';

/**
 * The email and password form, the same on the login page and on the screen that covers the
 * app (LockScreen.jsx). It works with no internet for an account that has logged in on this
 * phone before: auth.js decides whether the server or the phone checks the password.
 */
export default function LoginForm({ canResetPassword = false }) {
    const queryClient = useQueryClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // On by default: field phones lose signal for days, and staying signed in lets
    // reports saved offline send on their own when the connection returns.
    const [remember, setRemember] = useState(true);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const refuse = (field, message) => {
        setErrors({ [field]: message });
        setPassword('');
        setProcessing(false);
        (field === 'email' ? emailRef : passwordRef).current?.focus();
    };

    const submit = async (e) => {
        e.preventDefault();
        if (processing) return;
        setProcessing(true);
        setErrors({});
        try {
            const result = await signIn({ email, password, remember }, queryClient);
            // Accepted: the page is loading or the cover is lifting, so the button keeps spinning.
            if (!result.ok) refuse(result.field, result.message);
        } catch {
            refuse('email', 'Something went wrong. Try again.');
        }
    };

    const trackCapsLock = (e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Email address</Label>
                <div className="group relative">
                    <Mail className={fieldIcon} aria-hidden="true" />
                    <EmailAutocompleteInput
                        ref={emailRef}
                        id="email"
                        name="email"
                        value={email}
                        onValueChange={setEmail}
                        autoComplete="username"
                        inputMode="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        autoFocus
                        required
                        placeholder="Barangay@barangay.local"
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        className={cn(fieldInput, errors.email && 'border-destructive focus-visible:ring-destructive')}
                    />
                </div>
                <InputError id="email-error" message={errors.email} className="text-base" role="alert" />
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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                <InputError id="password-error" message={errors.password} className="text-base" role="alert" />
            </div>

            <label htmlFor="remember" className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md">
                <input
                    id="remember"
                    type="checkbox"
                    name="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
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
    );
}
