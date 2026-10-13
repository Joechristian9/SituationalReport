import { Head, usePage } from "@inertiajs/react";

import { AppSidebar } from "@/Components/app-sidebar";
import NotificationBell from "@/Components/reminders/NotificationBell";
import { Separator } from "@/Components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/Components/ui/sidebar";

// The sidebar writes this cookie when toggled; read it so a collapsed sidebar stays collapsed.
const sidebarStartsOpen = () =>
    !document.cookie.split("; ").includes("sidebar_state=false");

/**
 * Frame shared by every signed-in page: sidebar, sticky header, content.
 * `header` fills the left of the header (PageTitle or Breadcrumbs), `actions` the right.
 */
export default function AppLayout({ title, header, actions, children }) {
    // Only report accounts get the bell: admins send reminders and manage the disaster themselves.
    const roles = usePage().props.auth?.user?.roles?.map((role) => role.name) ?? [];
    const showBell = roles.includes("user") && !roles.includes("admin");

    return (
        <SidebarProvider defaultOpen={sidebarStartsOpen()}>
            <AppSidebar />
            {title && <Head title={title} />}
            <SidebarInset>
                <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card/90 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/75 sm:px-6">
                    <SidebarTrigger className="-ml-2 shrink-0" />
                    <Separator
                        orientation="vertical"
                        className="mx-1 hidden h-6 shrink-0 sm:mx-2 sm:block"
                    />
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        {header}
                    </div>
                    {(actions || showBell) && (
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                            {actions}
                            {showBell && <NotificationBell />}
                        </div>
                    )}
                </header>
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
