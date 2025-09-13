import * as React from "react";
import { usePage } from "@inertiajs/react";

import { MdOutlineHealthAndSafety } from "react-icons/md";

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
        logo: MdOutlineHealthAndSafety,
    },
];

const staticProjects = [];

export function AppSidebar({ ...props }) {
    const { auth } = usePage().props;

    // --- MODIFICATION: Define navigation data inside the component ---
    // This ensures `route()` is called only when the component renders.
    const navMain = [
        {
            title: "Situation Overview",
            url: "#",
            icon: MdOutlineHealthAndSafety,
            // This now dynamically checks if the current route starts with 'situational-reports'
            isActive: route().current("situation-reports.*"),
            items: [
                {
                    title: "Situational Reports",
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
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={data.teams} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavProjects projects={data.projects} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
