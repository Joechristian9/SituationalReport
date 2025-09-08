// resources/js/Pages/SituationReports/Index.jsx
import { useEffect, useState } from "react";
import { usePage, Head, useForm } from "@inertiajs/react";
import { Toaster, toast } from "react-hot-toast";
import { Plus, Minus } from "lucide-react";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import WeatherForm from "@/Components/SituationOverview/WeatherForm";
import WaterLevelForm from "@/Components/SituationOverview/WaterLevelForm";
import ElectricityForm from "@/Components/SituationOverview/ElectricityForm";

export default function Index() {
    const { flash } = usePage().props;

    // ✅ Show/hide state for forms
    const [showWaterLevel, setShowWaterLevel] = useState(false);
    const [showElectricity, setShowElectricity] = useState(false);

    // ✅ Combined useForm with default structure
    const { data, setData, post, processing, errors } = useForm({
        reports: [
            {
                id: 1,
                municipality: "",
                sky_condition: "",
                wind: "",
                precipitation: "",
                sea_condition: "",
            },
        ],
        waterLevels: [
            {
                id: 1,
                gauging_station: "",
                current_level: "",
                alarm_level: "",
                critical_level: "",
                affected_areas: "",
            },
        ],
        electricityServices: [
            {
                id: 1,
                status: "",
                barangays_affected: "",
                remarks: "",
            },
        ],
    });

    // ✅ Toggle visibility
    const [waterLevelVisible, setWaterLevelVisible] = useState(false);
    const [electricityVisible, setElectricityVisible] = useState(false);

    // ✅ Load saved data from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("situationReports");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setData(parsed);
            } catch (e) {
                console.error("Failed to parse saved reports", e);
            }
        }
    }, []);

    // ✅ Save data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("situationReports", JSON.stringify(data));
    }, [data]);

    // ✅ Clear localStorage after successful save
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const breadcrumbs = [
        { href: route("dashboard"), label: "Dashboard" },
        { label: "Create Situational Report" },
    ];

    // ✅ Single submit handler
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("situation-reports.store"), {
            preserveScroll: true,
        });
    };

    return (
        <SidebarProvider>
            <Toaster position="top-right" />
            <AppSidebar />
            <Head title="Create Situational Report" />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="h-6" />
                        <Breadcrumbs crumbs={breadcrumbs} />
                    </div>
                </header>

                <main className="w-full p-6">
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Situational Report</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {/* Weather form always visible */}
                                <WeatherForm
                                    data={data}
                                    setData={setData}
                                    errors={errors}
                                />

                                {/* Toggle Water Level */}
                                <div className="space-y-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            if (waterLevelVisible) {
                                                // ✅ If hiding Water Level, also hide Electricity
                                                setElectricityVisible(false);
                                            }
                                            setWaterLevelVisible(
                                                !waterLevelVisible
                                            );
                                        }}
                                        className={`flex items-center gap-2 ${
                                            waterLevelVisible
                                                ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                                : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        }`}
                                    >
                                        {waterLevelVisible ? (
                                            <Minus size={16} />
                                        ) : (
                                            <Plus size={16} />
                                        )}
                                        {waterLevelVisible
                                            ? "Hide Water Level Form"
                                            : "Show Water Level Form"}
                                    </Button>

                                    {waterLevelVisible && (
                                        <WaterLevelForm
                                            data={data}
                                            setData={setData}
                                            errors={errors}
                                        />
                                    )}
                                </div>

                                {/* ✅ Electricity only appears if Water Level is open */}
                                {waterLevelVisible && (
                                    <div className="space-y-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                setElectricityVisible(
                                                    !electricityVisible
                                                )
                                            }
                                            className={`flex items-center gap-2 ${
                                                electricityVisible
                                                    ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            }`}
                                        >
                                            {electricityVisible ? (
                                                <Minus size={16} />
                                            ) : (
                                                <Plus size={16} />
                                            )}
                                            {electricityVisible
                                                ? "Hide Electricity Form"
                                                : "Show Electricity Form"}
                                        </Button>

                                        {electricityVisible && (
                                            <ElectricityForm
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                            />
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex justify-end mt-6">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md shadow hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {processing ? "Saving..." : "Save All Reports"}
                            </Button>
                        </div>
                    </form>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
