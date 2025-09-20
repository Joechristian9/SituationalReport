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
                    <div className="flex items-center gap-2">
                        <img
                            src={activeTeam.logo}
                            alt="Team Logo"
                            className="h-9 w-9 rounded-full"
                        />
                        <div className="text-lg font-semibold truncate">
                            {activeTeam.name}
                        </div>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
