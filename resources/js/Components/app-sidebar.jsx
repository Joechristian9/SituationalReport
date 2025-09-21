import * as React from "react";
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
// The route function is now only used inside the component
import { route } from "ziggy-js";

// Data that is truly static can remain outside
const staticTeams = [
    {
        name: "SitReps",
        logo: "/images/ilagan.jpeg",
    },
];

const staticProjects = [];

export function AppSidebar({ ...props }) {
    const { auth } = usePage().props;

    // --- MODIFICATION: Define navigation data inside the component ---
    // This ensures `route()` is called only when the component renders.
    const navMain = [
        {
            title: "Main Menu",
            url: "#",
            icon: RiMenuFold2Fill,
            // This now dynamically checks if the current route starts with 'situational-reports'
            isActive: route().current("situation-reports.*"),
            items: [
                {
                    title: "Situation Overview",
                    // This is now safe to call here
                    url: route("situation-reports.index"),
                },
                {
                    title: "Pre-Emptive Reports",
                    url: route("preemptive-reports.index"),
                },
                {
                    title: "Declaration USC",
                    url: route("declaration-usc.index"),
                },
                {
                    title: "Deployment of Response Assets",
                    url: route("pre-positioning.index"),
                },
                {
                    title: "Incidents Monitored",
                    url: route("incident-monitored.index"),
                },
            ],
        },
    ];

    const data = {
        teams: staticTeams,
        projects: staticProjects,
        navMain: navMain, // Use the navigation data defined above
        user: {
            name: auth.user.name,
            email: auth.user.email,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                auth.user.name
            )}&background=random&color=fff`,
        },
    };

    return (
        // Use a solid, modern blue. Remove gradients for a cleaner look.
        <Sidebar collapsible="icon" {...props}>
            {/* Use a subtle border for separation instead of a harsh gradient */}
            <SidebarHeader className="bg-blue-600 text-white border-b  border-blue-400">
                <TeamSwitcher teams={data.teams} />
            </SidebarHeader>

            {/* Main content area of the sidebar */}
            <SidebarContent className="bg-blue-600 text-white">
                <NavMain items={data.navMain} />
                <NavProjects projects={data.projects} />
            </SidebarContent>

            {/* Footer with a top border for clean separation */}
            <SidebarFooter className="bg-blue-600 text-white border-t border-blue-500">
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
