import { Button } from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Verify your email</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
                Before getting started, please verify your email address by clicking the link we just emailed to you.
                If you did not receive it, we can send another.
            </p>

            {status === 'verification-link-sent' && (
                <p className="mt-6 flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success" role="status">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    A new verification link has been sent to the email address you provided during registration.
                </p>
            )}

            <form onSubmit={submit} className="mt-6 space-y-3">
                <Button type="submit" disabled={processing} className="h-11 w-full text-base">
                    {processing && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                    Resend verification email
                </Button>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Log out
                </Link>
            </form>
        </GuestLayout>
    );
}
