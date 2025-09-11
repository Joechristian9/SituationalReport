"use client";

import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({ items, label = "Main Menu" }) {
    return (
        <div>
            {/* Label */}
            <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                {label}
            </div>

            <SidebarMenu className="space-y-1">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                            <a
                                href={item.url}
                                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300"
                            >
                                {item.icon && (
                                    <item.icon className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600" />
                                )}
                                <span>{item.title}</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </div>
    );
}
//last
