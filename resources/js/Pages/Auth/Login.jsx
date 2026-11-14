import { Head } from '@inertiajs/react';
import { CheckCircle2, CloudOff, LifeBuoy } from 'lucide-react';
import InstallAppButton from '@/Components/InstallAppButton';
import LoginForm from '@/Components/LoginForm';
import GuestLayout from '@/Layouts/GuestLayout';
import useOnline from '@/hooks/useOnline';

export default function Login({ status, canResetPassword }) {
    const online = useOnline();

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
                        No internet. You can still log in if this account has logged in on this phone before.
                    </p>
                )}
            </div>

            <div className="mt-6">
                <LoginForm canResetPassword={canResetPassword} />
            </div>

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
