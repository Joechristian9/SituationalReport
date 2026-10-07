import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Forgot your password?</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your email address and we will send you a link to choose a new one.
            </p>

            {status && (
                <p className="mt-6 flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success" role="status">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {status}
                </p>
            )}

            <form onSubmit={submit} className="mt-6 space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="username"
                        inputMode="email"
                        autoCapitalize="none"
                        autoFocus
                        required
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        className="h-11 bg-background text-base md:text-base focus-visible:ring-2"
                    />
                    <InputError id="email-error" message={errors.email} />
                </div>

                <Button type="submit" disabled={processing} className="h-11 w-full text-base">
                    {processing && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                    Email reset link
                </Button>
            </form>

            <Link
                href={route('login')}
                className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm font-medium text-accent-foreground underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to sign in
            </Link>
        </GuestLayout>
    );
}
