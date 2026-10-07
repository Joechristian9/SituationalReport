import { Download } from 'lucide-react';
import { InstallSteps, useInstallApp } from '@/Components/InstallAppButton';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/Components/ui/sidebar';

/** "Download app" entry in the app sidebar. Hidden when installed or not installable. */
export default function InstallAppSidebarButton() {
    const { visible, install, stepsOpen, setStepsOpen } = useInstallApp();

    if (!visible) return null;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={install} tooltip="Download app" className="text-white hover:bg-white/10 hover:text-white">
                    <Download aria-hidden="true" />
                    <span>Download app</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <InstallSteps open={stepsOpen} onOpenChange={setStepsOpen} />
        </SidebarMenu>
    );
}
