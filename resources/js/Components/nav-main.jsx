"use client";

import * as React from "react";
import { route } from "ziggy-js";

// ✅ 1. Import the useSidebar hook
import { useSidebar } from "@/components/ui/sidebar";

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({ items }) {
    // ✅ 2. Get the sidebar state and toggle function from the hook
    const { isCollapsed, toggleSidebar } = useSidebar();

    return (
        <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => {
                        const hasSubItems = item.items?.length > 0;

                        // This is the item we want to make a toggle button
                        if (item.title === "Main Menu") {
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton className="text-white font-semibold hover:bg-transparent hover:text-white cursor-default">
                                        {item.icon && <item.icon />}
                                        {!isCollapsed && (
                                            <span>{item.title}</span>
                                        )}
                                    </SidebarMenuButton>
                                    {!isCollapsed && hasSubItems && (
                                        <SidebarMenuSub>
                                            {item.items.map((subItem) => (
                                                <SidebarMenuSubItem
                                                    key={subItem.title}
                                                >
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={route().current(
                                                            subItem.url
                                                                .split("/")
                                                                .pop() + ".*"
                                                        )}
                                                        className="text-white/80"
                                                    >
                                                        <a href={subItem.url}>
                                                            <span>
                                                                {subItem.title}
                                                            </span>
                                                        </a>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    )}
                                </SidebarMenuItem>
                            );
                        }

                        // This part handles any other potential top-level items if you add them later.
                        // For now, it will not be used based on your app-sidebar.jsx structure.
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={item.title}
                                    isActive={!hasSubItems && item.isActive}
                                    className="text-white"
                                >
                                    <a href={item.url}>
                                        {item.icon && <item.icon />}
                                        {!isCollapsed && (
                                            <span>{item.title}</span>
                                        )}
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
//new
