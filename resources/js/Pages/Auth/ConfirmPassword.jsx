import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Confirm your password</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
                This is a secure area of the application. Please confirm your password before continuing.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="current-password"
                        autoFocus
                        required
                        aria-invalid={errors.password ? true : undefined}
                        aria-describedby={errors.password ? 'password-error' : undefined}
                        className="h-11 bg-background text-base md:text-base focus-visible:ring-2"
                    />
                    <InputError id="password-error" message={errors.password} />
                </div>

                <Button type="submit" disabled={processing} className="h-11 w-full text-base">
                    {processing && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                    Confirm
                </Button>
            </form>
        </GuestLayout>
    );
}
