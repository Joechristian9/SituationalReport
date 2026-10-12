import * as React from "react";

/** Brand block at the top of the sidebar; in icon mode only the logo stays. */
export function TeamSwitcher({ teams }) {
    const activeTeam = teams[0];

    if (!activeTeam) {
        return null;
    }

    return (
        <div className="flex h-12 items-center gap-3 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <img
                src={activeTeam.logo}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full bg-white object-cover ring-2 ring-sidebar-primary/60 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8"
            />
            <div className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-base font-semibold text-sidebar-accent-foreground">
                    {activeTeam.name}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/80">
                    Situational Report
                </span>
            </div>
        </div>
    );
}
