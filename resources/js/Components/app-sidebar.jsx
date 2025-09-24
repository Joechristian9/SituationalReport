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
import { route } from "ziggy-js";

// Static
const staticTeams = [{ name: "SitReps", logo: "/images/ilagan.jpeg" }];
const staticProjects = [];

export function AppSidebar({ ...props }) {
    const { auth } = usePage().props;
    const userRoles = auth.user.roles.map((r) => r.name);

    // --- Define nav items with role restrictions ---
    const navMain = [
        {
            title: "Main Menu",
            url: "#",
            icon: RiMenuFold2Fill,
            isActive: route().current("situation-reports.*"),
            roles: ["user", "admin"], // 👈 only visible to these roles
            items: [
                {
                    title: "Situation Overview",
                    url: route("situation-reports.index"),
                    roles: ["user"],
                },
                {
                    title: "Pre-Emptive Reports",
                    url: route("preemptive-reports.index"),
                    roles: ["user"],
                },
                {
                    title: "Declaration USC",
                    url: route("declaration-usc.index"),
                    roles: ["user"],
                },
                {
                    title: "Deployment of Response Assets",
                    url: route("pre-positioning.index"),
                    roles: ["user"],
                },
                {
                    title: "Incidents Monitored",
                    url: route("incident-monitored.index"),
                    roles: ["user"],
                },
                {
                    title: "Sample Admin Menu 1",
                    url: "#",
                    roles: ["admin"],
                },
                {
                    title: "Sample Admin Menu 2",
                    url: "#",
                    roles: ["admin"],
                },
                {
                    title: "Sample Admin Menu 3",
                    url: "#",
                    roles: ["admin"],
                },
                // {
                //     title: "Response Operations",
                //     url: route(""),
                // },
            ],
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
