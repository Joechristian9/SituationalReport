import * as React from "react";
import { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";

import { RiMenuFold2Fill } from "react-icons/ri";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import { route } from "ziggy-js";
import {
    BarChart3,
    FileWarning,
    ClipboardList,
    MapPin,
    Flame,
    Users,
    HeartHandshake,
    Download,
    Calendar, // Import a calendar or year icon
    Cloud,
    History,
    Radio,
    Sprout,
    ClipboardCheck,
    Zap,
} from "lucide-react";
import { TbLayoutDashboard } from "react-icons/tb";

// Static
const staticTeams = [{ name: "SitReps", logo: "/images/ilagan.jpeg" }];
const staticProjects = [];

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
        isCustom: customYears.includes(year),
        onRemove: () => removeYear(year),
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
    
    // Check if user is CDRRMO (weather, communication, pre-emptive, incident)
    const isCDRRMO = hasPermission('access-weather-form') && 
        hasPermission('access-communication-form') &&
        hasPermission('access-pre-emptive-form') &&
        hasPermission('access-incident-form') &&
        !hasPermission('access-electricity-form') &&
        !hasPermission('access-water-service-form') &&
        !hasPermission('access-water-level-form') &&
        !hasPermission('access-road-form') &&
        !hasPermission('access-bridge-form') &&
        !hasPermission('access-pre-positioning-form');
    
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
    
    // Check if user only has agriculture access (CAO)
    const isCAO = hasPermission('access-agriculture-form') && 
        !hasPermission('access-weather-form') &&
        !hasPermission('access-electricity-form') &&
        !hasPermission('access-water-service-form') &&
        !hasPermission('access-communication-form') &&
        !hasPermission('access-road-form') &&
        !hasPermission('access-bridge-form');

    const navMain = [
        {
            title: "Main Menu",
            url: "#",
            icon: RiMenuFold2Fill,
            isActive: route().current("situation-reports.*"),
            roles: ["user", "admin"],
            items: [
                {
                    title: "Dashboard",
                    url: route("admin.dashboard"),
                    roles: ["admin"],
                    icon: TbLayoutDashboard,
                    permission: null,
                },
                {
                    title: "Typhoon Management",
                    url: route("typhoons.index"),
                    roles: ["admin"],
                    icon: Cloud,
                    permission: null,
                },
                {
                    title: "Form Submission Status",
                    url: route("admin.form-submission-status"),
                    roles: ["admin"],
                    icon: ClipboardCheck,
                    permission: null,
                },
                ...(!isAdmin ? [{
                    title: isElectricityOnly ? "Electricity Reports" : isWaterServiceOnly ? "Water Services" : (isCDRRMO || isBDRRMC || isCEO) ? "Reports" : "Situation Overview",
                    url: route("situation-reports.index"),
                    roles: ["user"],
                    icon: BarChart3,
                    permission: null, // Will be checked separately
                    requiresAnyPermission: true,
                }] : []),
                ...(isElectricityOnly ? [{
                    title: "Report History",
                    url: route("electricity.history"),
                    roles: ["user", "admin"],
                    icon: History,
                    permission: "access-electricity-form",
                }] : []),
                ...(isWaterServiceOnly ? [{
                    title: "Report History",
                    url: route("water-service.history"),
                    roles: ["user", "admin"],
                    icon: History,
                    permission: "access-water-service-form",
                }] : []),
                ...(!isCDRRMO && !isBDRRMC && !isAdmin ? [{
                    title: "Pre-Emptive Reports",
                    url: route("preemptive-reports.index"),
                    roles: ["user"],
                    icon: ClipboardList,
                    permission: "access-pre-emptive-form",
                }] : []),
                ...(!isAdmin ? [{
                    title: "Declaration USC",
                    url: route("declaration-usc.index"),
                    roles: ["user"],
                    icon: FileWarning,
                    permission: "access-declaration-form",
                }] : []),
                ...(!isCDRRMO && !isBDRRMC && !isAdmin ? [{
                    title: "Deployment of Response Assets",
                    url: route("pre-positioning.index"),
                    roles: ["user"],
                    icon: MapPin,
                    permission: "access-pre-positioning-form",
                }] : []),
                ...(!isCDRRMO && !isBDRRMC && !isAdmin ? [{
                    title: "Incidents Monitored",
                    url: route("incident-monitored.index"),
                    roles: ["user"],
                    icon: Flame,
                    permission: "access-incident-form",
                }] : []),
                ...(!isAdmin ? [{
                    title: "Response Operations",
                    url: route("response-operations.index"),
                    roles: ["user"],
                    icon: Users,
                    permission: "access-response-operations",
                }] : []),
                ...(!isAdmin ? [{
                    title: "Assistance Extended",
                    url: route("assistance.index"),
                    roles: ["user"],
                    icon: HeartHandshake,
                    permission: "access-assistance-extended",
                }] : []),
                ...(!isAdmin ? [{
                    title: "Agriculture",
                    url: route("situation-reports.index"),
                    roles: ["user"],
                    icon: Sprout,
                    permission: "access-agriculture-form",
                }] : []),
            ],
        },
        // Report History dropdown for CDRRMO users
        ...(isCDRRMO ? [{
            title: "Report History",
            url: "#",
            icon: History,
            roles: ["user", "admin"],
            items: [
                {
                    title: "Weather History",
                    url: route("weather.history"),
                    roles: ["user", "admin"],
                    icon: Cloud,
                    permission: "access-weather-form",
                },
                {
                    title: "Communication History",
                    url: route("communication.history"),
                    roles: ["user", "admin"],
                    icon: Radio,
                    permission: "access-communication-form",
                },
                {
                    title: "Pre-Emptive History",
                    url: route("pre-emptive.history"),
                    roles: ["user", "admin"],
                    icon: ClipboardList,
                    permission: "access-pre-emptive-form",
                },
                {
                    title: "Incident History",
                    url: route("incident.history"),
                    roles: ["user", "admin"],
                    icon: Flame,
                    permission: "access-incident-form",
                },
                {
                    title: "Agriculture History",
                    url: route("agriculture.history"),
                    roles: ["user", "admin"],
                    icon: Sprout,
                    permission: "access-agriculture-form",
                }
            ]
        }] : []),
        // Report History dropdown for BDRRMC users
        ...(isBDRRMC ? [{
            title: "Report History",
            url: "#",
            icon: History,
            roles: ["user", "admin"],
            items: [
                {
                    title: "Electricity History",
                    url: route("electricity.history"),
                    roles: ["user", "admin"],
                    icon: Zap,
                    permission: "access-electricity-form",
                },
                {
                    title: "Communication History",
                    url: route("communication.history"),
                    roles: ["user", "admin"],
                    icon: Radio,
                    permission: "access-communication-form",
                },
                {
                    title: "Pre-Emptive History",
                    url: route("pre-emptive.history"),
                    roles: ["user", "admin"],
                    icon: ClipboardList,
                    permission: "access-pre-emptive-form",
                },
                // TODO: Add Road and Bridge history routes when they're created
                // {
                //     title: "Road History",
                //     url: route("road.history"),
                //     roles: ["user", "admin"],
                //     icon: MapPin,
                //     permission: "access-road-form",
                // },
                // {
                //     title: "Bridge History",
                //     url: route("bridge.history"),
                //     roles: ["user", "admin"],
                //     icon: MapPin,
                //     permission: "access-bridge-form",
                // },
            ]
        }] : []),
        // Report History dropdown for CEO users
        ...(isCEO ? [{
            title: "Report History",
            url: "#",
            icon: History,
            roles: ["user", "admin"],
            items: [
                {
                    title: "Road History",
                    url: route("road.history"),
                    roles: ["user", "admin"],
                    icon: MapPin,
                    permission: "access-road-form",
                },
                {
                    title: "Bridge History",
                    url: route("bridge.history"),
                    roles: ["user", "admin"],
                    icon: MapPin,
                    permission: "access-bridge-form",
                },
            ]
        }] : []),
        // Report History dropdown for CAO users
        ...(isCAO ? [{
            title: "Report History",
            url: "#",
            icon: History,
            roles: ["user", "admin"],
            items: [
                {
                    title: "Agriculture History",
                    url: route("agriculture.history"),
                    roles: ["user", "admin"],
                    icon: Sprout,
                    permission: "access-agriculture-form",
                }
            ]
        }] : []),
        /*
         * Annual Reports menu (temporarily disabled).
         * Re-enable this block when annual reports are needed again.
         {
             title: "Annual Reports", // Changed title for clarity
             url: "#",
             icon: Download, // The main icon for the group
             isActive: route().current("reports.*"),
             roles: ["user", "admin"],
             items: reportItems, // Assign the dynamically generated year links here
             addYear: addYear, // Pass the addYear function
         },
         */
    ];

    // --- Filter menus & submenus based on roles AND permissions ---
    const filteredNavMain = navMain
        .filter((item) => item.roles?.some((r) => userRoles.includes(r)))
        .map((item) => ({
            ...item,
            items: item.items?.filter((sub) => {
                // Check role first
                if (!sub.roles?.some((r) => userRoles.includes(r))) {
                    return false;
                }
                
                // If admin, show everything
                if (isAdmin) {
                    return true;
                }
                
                // Special case for Situation Overview - show if user has ANY form permission
                if (sub.requiresAnyPermission) {
                    return hasSituationOverviewAccess;
                }
                
                // If no permission specified, show it (for items that don't need permission check)
                if (!sub.permission) {
                    return true;
                }
                
                // Check if user has the required permission
                return hasPermission(sub.permission);
            }),
        }))
        .filter((item) => item.items && item.items.length > 0); // Remove empty groups

    const data = {
        teams: staticTeams,
        projects: staticProjects,
        navMain: filteredNavMain,
        user: {
            name: auth.user.name,
            email: auth.user.email,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                auth.user.name
            )}&background=random&color=fff`,
        },
    };

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="bg-blue-600 text-white border-b border-blue-400">
                <TeamSwitcher teams={data.teams} />
            </SidebarHeader>

            <SidebarContent className="bg-blue-600 text-white">
                <NavMain items={data.navMain} />
                <NavProjects projects={data.projects} />
            </SidebarContent>

            <SidebarFooter className="bg-blue-600 text-white border-t border-blue-500">
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
