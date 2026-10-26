import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AlertCircle, BellRing, History, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { cn } from '@/lib/utils';

const NOTE_LIMIT = 200;
const SUGGESTION_LIMIT = 4;
const RECENT_KEY = 'reminder-recent-messages';
const RECENT_KEPT = 3;
// Forms shown before the rest fold behind "+N more" (the bell does the same).
const FORMS_SHOWN = 6;

// Ready-made messages the admin can pick instead of typing one; `what` names the forms to submit.
export const SUGGESTIONS = [
    (what) => `Please submit your ${what} as soon as possible.`,
    (what) => `Please submit your ${what} before noon today.`,
    (what) => `Kindly complete your ${what} by the end of the day.`,
    (what) => `The disaster report is still open. Please submit your ${what}.`,
];

// "Roads form", "Roads and Bridges forms", "Roads, Bridges and Water Levels forms".
const formsPhrase = (labels) =>
    labels.length === 0
        ? 'pending forms'
        : `${labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`} ${labels.length === 1 ? 'form' : 'forms'}`;

// Names the forms while the message fits the limit, otherwise counts them.
export const suggestionText = (make, labels) => {
    const named = make(formsPhrase(labels));
    return named.length <= NOTE_LIMIT ? named : make(`${labels.length} pending forms`);
};

const readRecent = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
        return Array.isArray(stored) ? stored.filter((text) => typeof text === 'string').slice(0, RECENT_KEPT) : [];
    } catch {
        return [];
    }
};

const rememberMessage = (text) => {
    try {
        const next = [text, ...readRecent().filter((item) => item !== text)].slice(0, RECENT_KEPT);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
        // Private mode or blocked storage: the message just isn't remembered.
    }
};

/**
 * Confirms a reminder to the accounts in `users` (accounts with forms still to submit) and
 * sends it with an optional message. `onSent` runs after the server accepted it.
 */
export default function RemindDialog({ users, onClose, onSent }) {
    const [note, setNote] = useState('');
    const [sending, setSending] = useState(false);
    const [recent, setRecent] = useState([]);
    const [allForms, setAllForms] = useState(false);
    const open = users !== null;

    useEffect(() => {
        if (open) {
            setNote('');
            setRecent(readRecent());
            setAllForms(false);
        }
    }, [open]);

    const one = users?.length === 1 ? users[0] : null;

    // The forms the suggestions name. The message is shared, so with several accounts it names
    // them only when every account misses the same forms; otherwise it says "pending forms".
    const formLabels = useMemo(() => {
        const first = users?.[0]?.pending_forms ?? [];
        return users?.every((user) => user.pending_forms?.join('|') === first.join('|')) ? first : [];
    }, [users]);

    // Autocomplete: recent messages first, then the ready-made ones naming the forms, narrowed by what is typed.
    const suggestions = useMemo(() => {
        const typed = note.trim().toLowerCase();
        const ready = SUGGESTIONS.map((make) => suggestionText(make, formLabels)).filter((text) => !recent.includes(text));
        return [...recent.map((text) => ({ text, recent: true })), ...ready.map((text) => ({ text, recent: false }))]
            .filter(({ text }) => text !== note && (!typed || text.toLowerCase().includes(typed)))
            .slice(0, SUGGESTION_LIMIT);
    }, [note, recent, formLabels]);

    const send = async () => {
        setSending(true);
        const message = note.trim();
        try {
            const { data } = await axios.post(route('admin.form-reminders.store'), {
                user_ids: users.map((user) => user.id),
                note: message || null,
            });
            if (message) rememberMessage(message);
            const parts = [];
            if (data.notified > 0) parts.push(`Reminded ${data.notified} ${data.notified === 1 ? 'account' : 'accounts'}`);
            if (data.skipped_recent > 0) parts.push(`${data.skipped_recent} skipped, reminded within the last hour`);
            (data.notified > 0 ? toast.success : toast.info)(parts.join('. ') || 'No one needed a reminder.');
            onSent();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data?.errors?.note?.[0] || 'Could not send the reminder. Try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !next && !sending && onClose()}>
            <DialogContent centered className="sm:max-w-md">
                {/* Icon beside the title, not above it: on phones the message and Send stay in view. */}
                <DialogHeader className="flex-row items-start gap-3 space-y-0">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
                        <BellRing className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 space-y-1">
                        <DialogTitle className="break-words">
                            {one
                                ? `Remind ${one.name} to submit ${one.pending_forms.length} ${one.pending_forms.length === 1 ? 'form' : 'forms'}?`
                                : `Remind ${users?.length ?? 0} accounts?`}
                        </DialogTitle>
                        <DialogDescription>
                            {one
                                ? 'They get a reminder in the app listing these forms.'
                                : 'Each gets a reminder in the app with its own missing forms. Anyone reminded in the last hour is skipped.'}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                {one && (
                    <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
                        <p id="reminder-forms" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <AlertCircle className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                            Still to submit
                        </p>
                        {/* Neutral chips: fifteen warning-colored pills drown out the warning itself. */}
                        <ul className="flex flex-wrap items-center gap-1.5" aria-labelledby="reminder-forms">
                            {(allForms ? one.pending_forms : one.pending_forms.slice(0, FORMS_SHOWN)).map((form) => (
                                <li key={form} className="rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground">
                                    {form}
                                </li>
                            ))}
                            {one.pending_forms.length > FORMS_SHOWN && (
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => setAllForms((value) => !value)}
                                        aria-expanded={allForms}
                                        className="inline-flex min-h-9 items-center rounded-full px-2 text-xs font-medium text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-7"
                                    >
                                        {allForms ? 'Show less' : `+${one.pending_forms.length - FORMS_SHOWN} more`}
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                        <Label htmlFor="reminder-note">Message (optional)</Label>
                        <span id="reminder-note-count" className="text-xs tabular-nums text-muted-foreground">
                            {note.length}/{NOTE_LIMIT}
                        </span>
                    </div>
                    <Textarea
                        id="reminder-note"
                        value={note}
                        onChange={(event) => setNote(event.target.value.slice(0, NOTE_LIMIT))}
                        placeholder="Type a message, or pick a suggestion below"
                        rows={3}
                        maxLength={NOTE_LIMIT}
                        aria-describedby="reminder-note-count"
                    />

                    {suggestions.length > 0 && (
                        <div>
                            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{note.trim() ? 'Matching suggestions' : 'Suggestions'}</p>
                            <ul className="space-y-1.5" aria-label="Suggested messages">
                                {suggestions.map(({ text, recent: isRecent }) => (
                                    <li key={text}>
                                        <button
                                            type="button"
                                            onClick={() => setNote(text)}
                                            className={cn(
                                                'flex min-h-11 w-full items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm text-foreground',
                                                'transition-colors hover:border-primary/40 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none md:min-h-9',
                                            )}
                                        >
                                            {isRecent && <History className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-label="Sent before" />}
                                            <span className="min-w-0 break-words">{text}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={sending} className="h-11 md:h-9">
                        Cancel
                    </Button>
                    <Button type="button" onClick={send} disabled={sending} className="h-11 gap-2 md:h-9">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                        {sending ? 'Sending…' : 'Send reminder'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
