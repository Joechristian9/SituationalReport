import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { answerConflicts, rowSummary, subscribeConflicts } from '@/lib/offline/conflicts';
import { cn } from '@/lib/utils';

const CHOICES = [
    { value: 'mine', label: 'Keep mine', hint: "Save this device's version over it." },
    { value: 'theirs', label: 'Use theirs', hint: 'Drop my change to this row.' },
];

/**
 * Asks which version to keep when rows were changed on another device after this one loaded
 * them. Nothing is saved until every row has an answer; closing it saves nothing.
 */
export default function EditConflictDialog() {
    const [question, setQuestion] = useState(null);
    const [choices, setChoices] = useState({});

    useEffect(
        () =>
            subscribeConflicts((next) => {
                setQuestion(next);
                setChoices({});
            }),
        [],
    );

    const rowsById = new Map((question?.rows ?? []).map((row) => [String(row.id), row]));
    const answered = question?.conflicts.every((conflict) => choices[conflict.id]);

    return (
        <Dialog open={Boolean(question)} onOpenChange={(open) => !open && answerConflicts(null)}>
            <DialogContent centered className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Changed on another device</DialogTitle>
                    <DialogDescription>
                        {question?.label ? `${question.label}: ` : ''}
                        {question?.conflicts.length === 1 ? 'this row was' : 'these rows were'} changed somewhere else after this device loaded{' '}
                        {question?.conflicts.length === 1 ? 'it' : 'them'}. Choose which version to keep. Nothing is saved until you do.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {question?.conflicts.map((conflict) => (
                        <fieldset key={conflict.id} className="space-y-2 rounded-lg border border-border p-3">
                            <legend className="px-1 text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{rowSummary(rowsById.get(String(conflict.id)))}</legend>
                            <p className="text-sm text-muted-foreground">
                                Changed {formatDistanceToNow(new Date(conflict.changedAt), { addSuffix: true })}{' '}
                                {conflict.byYou ? 'on another device of this account' : 'by another account'}.
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {CHOICES.map((choice) => (
                                    <label
                                        key={choice.value}
                                        className={cn(
                                            'flex min-h-11 cursor-pointer items-start gap-2 rounded-md border border-border p-2.5 text-sm transition-colors focus-within:ring-2 focus-within:ring-ring',
                                            choices[conflict.id] === choice.value ? 'border-primary bg-primary/10' : 'hover:bg-muted',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name={`conflict-${conflict.id}`}
                                            value={choice.value}
                                            checked={choices[conflict.id] === choice.value}
                                            onChange={() => setChoices((current) => ({ ...current, [conflict.id]: choice.value }))}
                                            className="mt-0.5 h-4 w-4 shrink-0 text-primary focus:ring-0"
                                        />
                                        <span>
                                            <span className="block font-medium text-foreground">{choice.label}</span>
                                            <span className="block text-muted-foreground">{choice.hint}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    ))}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" className="min-h-11 md:min-h-9" onClick={() => answerConflicts(null)}>
                        Not now
                    </Button>
                    <Button type="button" className="min-h-11 md:min-h-9" disabled={!answered} onClick={() => answerConflicts(choices)}>
                        Save with these choices
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
