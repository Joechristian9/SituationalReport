import { useEffect, useMemo, useState } from "react";
import { Rows2, Rows4, Search, SearchX, SlidersHorizontal, X } from "lucide-react";

import { DensityContext, useDensity } from "@/Components/data/density";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/Components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/*
 * The one layout every admin list uses:
 *   <DataPanel icon title count actions>
 *     <DataToolbar search filters chips/>
 *     <Table stacked> (SortableHead, TableSkeletonRows) </Table>  or  <EmptyState/>
 *     <TablePagination className={PANEL_PAGINATION}/>
 *   </DataPanel>
 */

/** Pass to TablePagination when it sits at the bottom of a DataPanel. */
export const PANEL_PAGINATION = "border-t border-border bg-muted/30 px-4 py-3";

const DENSITY_KEY = "admin-table-density";

const readDensity = () => {
    try {
        return localStorage.getItem(DENSITY_KEY) === "compact" ? "compact" : "comfortable";
    } catch {
        return "comfortable";
    }
};

export function DataPanel({ icon: Icon, title, count, description, actions, className, children }) {
    const [density, setDensityState] = useState(readDensity);
    const setDensity = (value) => {
        setDensityState(value);
        try {
            localStorage.setItem(DENSITY_KEY, value);
        } catch {
            // Private mode or blocked storage: the choice just isn't remembered.
        }
    };
    const densityValue = useMemo(() => ({ density, setDensity }), [density]);

    return (
        <DensityContext.Provider value={densityValue}>
            <section
                className={cn(
                    "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
                    className
                )}
            >
                {title && (
                    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex min-w-0 items-start gap-3">
                            {Icon && (
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                                    <Icon className="h-5 w-5" aria-hidden="true" />
                                </span>
                            )}
                            <div className="min-w-0">
                                <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground sm:text-lg">
                                    {title}
                                    {count !== undefined && count !== null && (
                                        <span
                                            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary"
                                            aria-live="polite"
                                        >
                                            {Number(count).toLocaleString()}
                                        </span>
                                    )}
                                </h2>
                                {description && (
                                    <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                                )}
                            </div>
                        </div>
                        {actions && (
                            <div className="flex flex-wrap items-center gap-2">{actions}</div>
                        )}
                    </div>
                )}
                {children}
            </section>
        </DensityContext.Provider>
    );
}

export function SearchInput({ id, value, onChange, onClear, placeholder = "Search…", label = "Search" }) {
    return (
        <div className="relative w-full">
            <Label htmlFor={id} className="sr-only">
                {label}
            </Label>
            <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
            />
            <Input
                id={id}
                type="search"
                autoComplete="off"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-11 rounded-lg border-input bg-card pl-9 pr-10 shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-ring md:h-9 [&::-webkit-search-cancel-button]:hidden"
            />
            {value && (
                <button
                    type="button"
                    onClick={onClear ?? (() => onChange(""))}
                    aria-label="Clear search"
                    className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-7 md:w-7"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            )}
        </div>
    );
}

const pillClass = (active) =>
    cn(
        "h-11 w-full justify-between gap-1.5 rounded-lg px-3 text-sm shadow-sm transition-colors md:h-9 md:w-auto md:justify-start md:rounded-full",
        active
            ? "border-primary/40 bg-primary/10 text-accent-foreground hover:bg-primary/15"
            : "border-dashed border-input bg-card text-foreground hover:border-solid hover:bg-muted/60"
    );

/**
 * A filter as a pill: "Status: All ▾". `options` = [{ value, label }]; `allValue`
 * is the "no filter" option, shown first with `allLabel`.
 */
export function FilterSelect({ id, label, value, onChange, options, allValue = "all", allLabel = "All" }) {
    const active = value !== allValue;
    return (
        <Select value={value} onValueChange={onChange}>
            {/* SelectTrigger line-clamps its child span, so the label stays inline text. */}
            <SelectTrigger id={id} className={cn(pillClass(active), "focus:ring-2")}>
                <span className="text-left">
                    <span className={cn("mr-1", !active && "text-muted-foreground")}>{label}:</span>
                    <span className="font-medium">
                        <SelectValue />
                    </span>
                </span>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={allValue}>{allLabel}</SelectItem>
                {options.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

/** A date filter as a pill: "From [date]". */
export function FilterDate({ id, label, value, onChange, min, max }) {
    const active = Boolean(value);
    return (
        <label
            htmlFor={id}
            className={cn(
                pillClass(active),
                "inline-flex cursor-pointer items-center border focus-within:ring-2 focus-within:ring-ring"
            )}
        >
            <span className={cn("shrink-0", !active && "text-muted-foreground")}>{label}:</span>
            <input
                id={id}
                type="date"
                value={value}
                min={min}
                max={max}
                onChange={(e) => onChange(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-inherit focus:outline-none focus:ring-0 md:w-[8.5rem] md:flex-none"
            />
        </label>
    );
}

function DensityToggle() {
    const { density, setDensity } = useDensity();
    if (!setDensity) return null;

    const option = (value, Icon, label) => (
        <button
            type="button"
            onClick={() => setDensity(value)}
            aria-pressed={density === value}
            aria-label={label}
            title={label}
            className={cn(
                "inline-flex h-7 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                density === value
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
            )}
        >
            <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
    );

    return (
        <div className="hidden items-center rounded-lg border border-input bg-muted/60 p-0.5 md:inline-flex" role="group" aria-label="Row height">
            {option("comfortable", Rows2, "Comfortable rows")}
            {option("compact", Rows4, "Compact rows")}
        </div>
    );
}

/**
 * Search and filters above a list, on a tinted band. `search` = { id, value, onChange,
 * onClear?, placeholder }. `filters` are FilterSelect / FilterDate pills; on phones they
 * move into a bottom sheet. `chips` = [{ key, label, onRemove }] for the applied filters.
 * `onClearAll` resets the search and every filter.
 */
export function DataToolbar({ search, filters, chips = [], onClearAll, className }) {
    const isMobile = useIsMobile();
    const [sheetOpen, setSheetOpen] = useState(false);
    const canClear = onClearAll && (chips.length > 0 || !!search?.value);

    return (
        <div className={cn("space-y-3 border-y border-border bg-muted/40 px-4 py-3 sm:px-5", className)}>
            <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center">
                <div className="flex items-center gap-2 md:w-72 lg:w-80">
                    {search && (
                        <div role="search" className="w-full">
                            <SearchInput {...search} />
                        </div>
                    )}
                    {filters && isMobile && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSheetOpen(true)}
                            className="h-11 shrink-0 gap-2 rounded-lg bg-card shadow-sm"
                        >
                            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                            Filters
                            {chips.length > 0 && (
                                <span className="rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">
                                    {chips.length}
                                </span>
                            )}
                        </Button>
                    )}
                </div>

                {filters && !isMobile && <div className="flex flex-wrap items-center gap-2">{filters}</div>}

                <div className="md:ml-auto">
                    <DensityToggle />
                </div>
            </div>

            {(chips.length > 0 || canClear) && (
                <div className="flex flex-wrap items-center gap-2">
                    {chips.map((chip) => (
                        <span
                            key={chip.key}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-card py-0.5 pl-2.5 pr-0.5 text-xs font-medium text-foreground shadow-sm"
                        >
                            {chip.label}
                            <button
                                type="button"
                                onClick={chip.onRemove}
                                aria-label={`Remove filter: ${chip.label}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-6 md:w-6"
                            >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                        </span>
                    ))}
                    {canClear && (
                        <button
                            type="button"
                            onClick={onClearAll}
                            className="rounded-sm px-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            )}

            {filters && isMobile && (
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
                        <SheetHeader className="text-left">
                            <SheetTitle>Filters</SheetTitle>
                            <SheetDescription>Narrow down the list.</SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-3 py-4">{filters}</div>
                        <SheetFooter className="gap-2">
                            {canClear && (
                                <Button type="button" variant="outline" className="h-11" onClick={onClearAll}>
                                    Clear all
                                </Button>
                            )}
                            <Button type="button" className="h-11" onClick={() => setSheetOpen(false)}>
                                Show results
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            )}
        </div>
    );
}

export function EmptyState({ icon: Icon = SearchX, title, description, action, className }) {
    return (
        <div className={cn("flex flex-col items-center gap-2 px-4 py-14 text-center", className)}>
            <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary ring-8 ring-accent/40">
                <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-base font-semibold text-foreground">{title}</p>
            {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}

/**
 * Client-side column sorting. `accessors` maps a sort key to (row) => comparable value.
 * Starts unsorted (the data's own order) unless `initial` = { key, dir } is given.
 */
export function useTableSort(rows, accessors, initial = null) {
    const [sort, setSort] = useState(initial);

    const sorted = useMemo(() => {
        if (!sort || !accessors[sort.key]) return rows;
        const get = accessors[sort.key];
        const factor = sort.dir === "asc" ? 1 : -1;
        return [...rows].sort((a, b) => {
            const x = get(a);
            const y = get(b);
            if (x === y) return 0;
            if (x === null || x === undefined || x === "") return 1;
            if (y === null || y === undefined || y === "") return -1;
            if (typeof x === "number" && typeof y === "number") return (x - y) * factor;
            return String(x).localeCompare(String(y), undefined, { numeric: true }) * factor;
        });
    }, [rows, sort, accessors]);

    const toggle = (key) =>
        setSort((current) =>
            current?.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
        );

    return { sorted, sort, toggle };
}

/** Keeps a loading flag up only while an Inertia visit is slow, so quick ones don't flash. */
export function useDelayedFlag(flag, delay = 150) {
    const [shown, setShown] = useState(false);
    useEffect(() => {
        if (!flag) {
            setShown(false);
            return;
        }
        const t = setTimeout(() => setShown(true), delay);
        return () => clearTimeout(t);
    }, [flag, delay]);
    return shown;
}
