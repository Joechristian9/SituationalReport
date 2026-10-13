import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { Archive, Eye, FileDown, FileText, History, Loader2, Lock, Pause, Play, StopCircle, Unlock } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { cn } from '@/lib/utils';

const ACTIONS = {
    pause: {
        icon: Pause,
        iconClass: 'bg-warning/10 text-warning',
        buttonClass: 'bg-warning text-warning-foreground hover:bg-warning/90',
        title: 'Pause reporting',
        lead: (name) => <>Pause <strong className="font-semibold text-foreground">{name}</strong> while you review the data? You can resume at any time.</>,
        effects: [
            { icon: Lock, text: 'Forms close for all field users until you resume.' },
            { icon: Eye, text: 'Reports and dashboards stay viewable.' },
            { icon: FileDown, text: 'You can download a snapshot PDF while paused.' },
        ],
        confirm: 'Pause reporting',
        pending: 'Pausing…',
    },
    resume: {
        icon: Play,
        iconClass: 'bg-success/10 text-success',
        buttonClass: 'bg-success text-success-foreground hover:bg-success/90',
        title: 'Resume reporting',
        lead: (name) => <>Reopen <strong className="font-semibold text-foreground">{name}</strong> for data entry?</>,
        effects: [
            { icon: Unlock, text: 'Forms reopen for all field users.' },
            { icon: History, text: 'Reporting continues in the same disaster. Nothing is lost.' },
        ],
        confirm: 'Resume reporting',
        pending: 'Resuming…',
    },
    end: {
        icon: StopCircle,
        iconClass: 'bg-destructive/10 text-destructive',
        variant: 'destructive',
        title: 'End disaster',
        lead: (name) => <>End <strong className="font-semibold text-foreground">{name}</strong>? This is final. An ended disaster cannot be reopened.</>,
        effects: [
            { icon: Lock, text: 'Forms close permanently for all field users.' },
            { icon: Archive, text: 'The disaster moves to history with the status Ended.' },
            { icon: FileText, text: 'The final PDF report is prepared in the background. Download it from the history table.' },
        ],
        acknowledge: 'I have checked that all barangay and office reports are in.',
        confirm: 'End disaster',
        pending: 'Ending…',
    },
};

/**
 * Confirms pausing, resuming or ending a disaster. `action` is 'pause' | 'resume' | 'end' | null;
 * `onActionChange(null)` closes it, and the end dialog can switch to 'pause' as the reversible option.
 */
export default function DisasterLifecycleDialog({ action, disaster, onActionChange }) {
    const [pending, setPending] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);
    const config = ACTIONS[action];

    useEffect(() => setAcknowledged(false), [action]);

    // Keep showing the last action and name while the dialog animates closed, since the
    // page reloads (and may drop the disaster) as soon as the request succeeds.
    const [shownAction, setShownAction] = useState({ config, name: disaster?.name });
    useEffect(() => {
        if (config) setShownAction({ config, name: disaster?.name });
    }, [config, disaster?.name]);
    const shown = shownAction.config;

    const close = () => {
        if (!pending) onActionChange(null);
    };

    const submit = async () => {
        setPending(true);
        try {
            const { data } = await axios.post(route(`disasters.${action}`, disaster.id));
            onActionChange(null);
            router.reload({ only: ['typhoons', 'typhoon'] });
            toast.success(data.message, action === 'end' ? { description: 'The final PDF report will be ready in the history table shortly.' } : undefined);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setPending(false);
        }
    };

    if (!shown) return null;

    const Icon = shown.icon;
    const needsAck = Boolean(shown.acknowledge);
    const canPauseInstead = action === 'end' && disaster?.status === 'active';

    return (
        <Dialog open={Boolean(config)} onOpenChange={(open) => !open && close()}>
            <DialogContent
                className="max-h-[90dvh] gap-3 overflow-y-auto p-4 sm:max-w-md sm:gap-4 sm:p-6"
                onInteractOutside={(e) => pending && e.preventDefault()}
                onEscapeKeyDown={(e) => pending && e.preventDefault()}
            >
                <DialogHeader className="space-y-1.5 pr-8 text-left">
                    <div className="flex items-center gap-2.5">
                        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', shown.iconClass)}>
                            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                        </span>
                        <DialogTitle className="text-base font-semibold text-foreground sm:text-lg">{shown.title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm leading-snug text-muted-foreground">
                        {shown.lead(shownAction.name)}
                    </DialogDescription>
                </DialogHeader>

                {/* What happens: a plain compact list, boxed only from sm up. */}
                <ul className="space-y-2 sm:space-y-3 sm:rounded-lg sm:border sm:border-border sm:bg-muted/40 sm:p-4">
                    {shown.effects.map(({ icon: EffectIcon, text }) => (
                        <li key={text} className="flex gap-2.5 text-sm leading-snug text-foreground">
                            <EffectIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            {text}
                        </li>
                    ))}
                </ul>

                {needsAck && (
                    <label
                        htmlFor="disaster-lifecycle-ack"
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2"
                    >
                        <Checkbox
                            id="disaster-lifecycle-ack"
                            checked={acknowledged}
                            onCheckedChange={setAcknowledged}
                            disabled={pending}
                        />
                        <span className="flex-1 text-sm leading-snug text-foreground">{shown.acknowledge}</span>
                    </label>
                )}

                {/* Phones: Cancel and the action share one row instead of stacking. */}
                <DialogFooter className="grid grid-cols-2 gap-2 pt-1 sm:flex sm:flex-row sm:items-center">
                    {canPauseInstead && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onActionChange('pause')}
                            disabled={pending}
                            className="hidden sm:mr-auto sm:inline-flex sm:min-h-9"
                        >
                            <Pause className="mr-2 h-4 w-4" aria-hidden="true" />
                            Pause instead
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={close}
                        disabled={pending}
                        className="min-h-11 w-full sm:min-h-9 sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant={shown.variant}
                        onClick={submit}
                        disabled={pending || (needsAck && !acknowledged)}
                        aria-busy={pending}
                        className={cn('min-h-11 w-full px-3 sm:min-h-9 sm:w-auto sm:px-4', shown.buttonClass)}
                    >
                        {pending ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        ) : (
                            <Icon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                        )}
                        {pending ? shown.pending : shown.confirm}
                    </Button>
                </DialogFooter>

                {/* Phones: the reversible option as a quiet link under the buttons. */}
                {canPauseInstead && (
                    <button
                        type="button"
                        onClick={() => onActionChange('pause')}
                        disabled={pending}
                        className="-mt-1 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 sm:hidden"
                    >
                        <Pause className="h-4 w-4" aria-hidden="true" />
                        Pause instead
                    </button>
                )}
            </DialogContent>
        </Dialog>
    );
}
