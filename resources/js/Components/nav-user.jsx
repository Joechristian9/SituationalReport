"use client";

import { ChevronsUpDown, CircleUserRound, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { useState } from "react";
import LogoutDialog from "@/Components/LogoutDialog";

export function NavUser({ user }) {
    const { isMobile } = useSidebar();
    const [logoutOpen, setLogoutOpen] = useState(false);

    return (
        // ✅ MODIFICATION: Glassmorphism classes applied to the root element.
        <SidebarMenu
            className="
                rounded-lg border border-white/20
                bg-white/10 shadow-lg backdrop-blur-lg
            "
        >
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            // ✅ MODIFICATION: Button is now transparent to show the glass effect.
                            // We use semi-transparent white for hover and open states.
                            className="bg-transparent hover:bg-white/10 data-[state=open]:bg-white/20"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    src={user.avatar}
                                    alt={user.name}
                                />
                                <AvatarFallback className="rounded-lg">
                                    <CircleUserRound />
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold text-white">
                                    {" "}
                                    {/* Ensure text is white */}
                                    {user.name}
                                </span>
                                <span className="truncate text-xs text-white/80">
                                    {" "}
                                    {/* Lighter text for email */}
                                    {user.email}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4 text-white/80" />{" "}
                            {/* Lighter chevron */}
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={user.avatar}
                                        alt={user.name}
                                    />
                                    <AvatarFallback className="rounded-lg">
                                        <CircleUserRound />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        {user.name}
                                    </span>
                                    <span className="truncate text-xs">
                                        {user.email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setLogoutOpen(true)}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
