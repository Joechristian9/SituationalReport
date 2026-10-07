import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Download, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { canPromptInstall, isInstalled, isIos, promptInstall, subscribeInstall } from '@/lib/pwa';

const InstallAppSteps = lazy(() => import('@/Components/InstallAppSteps'));

const readState = () => ({ installed: isInstalled(), canPrompt: canPromptInstall(), ios: isIos() });

/**
 * Shared by the login card (below) and InstallAppSidebarButton. `visible` is false when the
 * app is already installed or the browser can't install it.
 */
export function useInstallApp() {
    const [state, setState] = useState(readState);
    const [stepsOpen, setStepsOpen] = useState(false);
    useEffect(() => subscribeInstall(() => setState(readState())), []);

    const install = () => (state.canPrompt ? promptInstall() : setStepsOpen(true));

    return { visible: !state.installed && (state.canPrompt || state.ios), install, stepsOpen, setStepsOpen };
}

/** iPhone install steps. The dialog code is fetched the first time it is opened, then kept mounted. */
export function InstallSteps({ open, onOpenChange }) {
    const [requested, setRequested] = useState(open);
    if (open && !requested) setRequested(true);
    if (!requested) return null;

    return (
        <Suspense fallback={null}>
            <InstallAppSteps open={open} onOpenChange={onOpenChange} />
        </Suspense>
    );
}

/**
 * "Get the app" panel for the login page: installs the system on a phone
 * (home-screen icon, opens offline). The sidebar uses InstallAppSidebarButton,
 * kept separate so this page does not pull in the sidebar code.
 */
export default function InstallAppButton() {
    const { visible, install, stepsOpen, setStepsOpen } = useInstallApp();

    if (!visible) return null;

    // Kept quieter than the page's primary action: a muted panel with a small outline button.
    return (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border">
                <MonitorSmartphone className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-base font-medium text-foreground">Get the app</p>
                <p className="text-sm text-muted-foreground">Quick access and offline reporting on this device.</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="min-h-11 shrink-0 gap-1.5 text-sm md:min-h-10" onClick={install}>
                <Download aria-hidden="true" />
                Install
            </Button>
            <InstallSteps open={stepsOpen} onOpenChange={setStepsOpen} />
        </div>
    );
}
