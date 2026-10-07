import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { AlertTriangle, CloudOff, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { clearOfflinePages } from '@/lib/offline/install';
import { allItems } from '@/lib/offline/store';
import { currentUser } from '@/lib/offline/context';

/**
 * Confirms logging out. Logging out deletes the pages saved for offline use, so the app
 * can't open without internet until the next online login: say so before it happens.
 */
export default function LogoutDialog({ open, onOpenChange }) {
    const [unsent, setUnsent] = useState(0);
    const [online, setOnline] = useState(() => navigator.onLine);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!open) return;
        setOnline(navigator.onLine);
        const userId = currentUser()?.id ?? null;
        allItems()
            .then((items) => setUnsent(items.filter((item) => item.userId === userId).length))
            .catch(() => setUnsent(0));
    }, [open]);

    const logout = () => {
        router.post(
            route('logout'),
            {},
            {
                onStart: () => setProcessing(true),
                // Only once the server has logged the user out: if the request fails, they
                // are still signed in and keep their offline pages.
                onSuccess: async () => {
                    await clearOfflinePages();
                    // Full page load so the next login starts with a fresh CSRF token.
                    window.location.href = '/';
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Log out of this phone?</DialogTitle>
                    <DialogDescription>
                        After logging out, the app won't open without internet until you log in again with a connection.
                    </DialogDescription>
                </DialogHeader>

                {unsent > 0 && (
                    <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                        <span>
                            {unsent} report{unsent === 1 ? '' : 's'} on this phone {unsent === 1 ? "hasn't" : "haven't"} been sent yet. {unsent === 1 ? 'It stays' : 'They stay'} here and {unsent === 1 ? 'is' : 'are'} sent after you log in again.
                        </span>
                    </p>
                )}

                {!online && (
                    <p className="flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-sm text-foreground">
                        <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span>You're offline. Logging out needs internet, so you can keep working for now.</span>
                    </p>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" className="min-h-11 md:min-h-9" onClick={() => onOpenChange(false)}>
                        Stay logged in
                    </Button>
                    <Button type="button" variant="destructive" className="min-h-11 gap-1.5 md:min-h-9" disabled={!online || processing} onClick={logout}>
                        {processing ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
                        Log out
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
