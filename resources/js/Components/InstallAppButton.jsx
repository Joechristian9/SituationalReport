import React, { useEffect, useState } from 'react';
import { Download, PlusSquare, Share } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/Components/ui/sidebar';
import { canPromptInstall, isInstalled, isIos, promptInstall, subscribeInstall } from '@/lib/pwa';

function useInstallState() {
    const read = () => ({ installed: isInstalled(), canPrompt: canPromptInstall(), ios: isIos() });
    const [state, setState] = useState(read);
    useEffect(() => subscribeInstall(() => setState(read())), []);
    return state;
}

function IosSteps({ open, onOpenChange }) {
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

/**
 * "Download app": installs the system on a phone (home-screen icon, opens offline).
 * Hidden when already installed or when the browser can't install it.
 * variant="sidebar" for the app sidebar, "card" for the login page.
 */
export default function InstallAppButton({ variant = 'card' }) {
    const { installed, canPrompt, ios } = useInstallState();
    const [showSteps, setShowSteps] = useState(false);

    if (installed || (!canPrompt && !ios)) return null;

    const install = () => (canPrompt ? promptInstall() : setShowSteps(true));

    if (variant === 'sidebar') {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={install} tooltip="Download app" className="text-white hover:bg-white/10 hover:text-white">
                        <Download aria-hidden="true" />
                        <span>Download app</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <IosSteps open={showSteps} onOpenChange={setShowSteps} />
            </SidebarMenu>
        );
    }

    return (
        <div className="space-y-2">
            <Button type="button" variant="outline" className="min-h-11 w-full gap-2" onClick={install}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Download app
            </Button>
            <p className="text-center text-xs text-muted-foreground">Install on your phone for quick access and offline reporting.</p>
            <IosSteps open={showSteps} onOpenChange={setShowSteps} />
        </div>
    );
}
