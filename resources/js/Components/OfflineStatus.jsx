import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle2, ChevronDown, CloudOff, Copy, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { allItems, removeItem, subscribe } from '@/lib/offline/store';
import { canRefreshWithoutLosingEdits, refreshPage, subscribeSync, syncNow, syncState } from '@/lib/offline/sync';
import { currentUser } from '@/lib/offline/context';
import { cn } from '@/lib/utils';

const STATUS = {
    pending: { label: 'Waiting to send', tone: 'border-warning/30 bg-warning/10 text-warning' },
    waiting: { label: 'Waiting: disaster paused', tone: 'border-warning/30 bg-warning/10 text-warning' },
    failed: { label: 'Not sent', tone: 'border-destructive/30 bg-destructive/10 text-destructive' },
};

// The pill floats over the page, so its background stays opaque (bg-card); the status
// colour goes on the border, icon and text.
const TONE = {
    warning: 'border-warning/40 text-warning',
    destructive: 'border-destructive/40 text-destructive',
    success: 'border-success/40 text-success',
    neutral: 'border-border text-foreground',
};

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

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

// The status is fixed to the bottom of the screen; publish its height so app.css can pad
// the page by the same amount and the form's submit button never sits underneath it.
function useReservedBottomSpace(node) {
    useEffect(() => {
        if (!node) return undefined;
        const root = document.documentElement;
        let last = '';
        const observer = new ResizeObserver(() => {
            const value = `${Math.ceil(window.innerHeight - node.getBoundingClientRect().top) + 16}px`;
            // Each write restyles the whole page, so skip it when nothing changed.
            if (value === last) return;
            last = value;
            root.style.setProperty('--offline-status-h', value);
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
 * One small status pill for offline use. Saving offline and sending later happen on
 * their own; the pill only says what is going on, and asks for something only when a
 * save failed, the session expired, or a refresh would discard what the user typed.
 */
export default function OfflineStatus() {
    const online = useOnline();
    const [items, setItems] = useState([]);
    const [sync, setSync] = useState(syncState);
    const [notice, setNotice] = useState(null);
    const [announcement, setAnnouncement] = useState('');
    const [askRefresh, setAskRefresh] = useState(false);
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
            // Sent saves came from this page and the user typed since: refreshing on our
            // own would discard that, so ask. Otherwise install.js refreshes by itself.
            setAskRefresh(!next.running && next.reloadNeeded && !canRefreshWithoutLosingEdits());
        });
        const stopNavigate = router.on('navigate', () => {
            setUserId(currentUser()?.id ?? null);
            setAskRefresh(false);
            load();
        });

        let timer;
        let sentCount = 0;
        const onQueued = (event) => setAnnouncement(`${event.detail.label} saved on this device. It will be sent when you're back online.`);
        const onSent = () => {
            sentCount += 1;
            const text = `${plural(sentCount, 'report')} sent`;
            setNotice(text);
            setAnnouncement(text);
            clearTimeout(timer);
            timer = setTimeout(() => {
                setNotice(null);
                sentCount = 0;
            }, 4000);
        };
        const onReload = () => setAskRefresh(true);
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

    // One message at a time, most important first.
    let pill = null;
    if (sync.loginNeeded && waiting) {
        pill = { tone: 'warning', icon: AlertTriangle, text: `Session expired. Log in to send ${plural(waiting, 'saved report')}.`, action: 'login' };
    } else if (askRefresh) {
        pill = { tone: 'neutral', icon: CheckCircle2, text: 'Offline reports sent. Refresh before saving again; changes typed since then are cleared.', action: 'refresh' };
    } else if (failed) {
        pill = { tone: 'destructive', icon: AlertTriangle, text: `${failed} not sent · Review` };
    } else if (!online) {
        pill = { tone: 'warning', icon: CloudOff, text: waiting ? `Offline · ${waiting} waiting to send` : 'Offline · you can keep working' };
    } else if (sync.running && waiting) {
        pill = { tone: 'neutral', icon: Loader2, spin: true, text: `Sending ${plural(waiting, 'report')}…` };
    } else if (notice) {
        pill = { tone: 'success', icon: CheckCircle2, text: notice };
    } else if (waiting) {
        pill = { tone: 'neutral', icon: UploadCloud, text: `${waiting} waiting to send` };
    }

    const liveRegion = (
        <span role="status" aria-live="polite" className="sr-only">
            {announcement}
        </span>
    );
    if (!pill) return liveRegion;

    const Icon = pill.icon;
    const icon = <Icon className={cn('h-4 w-4 shrink-0', pill.spin && 'animate-spin motion-reduce:animate-none')} aria-hidden="true" />;
    const expandable = items.length > 0 && !pill.action;

    return (
        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[90] flex max-w-[calc(100vw-2rem)] flex-col items-start gap-2 sm:max-w-sm">
            {liveRegion}

            {open && expandable && (
                <div id="offline-queue" className="max-h-[60vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border bg-card p-4 text-sm shadow-md sm:w-96">
                    <h2 className="font-semibold text-foreground">Saved on this device</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">These are sent automatically, oldest first, when the internet is back.</p>
                    <ul className="mt-1 divide-y">
                        {items.map((item) => (
                            <QueuedItem key={item.id} item={item} />
                        ))}
                    </ul>
                    {waiting > 0 && online && (
                        <Button type="button" size="sm" className="mt-2 min-h-11 w-full gap-1.5 md:min-h-9" disabled={sync.running} onClick={() => syncNow()}>
                            {sync.running ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
                            {sync.running ? 'Sending…' : 'Send now'}
                        </Button>
                    )}
                </div>
            )}

            <div ref={setCard}>
                {pill.action ? (
                    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium shadow-md', TONE[pill.tone])}>
                        <span className="flex min-w-0 items-start gap-2">
                            <span className="mt-0.5">{icon}</span>
                            <span className="text-foreground">{pill.text}</span>
                        </span>
                        {pill.action === 'login' ? (
                            <Button asChild size="sm" className="min-h-11 md:min-h-8">
                                <a href={route('login')}>Log in</a>
                            </Button>
                        ) : (
                            <Button type="button" size="sm" className="min-h-11 gap-1.5 md:min-h-8" onClick={refreshPage}>
                                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                Refresh
                            </Button>
                        )}
                    </div>
                ) : expandable ? (
                    <button
                        type="button"
                        onClick={() => setOpen((value) => !value)}
                        aria-expanded={open}
                        aria-controls="offline-queue"
                        className={cn(
                            'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border bg-card px-4 text-sm font-medium shadow-md transition-colors md:min-h-9',
                            'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
                            TONE[pill.tone],
                        )}
                    >
                        {icon}
                        <span>{pill.text}</span>
                        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none', open && 'rotate-180')} aria-hidden="true" />
                    </button>
                ) : (
                    <div className={cn('inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-4 text-sm font-medium shadow-md md:min-h-9', TONE[pill.tone])}>
                        {icon}
                        <span>{pill.text}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
