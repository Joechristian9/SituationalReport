import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { Archive, Eye, FileDown, FileText, History, Loader2, Lock, Pause, Play, StopCircle, Unlock } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Label } from '@/Components/ui/label';
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
            router.reload({ only: ['typhoons', 'activeTyphoon', 'statusCounts'] });
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
                className="max-h-[90dvh] overflow-y-auto sm:max-w-md"
                onInteractOutside={(e) => pending && e.preventDefault()}
                onEscapeKeyDown={(e) => pending && e.preventDefault()}
            >
                <DialogHeader className="text-left">
                    <div className="flex items-center gap-3">
                        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', shown.iconClass)}>
                            <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <DialogTitle className="text-lg text-foreground">{shown.title}</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2 text-sm leading-relaxed text-muted-foreground">
                        {shown.lead(shownAction.name)}
                    </DialogDescription>
                </DialogHeader>

                <ul className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                    {shown.effects.map(({ icon: EffectIcon, text }) => (
                        <li key={text} className="flex gap-3 text-sm leading-snug text-foreground">
                            <EffectIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            {text}
                        </li>
                    ))}
                </ul>

                {needsAck && (
                    <div className="flex min-h-11 items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                        <Checkbox
                            id="disaster-lifecycle-ack"
                            checked={acknowledged}
                            onCheckedChange={setAcknowledged}
                            disabled={pending}
                            className="mt-0.5"
                        />
                        <Label htmlFor="disaster-lifecycle-ack" className="flex-1 cursor-pointer text-sm font-normal leading-snug text-foreground">
                            {shown.acknowledge}
                        </Label>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    {canPauseInstead && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onActionChange('pause')}
                            disabled={pending}
                            className="min-h-11 w-full sm:mr-auto sm:min-h-9 sm:w-auto"
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
                        className={cn('min-h-11 w-full sm:min-h-9 sm:w-auto', shown.buttonClass)}
                    >
                        {pending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        ) : (
                            <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                        )}
                        {pending ? shown.pending : shown.confirm}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
