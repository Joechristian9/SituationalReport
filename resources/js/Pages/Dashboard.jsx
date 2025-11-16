import { AppSidebar } from "@/Components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/Components/ui/sidebar";
import { Head, usePage } from "@inertiajs/react";
import { Separator } from "@radix-ui/react-dropdown-menu";
import TyphoonStatusAlert from "@/Components/TyphoonStatusAlert";

export default function Dashboard() {
    const { typhoon } = usePage().props;
    
    // Check if forms should be disabled
    const formsDisabled = !typhoon?.hasActive || typhoon?.active?.status === 'ended';
    
    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title="Dashboard"></Head>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <SidebarTrigger className="-ml-2" />
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <h1 className="text-xl font-semibold">Dashboard</h1>
                </header>
                <main className="w-full p-6">
                    {/* Typhoon Status Alert */}
                    <TyphoonStatusAlert 
                        typhoon={typhoon?.active}
                        hasActive={typhoon?.hasActive}
                        formsDisabled={formsDisabled}
                    />
                    
                    
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
