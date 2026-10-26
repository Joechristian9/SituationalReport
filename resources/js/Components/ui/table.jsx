import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { useDensity } from "@/Components/data/density";
import { Skeleton } from "@/Components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CELL_LABEL } from "@/lib/responsiveTable";

// Phones: rows stack into a flat list split by the rows' own divider lines, not cards
// inside the panel's card (editable form tables keep their cards: lib/responsiveTable.js).
const STACKED_DATA = [
    "max-md:block max-md:[&_thead]:hidden max-md:[&_tbody]:block max-md:[&_tfoot]:block",
    "max-md:[&_tr]:block max-md:[&_tr]:py-3",
    "max-md:[&_td]:block max-md:[&_td]:w-full max-md:[&_td]:py-1.5",
].join(" ");

const Table = React.forwardRef(({ className, stacked = false, ...props }, ref) => {
    const { density } = useDensity();
    return (
        <div className="relative w-full overflow-x-auto">
            <table
                ref={ref}
                data-density={density}
                className={cn("w-full caption-bottom text-sm", stacked && STACKED_DATA, className)}
                {...props}
            />
        </div>
    );
});
Table.displayName = "Table";

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
    <thead
        ref={ref}
        className={cn("bg-accent/50 [&_tr]:border-b [&_tr]:border-primary/15", className)}
        {...props}
    />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn("[&_tr:last-child]:border-0", className)}
        {...props}
    />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        className={cn(
            "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
            className
        )}
        {...props}
    />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(
            "border-b border-border/70 transition-colors duration-150 hover:bg-accent/30 data-[state=selected]:bg-accent",
            // Blue bar on the hovered row's leading edge.
            "md:hover:[&>td:first-child]:shadow-[inset_3px_0_0_hsl(var(--primary))]",
            "[thead_&]:hover:bg-transparent",
            className
        )}
        {...props}
    />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            "h-11 whitespace-nowrap px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-accent-foreground [&:has([role=checkbox])]:pr-0",
            className
        )}
        {...props}
    />
));
TableHead.displayName = "TableHead";

/**
 * A header that sorts its column. `sort` is { key, dir } from useTableSort; `onSort(key)` toggles.
 */
const SortableHead = React.forwardRef(({ sortKey, sort, onSort, className, children, ...props }, ref) => {
    const active = sort?.key === sortKey;
    const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
    return (
        <TableHead
            ref={ref}
            aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
            className={className}
            {...props}
        >
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className={cn(
                    "-mx-1.5 inline-flex items-center gap-1.5 rounded px-1.5 py-1 uppercase tracking-wider transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active && "text-primary"
                )}
            >
                {children}
                <Icon className={cn("h-3.5 w-3.5", !active && "opacity-50")} aria-hidden="true" />
            </button>
        </TableHead>
    );
});
SortableHead.displayName = "SortableHead";

/** `label` names the column on phones when the table is `stacked`. */
const TableCell = React.forwardRef(({ className, label, children, ...props }, ref) => (
    <td
        ref={ref}
        className={cn(
            "px-4 py-3.5 align-middle transition-[padding] [[data-density=compact]_&]:py-2 [&:has([role=checkbox])]:pr-0",
            className
        )}
        {...props}
    >
        {label && <span className={CELL_LABEL}>{label}</span>}
        {children}
    </td>
));
TableCell.displayName = "TableCell";

/** Placeholder rows while a server-side list is loading. */
function TableSkeletonRows({ columns, rows = 5 }) {
    return Array.from({ length: rows }, (_, row) => (
        <TableRow key={`skeleton-${row}`} aria-hidden="true" className="hover:bg-transparent">
            {Array.from({ length: columns }, (_, col) => (
                <TableCell key={col}>
                    <Skeleton className={cn("h-4", col === 0 ? "w-36" : col === columns - 1 ? "ml-auto w-12" : "w-24")} />
                </TableCell>
            ))}
        </TableRow>
    ));
}

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
    <caption
        ref={ref}
        className={cn("mt-4 text-sm text-muted-foreground", className)}
        {...props}
    />
));
TableCaption.displayName = "TableCaption";

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    SortableHead,
    TableRow,
    TableCell,
    TableSkeletonRows,
    TableCaption,
};
