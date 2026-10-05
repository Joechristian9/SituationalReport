import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle2, ChevronDown, CloudOff, Copy, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { allItems, removeItem, subscribe } from '@/lib/offline/store';
import { subscribeSync, syncNow, syncState } from '@/lib/offline/sync';
import { currentUser } from '@/lib/offline/context';
import { cn } from '@/lib/utils';

const STATUS = {
    pending: { label: 'Waiting to send', tone: 'border-warning/30 bg-warning/10 text-warning' },
    waiting: { label: 'Waiting: disaster paused', tone: 'border-warning/30 bg-warning/10 text-warning' },
    failed: { label: 'Not sent', tone: 'border-destructive/30 bg-destructive/10 text-destructive' },
};

function useOnline() {
    const [online, setOnline] = useState(() => navigator.onLine);
    useEffect(() => {
        const update = () => setOnline(navigator.onLine);
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        return () => {
            window.removeEventListener('online', update);
            window.removeEventListener('offline', update);
        };
    }, []);
    return online;
}

// The card is fixed to the bottom of the screen; publish its height so app.css can pad
// the page by the same amount and the form's submit button never sits underneath it.
function useReservedBottomSpace(node) {
    useEffect(() => {
        const root = document.documentElement;
        if (!node) {
            root.style.removeProperty('--offline-status-h');
            return undefined;
        }
        const observer = new ResizeObserver(() => {
            const fromBottom = window.innerHeight - node.getBoundingClientRect().top;
            root.style.setProperty('--offline-status-h', `${Math.ceil(fromBottom) + 16}px`);
        });
        observer.observe(node);
        return () => {
            observer.disconnect();
            root.style.removeProperty('--offline-status-h');
        };
    }, [node]);
}

function QueuedItem({ item }) {
    const [confirming, setConfirming] = useState(false);
    const [copied, setCopied] = useState(false);
    const status = STATUS[item.status] ?? STATUS.pending;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify({ form: item.label, disaster: item.disasterName, savedAt: new Date(item.savedAt).toISOString(), data: item.payload }, null, 2));
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    return (
        <li className="space-y-1.5 py-3">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                        {item.disasterName ? `${item.disasterName} · ` : ''}saved {formatDistanceToNow(new Date(item.savedAt), { addSuffix: true })}
                    </p>
                </div>
                <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium', status.tone)}>{status.label}</span>
            </div>
            {item.message && <p className="text-xs text-muted-foreground">{item.message}</p>}
            {item.status === 'failed' && (
                <div className="flex flex-wrap gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" className="min-h-11 gap-1.5 md:min-h-8" onClick={copy}>
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        {copied ? 'Copied' : 'Copy details'}
                    </Button>
                    {confirming ? (
                        <Button type="button" variant="destructive" size="sm" className="min-h-11 gap-1.5 md:min-h-8" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Yes, delete it
                        </Button>
                    ) : (
                        <Button type="button" variant="ghost" size="sm" className="min-h-11 gap-1.5 text-destructive md:min-h-8" onClick={() => setConfirming(true)}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
        </li>
    );
}

/**
 * Bottom-left status for offline use: shows when the device is offline, when saves
 * are waiting on this device, and what happened when they were sent.
 */
export default function OfflineStatus() {
    const online = useOnline();
    const [items, setItems] = useState([]);
    const [sync, setSync] = useState(syncState);
    const [notice, setNotice] = useState(null);
    const [reloadNeeded, setReloadNeeded] = useState(false);
    const [open, setOpen] = useState(false);
    const [userId, setUserId] = useState(() => currentUser()?.id ?? null);
    const [card, setCard] = useState(null);
    useReservedBottomSpace(card);

    useEffect(() => {
        const load = () => allItems().then((all) => setItems(all.filter((item) => item.userId === (currentUser()?.id ?? null)))).catch(() => setItems([]));
        load();
        const stopStore = subscribe(load);
        const stopSync = subscribeSync((next) => {
            setSync(next);
            if (next.reloadNeeded) setReloadNeeded(true);
        });
        const stopNavigate = router.on('navigate', () => {
            setUserId(currentUser()?.id ?? null);
            setReloadNeeded(false);
            load();
        });

        let timer;
        const flash = (text) => {
            setNotice(text);
            clearTimeout(timer);
            timer = setTimeout(() => setNotice(null), 5000);
        };
        const onQueued = (event) => flash(`${event.detail.label} saved on this device. It will be sent when you're back online.`);
        const onSent = (event) => flash(`${event.detail.label} report sent.`);
        const onReload = () => setReloadNeeded(true);
        window.addEventListener('offline:queued', onQueued);
        window.addEventListener('offline:sent', onSent);
        window.addEventListener('offline:reload-required', onReload);

        return () => {
            stopStore();
            stopSync();
            stopNavigate();
            clearTimeout(timer);
            window.removeEventListener('offline:queued', onQueued);
            window.removeEventListener('offline:sent', onSent);
            window.removeEventListener('offline:reload-required', onReload);
        };
    }, []);

    if (!userId) return null;

    const waiting = items.filter((item) => item.status !== 'failed').length;
    const failed = items.filter((item) => item.status === 'failed').length;
    if (online && !items.length && !notice && !reloadNeeded && !sync.loginNeeded) {
        return <span role="status" aria-live="polite" className="sr-only" />;
    }

    const summary = [waiting && `${waiting} waiting to send`, failed && `${failed} not sent`].filter(Boolean).join(' · ');

    return (
        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[90] flex w-[calc(100vw-2rem)] max-w-sm flex-col items-start gap-2">
            <span role="status" aria-live="polite" className="sr-only">
                {notice}
            </span>

            {open && items.length > 0 && (
                <div id="offline-queue" className="max-h-[60vh] w-full overflow-y-auto rounded-xl border bg-card p-4 text-sm shadow-lg">
                    <h2 className="font-semibold text-foreground">Saved on this device</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Reports are sent automatically, oldest first, when the internet is back.</p>
                    <ul className="mt-1 divide-y">
                        {items.map((item) => (
                            <QueuedItem key={item.id} item={item} />
                        ))}
                    </ul>
                    {waiting > 0 && (
                        <Button type="button" size="sm" className="mt-2 min-h-11 w-full gap-1.5 md:min-h-9" disabled={!online || sync.running} onClick={() => syncNow()}>
                            {sync.running ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
                            {online ? (sync.running ? 'Sending…' : 'Send now') : 'Waiting for internet'}
                        </Button>
                    )}
                </div>
            )}

            <div ref={setCard} className="w-full space-y-2 rounded-xl border bg-card p-3 text-sm shadow-lg">
                {!online && (
                    <p className="flex items-start gap-2 text-foreground">
                        <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                        <span>
                            <span className="font-semibold">You're offline.</span> You can keep filling in forms; saves stay on this device.
                        </span>
                    </p>
                )}

                {notice && (
                    <p className="flex items-start gap-2 text-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                        <span>{notice}</span>
                    </p>
                )}

                {reloadNeeded && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-foreground">Your offline reports were sent. Reload this page before editing those forms again.</p>
                        <Button type="button" size="sm" className="min-h-11 gap-1.5 md:min-h-8" onClick={() => window.location.reload()}>
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            Reload
                        </Button>
                    </div>
                )}

                {sync.loginNeeded && waiting > 0 && (
                    <p className="flex items-start gap-2 text-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                        <span>
                            Your session expired. <a href={route('login')} className="font-medium text-primary underline">Log in again</a> to send {waiting} saved report{waiting === 1 ? '' : 's'}.
                        </span>
                    </p>
                )}

                {items.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setOpen((value) => !value)}
                        aria-expanded={open}
                        aria-controls="offline-queue"
                        className={cn(
                            'flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 font-medium transition-colors hover:bg-muted md:min-h-9',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
                            failed ? 'text-destructive' : 'text-foreground',
                        )}
                    >
                        <span className="flex items-center gap-2">
                            {failed ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
                            {summary}
                        </span>
                        <ChevronDown className={cn('h-4 w-4 transition-transform motion-reduce:transition-none', open && 'rotate-180')} aria-hidden="true" />
                    </button>
                )}
            </div>
        </div>
    );
}
