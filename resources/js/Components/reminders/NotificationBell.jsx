import { memo, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { formatDistanceToNowStrict } from 'date-fns';
import { AlertCircle, Bell, BellRing, ChevronRight, ClipboardList, Pause } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';

const QUERY_KEY = ['reminders'];
const SEEN_KEY = 'bell-notice-seen';

const readSeen = () => {
    try {
        return localStorage.getItem(SEEN_KEY);
    } catch {
        return null;
    }
};
const writeSeen = (signature) => {
    try {
        localStorage.setItem(SEEN_KEY, signature);
    } catch {
        // Private mode or blocked storage: the badge just shows again next time.
    }
};

/** Why forms are closed (no disaster, or paused). Counts on the badge until it has been read once. */
function Notice({ notice }) {
    const Icon = notice.kind === 'paused' ? Pause : AlertCircle;
    return (
        <div className="m-3 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning" aria-hidden="true">
                <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug text-foreground">{notice.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{notice.message}</p>
            </div>
        </div>
    );
}
// Forms shown before the rest fold behind "+N more".
const FORMS_SHOWN = 4;

/**
 * One reminder: what is missing, for which disaster, who asked, and their message.
 */
const Reminder = memo(function Reminder({ item, isNew }) {
    const [expanded, setExpanded] = useState(false);
    const forms = expanded ? item.forms : item.forms.slice(0, FORMS_SHOWN);
    const hidden = item.forms.length - FORMS_SHOWN;

    return (
        <li className={cn('relative space-y-2.5 px-4 py-3.5', isNew && 'bg-accent/40')}>
            {isNew && <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />}
            <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning" aria-hidden="true">
                    <ClipboardList className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-foreground">
                            {item.forms.length} {item.forms.length === 1 ? 'form' : 'forms'} still to submit
                        </p>
                        <time dateTime={item.sent_at} className="shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
                            {formatDistanceToNowStrict(new Date(item.sent_at), { addSuffix: true })}
                        </time>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.disaster}
                        {item.sent_by ? ` · from ${item.sent_by}` : ''}
                        {isNew && <span className="ml-1.5 rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">New</span>}
                    </p>
                </div>
            </div>

            {item.note && <p className="break-words rounded-lg bg-muted px-3 py-2 text-sm text-foreground">{item.note}</p>}

            <ul className="flex flex-wrap gap-1.5" aria-label="Forms still to submit">
                {forms.map((form) => (
                    <li key={form} className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                        {form}
                    </li>
                ))}
                {hidden > 0 && (
                    <li>
                        <button
                            type="button"
                            onClick={() => setExpanded((value) => !value)}
                            aria-expanded={expanded}
                            className="rounded-full px-2 py-0.5 text-xs font-medium text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {expanded ? 'Show less' : `+${hidden} more`}
                        </button>
                    </li>
                )}
            </ul>
        </li>
    );
});

/**
 * The one bell in the app header of report accounts: why forms are closed (no disaster,
 * or paused) on top, then the admin's reminders to submit the forms still missing.
 * Quiet when there is nothing to show, and when offline.
 */
export default function NotificationBell() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [seenNotice, setSeenNotice] = useState(readSeen);
    // Reminders that were unread when the bell was opened keep their highlight while it stays open.
    const fresh = useRef(new Set());

    // Polling pauses while the tab is hidden (react-query default) and resumes on focus.
    const { data } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => (await axios.get(route('notifications.index'))).data,
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
        refetchOnWindowFocus: true,
        retry: false,
    });
    const items = data?.items ?? [];
    const notice = data?.notice ?? null;
    const noticeSignature = notice ? `${notice.kind}:${notice.disaster_id ?? 0}` : null;
    const noticeUnseen = noticeSignature !== null && seenNotice !== noticeSignature;
    const unread = data?.unread ?? 0;
    const badge = unread + (noticeUnseen ? 1 : 0);

    // Optimistic: the badge clears as the bell opens. The notice stays in the cached data.
    const markRead = useMutation({
        mutationFn: async () => (await axios.post(route('notifications.read'))).data,
        onMutate: () =>
            queryClient.setQueryData(QUERY_KEY, (current) =>
                current && { ...current, unread: 0, items: current.items.map((item) => ({ ...item, read: true })) },
            ),
        onError: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    });

    const onOpenChange = (next) => {
        setOpen(next);
        if (next && noticeUnseen) {
            writeSeen(noticeSignature);
            setSeenNotice(noticeSignature);
        }
        if (next && unread > 0) {
            fresh.current = new Set(items.filter((item) => !item.read).map((item) => item.id));
            markRead.mutate();
        }
    };

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="relative h-11 w-11 shrink-0 md:h-9 md:w-9"
                    aria-label={badge > 0 ? `Notifications, ${badge} unread` : 'Notifications'}
                >
                    {badge > 0 ? <BellRing className="h-5 w-5" aria-hidden="true" /> : <Bell className="h-5 w-5" aria-hidden="true" />}
                    {badge > 0 && (
                        <span
                            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none tabular-nums text-destructive-foreground md:right-0 md:top-0"
                            aria-hidden="true"
                        >
                            {badge > 9 ? '9+' : badge}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={8}
                collisionPadding={16}
                className="flex max-h-[var(--radix-popover-content-available-height)] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl p-0 shadow-lg"
            >
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Notifications</p>
                        <p className="text-xs text-muted-foreground">Disaster status and reports an admin asked you to submit</p>
                    </div>
                    {items.length > 0 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">{items.length}</span>
                    )}
                </div>

                {notice && <Notice notice={notice} />}

                {items.length === 0 && !notice ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Bell className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
                        <p className="text-xs text-muted-foreground">New reminders from an admin show up here.</p>
                    </div>
                ) : items.length === 0 ? null : (
                    <div className="flex min-h-0 flex-1 flex-col">
                        {notice && (
                            <p className="shrink-0 px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Reminders from an admin
                            </p>
                        )}
                        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
                            {items.map((item) => (
                                <Reminder key={item.id} item={item} isNew={fresh.current.has(item.id)} />
                            ))}
                        </ul>
                    </div>
                )}

                {items.length > 0 && (
                    <div className="shrink-0 border-t border-border bg-muted/30 p-3">
                        <Button asChild className="h-11 w-full gap-1 md:h-9">
                            <Link href={route('situation-reports.index')} onClick={() => setOpen(false)}>
                                {notice ? 'View my reports' : 'Go to reports'}
                                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
