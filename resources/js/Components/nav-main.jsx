"use client";

import * as React from "react";
import { useState } from "react";
import { usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useSidebar } from "@/components/ui/sidebar";
import { Plus, X, ChevronDown } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    const [isAddYearDialogOpen, setIsAddYearDialogOpen] = useState(false);
    const [newYear, setNewYear] = useState('');
    const [yearError, setYearError] = useState('');
    const [isAnnualReportsOpen, setIsAnnualReportsOpen] = useState(true);

    const handleAddYear = () => {
        setYearError('');
        const currentYear = new Date().getFullYear();
        const yearNum = parseInt(newYear, 10);
        
        if (!newYear) {
            setYearError('Please enter a year');
            return;
        }
        
        if (isNaN(yearNum)) {
            setYearError('Please enter a valid year');
            return;
        }
        
        if (yearNum < 1900 || yearNum > currentYear + 10) {
            setYearError(`Year must be between 1900 and ${currentYear + 10}`);
            return;
        }
        
        // Find the Annual Reports item and call its addYear function
        const annualReportsItem = items.find(item => item.title === "Annual Reports");
        if (annualReportsItem && annualReportsItem.addYear) {
            const success = annualReportsItem.addYear(yearNum);
            if (success) {
                setNewYear('');
                setIsAddYearDialogOpen(false);
            } else {
                setYearError('This year already exists in the list');
            }
        }
    };

    return (
        <>
            <SidebarGroup>
                <SidebarGroupContent>
                    <SidebarMenu className="space-y-2">
                    {items.map((item) => {
                        const hasSubItems =
                            Array.isArray(item.items) && item.items.length > 0;
                        const Icon = item.icon;

                        const renderSubMenu = () => {
                            const isAnnualReports = item.title === "Annual Reports";
                            
                            return (
                                <SidebarMenuSub className="mt-1 space-y-1">
                                    {item.items.map((subItem) => {
                                        const SubIcon = subItem.icon;
                                        
                                        // Extract route pattern from title (e.g., "Situation Overview" -> "situation-reports")
                                        let routePattern = null;
                                        if (subItem.title === "Situation Overview") routePattern = "situation-reports";
                                        else if (subItem.title === "Pre-Emptive Reports") routePattern = "preemptive-reports";
                                        else if (subItem.title === "Declaration USC") routePattern = "declaration-usc";
                                        else if (subItem.title === "Deployment of Response Assets") routePattern = "pre-positioning";
                                        else if (subItem.title === "Incidents Monitored") routePattern = "incident-monitored";
                                        else if (subItem.title === "Response Operations") routePattern = "response-operations";
                                        else if (subItem.title === "Assistance Extended") routePattern = "assistance";
                                        else if (subItem.title === "Dashboard") routePattern = "admin.dashboard";
                                        
                                        // Check if current route matches the pattern
                                        const isActive = routePattern 
                                            ? route().current(routePattern + '.*') || route().current(routePattern)
                                            : currentUrl === subItem.url || 
                                              currentUrl.startsWith(subItem.url + '/') ||
                                              (subItem.url && currentUrl.startsWith(subItem.url.split('?')[0]));

                                        // ================================================================
                                        // == START: Logic to conditionally open links in a new tab      ==
                                        // ================================================================

                                        // Check if the parent item is the "Annual Reports" menu.
                                        // This title comes from your AppSidebar.jsx component.
                                        const isReportLink =
                                            item.title === "Annual Reports";

                                        return (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <div className="flex items-center gap-1">
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={isActive}
                                                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 flex-1
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
                                                    {isAnnualReports && subItem.isCustom && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (subItem.onRemove) {
                                                                    subItem.onRemove();
                                                                }
                                                            }}
                                                            className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                                            title="Remove this year"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </SidebarMenuSubItem>
                                        );
                                    })}
                                    {isAnnualReports && item.addYear && (
                                        <SidebarMenuSubItem>
                                            <button
                                                onClick={() => setIsAddYearDialogOpen(true)}
                                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 w-full text-white/80 hover:bg-white/10 hover:text-white   "
                                            >
                                                <Plus className="h-4 w-4" />
                                                <span>Add Year</span>
                                            </button>
                                        </SidebarMenuSubItem>
                                    )}
                                </SidebarMenuSub>
                            );
                        };
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

                        // Annual Reports with dropdown functionality
                        if (item.title === "Annual Reports") {
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        onClick={() => setIsAnnualReportsOpen(!isAnnualReportsOpen)}
                                        tooltip={item.title}
                                        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            {Icon && (
                                                <Icon
                                                    className="h-5 w-5"
                                                    color="white"
                                                />
                                            )}
                                            {!isCollapsed && (
                                                <span>{item.title}</span>
                                            )}
                                        </div>
                                        {!isCollapsed && hasSubItems && (
                                            <ChevronDown
                                                className={`h-4 w-4 transition-transform duration-200 ${
                                                    isAnnualReportsOpen ? 'rotate-180' : ''
                                                }`}
                                                color="white"
                                            />
                                        )}
                                    </SidebarMenuButton>
                                    {!isCollapsed && hasSubItems && isAnnualReportsOpen && renderSubMenu()}
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
            
            <Dialog open={isAddYearDialogOpen} onOpenChange={setIsAddYearDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center">
                                <Plus className="h-4 w-4 text-blue-600" />
                            </div>
                            Add Year
                        </DialogTitle>
                        <DialogDescription>
                            Enter a year to add to your annual reports list.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="year" className="text-sm font-medium text-gray-700">
                                Year
                            </Label>
                            <Input
                                id="year"
                                type="number"
                                placeholder="e.g., 2020"
                                value={newYear}
                                onChange={(e) => {
                                    setNewYear(e.target.value);
                                    setYearError('');
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddYear();
                                    }
                                }}
                                className="w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="1900"
                                max={new Date().getFullYear() + 10}
                            />
                            <p className="text-xs text-gray-500">
                                Valid range: 1900 - {new Date().getFullYear() + 10}
                            </p>
                        </div>
                        {yearError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600">{yearError}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsAddYearDialogOpen(false);
                                setNewYear('');
                                setYearError('');
                            }}
                            className="border-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="button" 
                            onClick={handleAddYear}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Add Year
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
