import { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { ChevronDown, Plus, X } from "lucide-react";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const pathOf = (url) => new URL(url, window.location.origin).pathname;

/*
 * Active state comes from the page URL Inertia rendered, not window.location: with
 * client-side visits the address bar can update after the new page renders.
 */
function isCurrent(item, currentPath) {
    return [item.url, ...(item.alsoActiveOn ?? [])].some((url) => {
        const path = pathOf(url);
        return currentPath === path || currentPath.startsWith(`${path}/`);
    });
}

const groupLabelClass =
    "h-7 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70";

const itemClass = cn(
    "relative h-auto min-h-11 gap-3 px-3 py-2 text-sidebar-foreground/85 md:min-h-9",
    "transition-[width,height,padding,background-color,color] duration-150",
    "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
    "data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm",
    "data-[active=true]:[&>svg]:text-sidebar-primary [&>svg]:size-[18px]",
    // Left marker on the current page, so it never relies on the background tint alone.
    "before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-sidebar-primary before:opacity-0 data-[active=true]:before:opacity-100"
);

export function NavMain({ groups = [] }) {
    const { url } = usePage();
    const { state, isMobile, setOpenMobile } = useSidebar();
    const collapsed = state === "collapsed" && !isMobile;
    const currentPath = url.split("?")[0];
    const [addYearGroup, setAddYearGroup] = useState(null);

    // The mobile drawer stays open across visits to the same page component.
    const closeDrawer = () => isMobile && setOpenMobile(false);

    return (
        <>
            {groups.map((group) => (
                <NavGroup
                    key={group.label}
                    group={group}
                    collapsed={collapsed}
                    currentPath={currentPath}
                    onNavigate={closeDrawer}
                    onAddYear={() => setAddYearGroup(group)}
                />
            ))}

            <AddYearDialog
                group={addYearGroup}
                onClose={() => setAddYearGroup(null)}
            />
        </>
    );
}

function NavGroup({ group, collapsed, currentPath, onNavigate, onAddYear }) {
    const [open, setOpen] = useState(true);

    const menu = (
        <SidebarGroupContent>
            <SidebarMenu>
                {group.items.map((item) => (
                    <NavItem
                        key={item.title}
                        item={item}
                        active={isCurrent(item, currentPath)}
                        onNavigate={onNavigate}
                    />
                ))}

                {group.addYear && (
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={onAddYear}
                            tooltip="Add year"
                            className={itemClass}
                        >
                            <Plus aria-hidden="true" />
                            <span>Add year</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
        </SidebarGroupContent>
    );

    if (!group.collapsible) {
        return (
            <SidebarGroup className="py-1">
                <SidebarGroupLabel className={groupLabelClass}>
                    {group.label}
                </SidebarGroupLabel>
                {menu}
            </SidebarGroup>
        );
    }

    // In icon mode the label is hidden, so keep the items reachable.
    return (
        <Collapsible open={open || collapsed} onOpenChange={setOpen} asChild>
            <SidebarGroup className="py-1">
                <SidebarGroupLabel asChild className={groupLabelClass}>
                    <CollapsibleTrigger className="w-full cursor-pointer justify-between hover:text-sidebar-accent-foreground">
                        {group.label}
                        <ChevronDown
                            aria-hidden="true"
                            className={cn(
                                "transition-transform duration-200 motion-reduce:transition-none",
                                !open && "-rotate-90"
                            )}
                        />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>{menu}</CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
}

function NavItem({ item, active, onNavigate }) {
    const Icon = item.icon;
    const content = (
        <>
            {Icon && <Icon aria-hidden="true" />}
            <span className="!whitespace-normal leading-tight">
                {item.title}
            </span>
        </>
    );

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={item.title}
                className={itemClass}
            >
                {item.external ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {content}
                    </a>
                ) : (
                    <Link
                        href={item.url}
                        aria-current={active ? "page" : undefined}
                        onClick={onNavigate}
                    >
                        {content}
                    </Link>
                )}
            </SidebarMenuButton>

            {item.onRemove && (
                <SidebarMenuAction
                    onClick={item.onRemove}
                    aria-label={`Remove ${item.title}`}
                    className="top-2.5 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
                >
                    <X />
                </SidebarMenuAction>
            )}
        </SidebarMenuItem>
    );
}

function AddYearDialog({ group, onClose }) {
    const [newYear, setNewYear] = useState("");
    const [yearError, setYearError] = useState("");
    const maxYear = new Date().getFullYear() + 10;

    const close = () => {
        setNewYear("");
        setYearError("");
        onClose();
    };

    const handleAddYear = () => {
        const yearNum = parseInt(newYear, 10);

        if (!newYear) {
            setYearError("Please enter a year");
        } else if (isNaN(yearNum)) {
            setYearError("Please enter a valid year");
        } else if (yearNum < 1900 || yearNum > maxYear) {
            setYearError(`Year must be between 1900 and ${maxYear}`);
        } else if (!group.addYear(yearNum)) {
            setYearError("This year already exists in the list");
        } else {
            close();
        }
    };

    return (
        <Dialog open={!!group} onOpenChange={(open) => !open && close()}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            <Plus className="h-4 w-4 text-primary" aria-hidden="true" />
                        </span>
                        Add Year
                    </DialogTitle>
                    <DialogDescription>
                        Enter a year to add to your annual reports list.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-4">
                    <Label htmlFor="year">Year</Label>
                    <Input
                        id="year"
                        type="number"
                        placeholder="e.g., 2020"
                        value={newYear}
                        onChange={(e) => {
                            setNewYear(e.target.value);
                            setYearError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleAddYear()}
                        min="1900"
                        max={maxYear}
                        aria-invalid={!!yearError}
                        aria-describedby="year-help"
                    />
                    <p id="year-help" className="text-xs text-muted-foreground">
                        Valid range: 1900 - {maxYear}
                    </p>
                    {yearError && (
                        <p role="alert" className="text-sm text-destructive">
                            {yearError}
                        </p>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={close}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleAddYear}>
                        Add Year
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
