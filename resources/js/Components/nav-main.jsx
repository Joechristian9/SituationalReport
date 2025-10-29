"use client";

import * as React from "react";
import { usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
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

export function NavMain({ items = [] }) {
    const { isCollapsed } = useSidebar();
    const { url: currentUrl } = usePage();

    return (
        <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                    {items.map((item) => {
                        const hasSubItems =
                            Array.isArray(item.items) && item.items.length > 0;
                        const Icon = item.icon;

                        const renderSubMenu = () => (
                            <SidebarMenuSub className="mt-1 space-y-1">
                                {item.items.map((subItem) => {
                                    const SubIcon = subItem.icon;
                                    const isActive = currentUrl === subItem.url;

                                    // ================================================================
                                    // == START: Logic to conditionally open links in a new tab      ==
                                    // ================================================================

                                    // Check if the parent item is the "Annual Reports" menu.
                                    // This title comes from your AppSidebar.jsx component.
                                    const isReportLink =
                                        item.title === "Annual Reports";

                                    return (
                                        <SidebarMenuSubItem key={subItem.title}>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isActive}
                                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 
                                                    ${
                                                        isActive
                                                            ? "bg-white text-black shadow-sm"
                                                            : "text-white/80 hover:bg-white/10 hover:text-white"
                                                    }`}
                                            >
                                                <a
                                                    href={subItem.url || "#"}
                                                    // Only add target="_blank" if it's a report link
                                                    target={
                                                        isReportLink
                                                            ? "_blank"
                                                            : undefined
                                                    }
                                                    // Only add rel if target="_blank" is also present
                                                    rel={
                                                        isReportLink
                                                            ? "noopener noreferrer"
                                                            : undefined
                                                    }
                                                >
                                                    {SubIcon && (
                                                        <SubIcon
                                                            className="h-4 w-4"
                                                            color={
                                                                isActive
                                                                    ? "black"
                                                                    : "white"
                                                            }
                                                        />
                                                    )}
                                                    <span>{subItem.title}</span>
                                                </a>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    );
                                })}
                            </SidebarMenuSub>
                        );
                        // ================================================================
                        // == END: Conditional logic                                     ==
                        // ================================================================

                        if (item.title === "Main Menu") {
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        disabled
                                        className="flex items-center px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/60 cursor-default hover:bg-transparent"
                                    >
                                        {Icon && (
                                            <Icon
                                                className="mr-2 h-5 w-5"
                                                color="white"
                                            />
                                        )}
                                        {!isCollapsed && item.title}
                                    </SidebarMenuButton>
                                    {!isCollapsed &&
                                        hasSubItems &&
                                        renderSubMenu()}
                                </SidebarMenuItem>
                            );
                        }

                        // Fallback logic for all other top-level items
                        const isActive = route().current(
                            item.url?.split("/").pop() + ".*"
                        );

                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={item.title}
                                    isActive={isActive}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 
                                        ${
                                            isActive
                                                ? "bg-white text-black shadow-sm"
                                                : "text-white/80 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    <a href={item.url || "#"}>
                                        {Icon && (
                                            <Icon
                                                className="h-5 w-5"
                                                color={
                                                    isActive ? "black" : "white"
                                                }
                                            />
                                        )}
                                        {!isCollapsed && (
                                            <span>{item.title}</span>
                                        )}
                                    </a>
                                </SidebarMenuButton>
                                {!isCollapsed && hasSubItems && renderSubMenu()}
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
