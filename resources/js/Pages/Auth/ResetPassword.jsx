import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

const inputClass = 'h-11 bg-background text-base md:text-base focus-visible:ring-2';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const field = (id, label, props) => (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                name={id}
                value={data[id]}
                onChange={(e) => setData(id, e.target.value)}
                aria-invalid={errors[id] ? true : undefined}
                aria-describedby={errors[id] ? `${id}-error` : undefined}
                className={inputClass}
                {...props}
            />
            <InputError id={`${id}-error`} message={errors[id]} />
        </div>
    );

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Choose a new password</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Enter it twice to make sure it is typed correctly.</p>

            <form onSubmit={submit} className="mt-6 space-y-5">
                {field('email', 'Email address', { type: 'email', autoComplete: 'username', required: true })}
                {field('password', 'New password', { type: 'password', autoComplete: 'new-password', autoFocus: true, required: true })}
                {field('password_confirmation', 'Confirm new password', { type: 'password', autoComplete: 'new-password', required: true })}

                <Button type="submit" disabled={processing} className="h-11 w-full text-base">
                    {processing && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                    Reset password
                </Button>
            </form>
        </GuestLayout>
    );
}
