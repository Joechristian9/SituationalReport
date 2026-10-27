import * as React from "react";
import { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";

import { NavMain } from "@/Components/nav-main";
import { NavUser } from "@/Components/nav-user";
import InstallAppSidebarButton from "@/Components/InstallAppSidebarButton";
import { TeamSwitcher } from "@/Components/team-switcher";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/Components/ui/sidebar";
import { route } from "ziggy-js";
import { HISTORY_TYPES, historyMenuItems } from "@/Components/history/historyTypes";
import {
    BarChart3,
    FileWarning,
    MapPin,
    Flame,
    Users,
    HeartHandshake,
    Calendar,
    Cloud,
    LayoutDashboard,
    UserCircle,
    Sprout,
    ClipboardCheck,
    Shield,
} from "lucide-react";

const staticTeams = [{ name: "SitReps", logo: "/images/ilagan.jpeg" }];

export function AppSidebar({ ...props }) {
    const { auth } = usePage().props;
    const userRoles = auth.user.roles.map((r) => r.name);
    const userPermissions = auth.user.permissions?.map((p) => p.name) || [];
    const isAdmin = userRoles.includes('admin');

    // --- State for custom years ---
    const [customYears, setCustomYears] = useState([]);

    // Load custom years from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('customReportYears');
        if (stored) {
            try {
                setCustomYears(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse custom years:', e);
            }
        }
    }, []);

    // Save custom years to localStorage whenever they change
    useEffect(() => {
        if (customYears.length > 0) {
            localStorage.setItem('customReportYears', JSON.stringify(customYears));
        }
    }, [customYears]);

    // --- Dynamically generate the last 5 years ---
    const currentYear = new Date().getFullYear();
    const defaultYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
    
    // Combine default years with custom years and remove duplicates
    const allYears = [...new Set([...defaultYears, ...customYears])].sort((a, b) => b - a);

    // Function to add a new year
    const addYear = (year) => {
        const yearNum = parseInt(year, 10);
        if (!isNaN(yearNum) && yearNum > 1900 && yearNum <= currentYear + 10) {
            if (!allYears.includes(yearNum)) {
                setCustomYears(prev => [...prev, yearNum]);
                return true;
            }
        }
        return false;
    };

    // Function to remove a custom year
    const removeYear = (year) => {
        setCustomYears(prev => prev.filter(y => y !== year));
        // Also remove from localStorage if no custom years remain
        if (customYears.length === 1 && customYears[0] === year) {
            localStorage.removeItem('customReportYears');
        }
    };

    // --- Create menu items for each year ---
    const reportItems = allYears.map((year) => ({
        title: `${year} Report`,
        // IMPORTANT: This now points to the 'view' route, not 'download'.
        // This will generate a URL like: /reports/view?year=2025
        url: route("reports.view", { year: year }),
        roles: ["user", "admin"],
        icon: Calendar,
        // Opens the PDF view in a new tab.
        external: true,
        onRemove: customYears.includes(year) ? () => removeYear(year) : undefined,
    }));

    // Helper function to check if user has permission
    const hasPermission = (permission) => {
        return isAdmin || userPermissions.includes(permission);
    };

    // Check if user has access to Situation Overview (any of the 7 forms)
    const hasSituationOverviewAccess = hasPermission('access-weather-form') ||
        hasPermission('access-water-level-form') ||
        hasPermission('access-electricity-form') ||
        hasPermission('access-water-service-form') ||
        hasPermission('access-communication-form') ||
        hasPermission('access-road-form') ||
        hasPermission('access-bridge-form');
    
    // Check if user only has electricity access (Iselco II)
    const isElectricityOnly = hasPermission('access-electricity-form') && 
        !hasPermission('access-weather-form') &&
        !hasPermission('access-water-level-form') &&
        !hasPermission('access-water-service-form') &&
        !hasPermission('access-communication-form') &&
        !hasPermission('access-road-form') &&
        !hasPermission('access-bridge-form');
    
    // Check if user only has water service access (IWD)
    const isWaterServiceOnly = hasPermission('access-water-service-form') && 
        !hasPermission('access-weather-form') &&
        !hasPermission('access-water-level-form') &&
        !hasPermission('access-electricity-form') &&
        !hasPermission('access-communication-form') &&
        !hasPermission('access-road-form') &&
        !hasPermission('access-bridge-form');
    
    // Check if user is CDRRMO by email (since CDRRMO has all permissions)
    const isCDRRMO = auth.user.email === 'cdrrmo@gmail.com' || 
        auth.user.roles?.some(role => role.name?.toLowerCase() === 'cdrrmo') ||
        auth.user.name?.toLowerCase().includes('cdrrmo');
    
    // Check if user is BDRRMC (electricity, communication, road, bridge, pre-emptive)
    const isBDRRMC = hasPermission('access-electricity-form') && 
        hasPermission('access-communication-form') &&
        hasPermission('access-road-form') &&
        hasPermission('access-bridge-form') &&
        hasPermission('access-pre-emptive-form') &&
        !hasPermission('access-weather-form') &&
        !hasPermission('access-water-service-form') &&
        !hasPermission('access-water-level-form') &&
        !hasPermission('access-incident-form') &&
        !hasPermission('access-pre-positioning-form');
    
    // Check if user is CEO (road and bridge only)
    const isCEO = hasPermission('access-road-form') && 
        hasPermission('access-bridge-form') &&
        !hasPermission('access-electricity-form') &&
        !hasPermission('access-communication-form') &&
        !hasPermission('access-weather-form') &&
        !hasPermission('access-water-service-form') &&
        !hasPermission('access-water-level-form') &&
        !hasPermission('access-pre-emptive-form') &&
        !hasPermission('access-incident-form') &&
        !hasPermission('access-pre-positioning-form');
    
    // Check if user is PNP (road, bridge, and incident monitored)
    const isPNP = hasPermission('access-road-form') && 
        hasPermission('access-bridge-form') &&
        hasPermission('access-incident-form') &&
        !hasPermission('access-electricity-form') &&
        !hasPermission('access-communication-form') &&
        !hasPermission('access-weather-form') &&
        !hasPermission('access-water-service-form') &&
        !hasPermission('access-water-level-form') &&
        !hasPermission('access-pre-emptive-form') &&
        !hasPermission('access-pre-positioning-form');
    
    // Check if user is a Barangay user (has 6 specific permissions but not electricity/water service/water level/pre-positioning)
    // Barangay users should only see "Situation Overview" menu
    const isBarangay = hasPermission('access-weather-form') &&
        hasPermission('access-communication-form') &&
        hasPermission('access-road-form') &&
        hasPermission('access-bridge-form') &&
        hasPermission('access-pre-emptive-form') &&
        hasPermission('access-incident-form') &&
        !hasPermission('access-electricity-form') &&
        !hasPermission('access-water-service-form') &&
        !hasPermission('access-water-level-form') &&
        !hasPermission('access-pre-positioning-form') &&
        !hasPermission('access-declaration-form');

    // A history for every form the account may file, whatever its office (see
    // Components/history/historyTypes.js). Admins read everything from the dashboard instead.
    const historyKeys = isAdmin
        ? []
        : Object.keys(HISTORY_TYPES).filter((key) => hasPermission(HISTORY_TYPES[key].permission));

    // Each group's items are filtered by role and permission below; empty groups drop out.
    const navGroups = [
        {
            label: "Overview",
            items: [
                {
                    title: "Dashboard",
                    url: route("dashboard"),
                    // The casualty drill-downs are opened from the dashboard.
                    alsoActiveOn: [
                        route("admin.casualties.submissions"),
                        route("admin.injured.submissions"),
                        route("admin.missing.submissions"),
                    ],
                    roles: ["admin"],
                    icon: LayoutDashboard,
                },
            ],
        },
        {
            label: "Administration",
            items: [
                {
                    title: "Disaster Management",
                    url: route("disasters.index"),
                    roles: ["admin"],
                    icon: Cloud,
                },
                {
                    title: "Form Submission Status",
                    url: route("admin.form-submission-status"),
                    roles: ["admin"],
                    icon: ClipboardCheck,
                },
                {
                    title: "User Management",
                    url: route("admin.users.index"),
                    roles: ["admin"],
                    icon: UserCircle,
                },
                {
                    title: "Audit Logs",
                    url: route("admin.audit-logs"),
                    roles: ["admin"],
                    icon: Shield,
                },
            ],
        },
        {
            label: "Reports",
            items: [
                ...(!isAdmin ? [{
                    title: isElectricityOnly ? "Electricity Reports" : isWaterServiceOnly ? "Water Services" : (isCDRRMO || isBDRRMC || isCEO || isPNP || isBarangay) ? "Reports" : "Situation Overview",
                    url: route("situation-reports.index"),
                    roles: ["user"],
                    icon: BarChart3,
                    requiresAnyPermission: true,
                }] : []),
                ...(!isBarangay && !isCDRRMO && !isAdmin ? [{
                    title: "Declaration USC",
                    url: route("declaration-usc.index"),
                    roles: ["user"],
                    icon: FileWarning,
                    permission: "access-declaration-form",
                }] : []),
                ...(!isCDRRMO && !isBDRRMC && !isBarangay && !isAdmin ? [{
                    title: "Deployment of Response Assets",
                    url: route("pre-positioning.index"),
                    roles: ["user"],
                    icon: MapPin,
                    permission: "access-pre-positioning-form",
                }] : []),
                ...(!isCDRRMO && !isBDRRMC && !isPNP && !isBarangay && !isAdmin ? [{
                    title: "Incidents Monitored",
                    url: route("incident-monitored.index"),
                    roles: ["user"],
                    icon: Flame,
                    permission: "access-incident-form",
                }] : []),
                ...(!isCDRRMO && !isBarangay && !isAdmin ? [{
                    title: "Response Operations",
                    url: route("response-operations.index"),
                    roles: ["user"],
                    icon: Users,
                    permission: "access-response-operations",
                }] : []),
                ...(!isCDRRMO && !isBarangay && !isAdmin ? [{
                    title: "Assistance Extended",
                    url: route("assistance.index"),
                    roles: ["user"],
                    icon: HeartHandshake,
                    permission: "access-assistance-extended",
                }] : []),
                ...(!isCDRRMO && !isAdmin ? [{
                    title: "Agriculture",
                    url: route("situation-reports.index"),
                    roles: ["user"],
                    icon: Sprout,
                    permission: "access-agriculture-form",
                }] : []),
            ],
        },
        // Report History: the forms the user may file, in the Reports page's sections.
        ...(historyKeys.length > 0 ? [{
            label: "Report History",
            collapsible: true,
            items: historyMenuItems(historyKeys),
        }] : []),
        /*
         * Annual Reports (temporarily disabled). Re-enable by restoring this group:
         * { label: "Annual Reports", collapsible: true, items: reportItems, addYear },
         */
    ];

    const canSee = (item) => {
        if (!item.roles?.some((r) => userRoles.includes(r))) return false;
        if (isAdmin) return true;
        // Situation Overview shows for any of the situation forms.
        if (item.requiresAnyPermission) return hasSituationOverviewAccess;
        return !item.permission || hasPermission(item.permission);
    };

    const visibleGroups = navGroups
        .map((group) => ({ ...group, items: group.items.filter(canSee) }))
        .filter((group) => group.items.length > 0);

    const user = {
        name: auth.user.name,
        email: auth.user.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            auth.user.name
        )}&background=2563eb&color=fff`,
    };

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="border-b border-sidebar-border">
                <TeamSwitcher teams={staticTeams} />
            </SidebarHeader>

            <SidebarContent className="gap-1 py-2">
                <NavMain groups={visibleGroups} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border">
                <InstallAppSidebarButton />
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
