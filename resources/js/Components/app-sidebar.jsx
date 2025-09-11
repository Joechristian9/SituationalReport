import * as React from "react";
import { usePage } from "@inertiajs/react";

import { MdOutlineHealthAndSafety } from "react-icons/md";

import { NavMain } from "@/components/nav-main";
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

const staticTeams = [
    {
        name: "SitReps",
        logo: MdOutlineHealthAndSafety,
    },
];

export function AppSidebar({ ...props }) {
    const { auth } = usePage().props;

    const navMain = [
        {
            title: "Situational Reports",
            url: route("situation-reports.index"),
        },
        {
            title: "Pre-Emptive Reports",
            url: route("preemptive-reports.index"),
        },
    ];

    const data = {
        teams: staticTeams,
        navMain: navMain,
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
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
