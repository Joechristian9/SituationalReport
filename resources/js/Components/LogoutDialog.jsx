import { useEffect, useState } from 'react';
import { AlertTriangle, CloudOff, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { isAdmin } from '@/lib/offline/accounts';
import { logOut } from '@/lib/offline/auth';
import { canLock } from '@/lib/offline/lock';
import { allItems } from '@/lib/offline/store';
import { currentUser } from '@/lib/offline/context';

/**
 * Confirms logging out. A report account this phone remembers can log out, and back in, with
 * no internet. Any other account can't get back in without the server, so it needs internet
 * to log out too: say which applies before it happens.
 */
export default function LogoutDialog({ open, onOpenChange }) {
    const [unsent, setUnsent] = useState(0);
    const [online, setOnline] = useState(() => navigator.onLine);
    const [processing, setProcessing] = useState(false);
    const [needsInternet, setNeedsInternet] = useState(false);
    const user = currentUser();
    const stays = canLock(user?.email) && !isAdmin(user);

    useEffect(() => {
        if (!open) return;
        setOnline(navigator.onLine);
        setNeedsInternet(false);
        const userId = currentUser()?.id ?? null;
        allItems()
            .then((items) => setUnsent(items.filter((item) => item.userId === userId).length))
            .catch(() => setUnsent(0));
    }, [open]);

    const logout = async () => {
        setProcessing(true);
        setNeedsInternet(false);
        const result = await logOut().catch(() => 'needs-internet');
        if (result === 'done') return; // the page is reloading
        setProcessing(false);
        if (result === 'local') onOpenChange(false);
        else setNeedsInternet(true);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent centered className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Log out of this device?</DialogTitle>
                    <DialogDescription>
                        {stays
                            ? 'You can log in again on this phone, even without internet. Saved reports stay on this phone.'
                            : "You'll need an internet connection to log in again. Until then, the app won't open offline on this device."}
                    </DialogDescription>
                </DialogHeader>

                {unsent > 0 && (
                    <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                        <span>
                            {unsent} report{unsent === 1 ? '' : 's'} on this device {unsent === 1 ? "hasn't" : "haven't"} been sent yet. {unsent === 1 ? 'It stays' : 'They stay'} here and {unsent === 1 ? 'is' : 'are'} sent after you log in again.
                        </span>
                    </p>
                )}

                {!online && (
                    <p className="flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-sm text-foreground">
                        <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span>
                            {stays
                                ? "You're offline. You will be logged out on this phone now, and on the server when the connection returns."
                                : "You're offline. Logging out needs internet, so you can keep working for now."}
                        </span>
                    </p>
                )}

                {needsInternet && (
                    <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                        Logging out needs internet for this account.
                    </p>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" className="min-h-11 md:min-h-9" onClick={() => onOpenChange(false)}>
                        Stay logged in
                    </Button>
                    <Button type="button" variant="destructive" className="min-h-11 gap-1.5 md:min-h-9" disabled={processing || (!online && !stays)} onClick={logout}>
                        {processing ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
                        Log out
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
