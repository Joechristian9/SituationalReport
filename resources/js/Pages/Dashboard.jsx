import { AppSidebar } from "@/Components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/Components/ui/sidebar";
import { Head, usePage } from "@inertiajs/react";
import { Separator } from "@radix-ui/react-dropdown-menu";
import ActiveTyphoonHeader from "@/Components/ActiveTyphoonHeader";
import { Card, CardContent } from "@/Components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Dashboard() {
    const { typhoon } = usePage().props;
    
    return (
        <SidebarProvider>
            <AppSidebar />
            <Head title="Dashboard"></Head>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 sm:px-6 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-2" />
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <h1 className="text-xl font-semibold">Dashboard</h1>
                    </div>
                    <ActiveTyphoonHeader 
                        typhoon={typhoon?.active}
                        hasActive={typhoon?.hasActive}
                    />
                </header>
                <main className="w-full p-6">
                    {(!typhoon?.hasActive || typhoon?.active?.status !== 'active') && (
                        <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 shadow-lg">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-amber-500 rounded-full">
                                        <AlertCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-amber-900">No Active Typhoon Report</h3>
                                        <p className="text-sm text-amber-700 mt-1">
                                            There is currently no active typhoon report. Forms are disabled until an administrator creates a new typhoon report.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
