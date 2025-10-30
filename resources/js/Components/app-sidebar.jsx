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
} from "lucide-react";
import { TbLayoutDashboard } from "react-icons/tb";

// Static
const staticTeams = [{ name: "SitReps", logo: "/images/ilagan.jpeg" }];
const staticProjects = [];

export function AppSidebar({ ...props }) {
    const { auth } = usePage().props;
    const userRoles = auth.user.roles.map((r) => r.name);

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
                },
                {
                    title: "Situation Overview",
                    url: route("situation-reports.index"),
                    roles: ["user", "admin"],
                    icon: BarChart3,
                },
                {
                    title: "Pre-Emptive Reports",
                    url: route("preemptive-reports.index"),
                    roles: ["user", "admin"],
                    icon: ClipboardList, // 🗒️ Report icon
                },
                {
                    title: "Declaration USC",
                    url: route("declaration-usc.index"),
                    roles: ["user", "admin"],
                    icon: FileWarning, // ⚠️ Declaration/alert
                },
                {
                    title: "Deployment of Response Assets",
                    url: route("pre-positioning.index"),
                    roles: ["user", "admin"],
                    icon: MapPin, // 📍 Deployment/location
                },
                {
                    title: "Incidents Monitored",
                    url: route("incident-monitored.index"),
                    roles: ["user", "admin"],
                    icon: Flame, // 🔥 Incident/fire
                },
                {
                    title: "Response Operations",
                    url: route("response-operations.index"),
                    roles: ["user", "admin"],
                    icon: Users, // 👥 Operations/team
                },
                {
                    title: "Assistance Extended",
                    url: route("assistance.index"),
                    roles: ["user", "admin"],
                    icon: HeartHandshake, // ❤️‍🤝 Assistance/help
                },
            ],
        },
        {
            title: "Annual Reports", // Changed title for clarity
            url: "#",
            icon: Download, // The main icon for the group
            isActive: route().current("reports.*"),
            roles: ["user", "admin"],
            items: reportItems, // Assign the dynamically generated year links here
            addYear: addYear, // Pass the addYear function
        },
    ];

    // --- Filter menus & submenus based on roles ---
    const filteredNavMain = navMain
        .filter((item) => item.roles?.some((r) => userRoles.includes(r)))
        .map((item) => ({
            ...item,
            items: item.items?.filter((sub) =>
                sub.roles?.some((r) => userRoles.includes(r))
            ),
        }));

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
