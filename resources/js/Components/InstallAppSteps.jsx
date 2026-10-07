import { PlusSquare, Share } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';

// Loaded on demand (see InstallSteps in InstallAppButton): only iPhone users who tap Install need it.
export default function InstallAppSteps({ open, onOpenChange }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Add Situational Report to your phone</DialogTitle>
                    <DialogDescription>On iPhone, install it from Safari's Share menu.</DialogDescription>
                </DialogHeader>
                <ol className="space-y-3 text-sm text-foreground">
                    <li className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-semibold tabular-nums">1</span>
                        <span>
                            Tap <Share className="inline h-4 w-4 align-text-bottom" aria-label="Share" /> <strong>Share</strong> at the bottom of Safari.
                        </span>
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-semibold tabular-nums">2</span>
                        <span>
                            Choose <PlusSquare className="inline h-4 w-4 align-text-bottom" aria-hidden="true" /> <strong>Add to Home Screen</strong>.
                        </span>
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-semibold tabular-nums">3</span>
                        <span>
                            Tap <strong>Add</strong>. The app icon appears on your home screen.
                        </span>
                    </li>
                </ol>
            </DialogContent>
        </Dialog>
    );
}
