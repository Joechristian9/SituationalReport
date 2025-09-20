import * as React from "react";

import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

export function TeamSwitcher({ teams }) {
    // Component is now static, so we just display the first team.
    const activeTeam = teams[0];

    if (!activeTeam) {
        return null;
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                {/* 
                  ENHANCEMENT: Removed DropdownMenu wrappers and disabled the button 
                  to make it completely non-clickable.
                */}
                <SidebarMenuButton
                    size="lg"
                    disabled // This is the key change to make it non-interactive.
                    className="
                        cursor-default      // Use the default cursor, not a pointer.
                        hover:bg-transparent // Ensure no hover effect.
                        disabled:opacity-100 // Prevent the default fade-out on disabled items.
                        focus-visible:ring-0 // Remove focus ring.
                        focus-visible:ring-offset-0
                    "
                >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <activeTeam.logo className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                            {activeTeam.name}
                        </span>
                        <span className="truncate text-xs">
                            {activeTeam.plan}
                        </span>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
