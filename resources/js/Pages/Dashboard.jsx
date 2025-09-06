import { AppSidebar } from "@/Components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/Components/ui/sidebar";
import { Head } from "@inertiajs/react";
import { Separator } from "@radix-ui/react-dropdown-menu";

export default function Dashboard() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title="Dashboard"></Head>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="h-6" />
                    <h1 className="text-xl font-semibold">Dashboard</h1>
                </header>
                <main className="w-full p-6">
                    <div className="bg-white shadow-md drop-shadow-md rounded-xl p-6 border-l-4 border-blue-500">
                        <h2 className="text-lg font-semibold mb-4">SitReps</h2>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
