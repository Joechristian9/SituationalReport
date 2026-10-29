import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { CloudOff, Loader2, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import useOnline from '@/hooks/useOnline';
import { clearPrepared, preparedPhone, removePrepared, savePrepared, subscribePrepared } from '@/lib/offline/prepared';
import { cn } from '@/lib/utils';

const names = (list) => list.map((account) => account.name).join(', ');

/**
 * Prepares the phone this page is open on, so the chosen report accounts can sign in here with
 * no internet for 30 days (lib/offline/prepared.js). Admin accounts are never offered.
 */
export default function PrepareDeviceDialog({ open, onOpenChange, users }) {
    const online = useOnline();
    const [phone, setPhone] = useState(preparedPhone);
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => subscribePrepared(() => setPhone(preparedPhone())), []);
    useEffect(() => {
        if (!open) return;
        setPhone(preparedPhone());
        setSelected([]);
        setSearch('');
    }, [open]);

    const reportAccounts = useMemo(() => users.filter((user) => !user.roles?.includes('admin')), [users]);
    const shown = useMemo(() => {
        const query = search.trim().toLowerCase();
        return query ? reportAccounts.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query)) : reportAccounts;
    }, [reportAccounts, search]);
    const prepared = Object.values(phone?.accounts ?? {});

    const toggle = (id) => setSelected((current) => (current.includes(id) ? current.filter((other) => other !== id) : [...current, id]));

    const prepare = async () => {
        setBusy(true);
        try {
            const { data } = await axios.get(route('admin.offline-accounts'), { params: { ids: selected } });
            if (data.accounts.length > 0) {
                savePrepared(data);
                toast.success(`Can sign in on this phone without internet until ${format(new Date(data.expiresAt), 'MMM d')}: ${names(data.accounts.map((account) => account.user))}.`);
            }
            if (data.notReady.length > 0) {
                toast.warning(`Not prepared: ${names(data.notReady)}. Give them a password of at least 12 characters first.`);
            }
            setSelected([]);
        } catch {
            toast.error('Could not prepare this phone. Check the connection and try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent centered className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Prepare this phone</DialogTitle>
                    <DialogDescription>
                        Do this on the phone that goes to the field. The accounts you choose can then sign in on it without internet for 30 days,
                        with blank forms. Their reports are sent when the phone is back online. Log out when you're done, so the phone opens on
                        the sign-in page.
                    </DialogDescription>
                </DialogHeader>

                {prepared.length > 0 && (
                    <section aria-labelledby="prepared-heading" className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <h3 id="prepared-heading" className="text-sm font-semibold text-foreground">
                                On this phone ({prepared.length})
                            </h3>
                            <Button type="button" variant="ghost" size="sm" className="min-h-11 text-destructive md:min-h-8" onClick={clearPrepared}>
                                Remove all
                            </Button>
                        </div>
                        <ul className="divide-y divide-border rounded-lg border border-border">
                            {prepared.map(({ user, expiresAt }) => (
                                <li key={user.email} className="flex items-center justify-between gap-2 px-3 py-2">
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
                                        <span className="block text-xs text-muted-foreground">Until {format(new Date(expiresAt), 'MMM d, yyyy')}</span>
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-11 w-11 shrink-0 text-destructive md:h-9 md:w-9"
                                        aria-label={`Remove ${user.name} from this phone`}
                                        onClick={() => removePrepared(user.email)}
                                    >
                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section aria-labelledby="choose-heading" className="space-y-2">
                    <h3 id="choose-heading" className="text-sm font-semibold text-foreground">
                        {prepared.length > 0 ? 'Add or renew accounts' : 'Choose accounts'}
                    </h3>
                    <Label htmlFor="prepare-search" className="sr-only">
                        Search accounts
                    </Label>
                    <Input id="prepare-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" className="h-11 md:h-9" />
                    <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
                        {shown.map((user) => (
                            <li key={user.id}>
                                <label
                                    className={cn(
                                        'flex min-h-11 items-center gap-3 px-3 py-2',
                                        user.offlineReady ? 'cursor-pointer hover:bg-muted' : 'cursor-not-allowed opacity-60',
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(user.id)}
                                        disabled={!user.offlineReady}
                                        onChange={() => toggle(user.id)}
                                        aria-describedby={user.offlineReady ? undefined : `not-ready-${user.id}`}
                                        className="h-5 w-5 shrink-0 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                                    />
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {user.offlineReady ? user.email : <span id={`not-ready-${user.id}`}>Not ready: needs a password of 12+ characters</span>}
                                        </span>
                                    </span>
                                </label>
                            </li>
                        ))}
                        {shown.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted-foreground">No report accounts match.</li>}
                    </ul>
                </section>

                {!online && (
                    <p className="flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-sm text-foreground">
                        <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        Preparing needs internet.
                    </p>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" className="min-h-11 md:min-h-9" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button type="button" className="min-h-11 gap-1.5 md:min-h-9" disabled={!online || busy || selected.length === 0} onClick={prepare}>
                        {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Smartphone className="h-4 w-4" aria-hidden="true" />}
                        Prepare {selected.length > 0 ? `${selected.length} account${selected.length === 1 ? '' : 's'}` : 'accounts'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
