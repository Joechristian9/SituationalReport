"use client";

import * as React from "react";
import { route } from "ziggy-js";

import {
    // ENHANCEMENT: Import the grouping components
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({ items }) {
    return (
        // ENHANCEMENT: Wrap the entire menu in a group with a label.
        <SidebarGroup>
            <SidebarGroupLabel className="text-slate-400">
                Main Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => {
                        const hasSubItems = item.items?.length > 0;

                        const buttonContent = (
                            <>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </>
                        );

                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={item.title}
                                    isActive={!hasSubItems && item.isActive}
                                    className="text-white"
                                >
                                    {hasSubItems ? (
                                        <div>{buttonContent}</div>
                                    ) : (
                                        <a href={item.url}>{buttonContent}</a>
                                    )}
                                </SidebarMenuButton>

                                {hasSubItems && (
                                    <SidebarMenuSub>
                                        {item.items.map((subItem) => (
                                            <SidebarMenuSubItem
                                                key={subItem.title}
                                            >
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={route().current(
                                                        subItem.url
                                                    )}
                                                    className="text-white"
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
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
