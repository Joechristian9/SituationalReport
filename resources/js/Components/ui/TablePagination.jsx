import React from "react";
import { Link } from "@inertiajs/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RowsPerPage from "@/Components/ui/RowsPerPage";
import { cn } from "@/lib/utils";

/** Page numbers to show: first, last, and current ±1, with "…" for the gaps. */
const pageWindow = (current, total) => {
    const pages = [];
    for (let page = 1; page <= total; page++) {
        if (page === 1 || page === total || Math.abs(page - current) <= 1) {
            if (pages.length && page - pages[pages.length - 1] > 1) pages.push("gap");
            pages.push(page);
        }
    }
    return pages;
};

const BOX = "inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-2 text-sm tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:min-w-9";
const IDLE = "border-input bg-card text-foreground hover:bg-muted";
const ACTIVE = "border-info bg-info text-info-foreground hover:bg-info/90";
const DISABLED = "pointer-events-none border-input bg-card text-muted-foreground opacity-50";

function PageControl({ page, label, active, disabled, pageHref, onPageChange, children }) {
    const className = cn(BOX, disabled ? DISABLED : active ? ACTIVE : IDLE);
    const common = { "aria-label": label, "aria-current": active ? "page" : undefined };

    if (disabled) {
        return (
            <span className={className} aria-disabled="true" aria-label={label}>
                {children}
            </span>
        );
    }
    if (pageHref) {
        return (
            <Link href={pageHref(page)} preserveScroll preserveState className={className} {...common}>
                {children}
            </Link>
        );
    }
    return (
        <button type="button" onClick={() => onPageChange(page)} className={className} {...common}>
            {children}
        </button>
    );
}

/**
 * Shared table footer: "Showing X to Y of Z results", rows-per-page select and
 * numbered pagination. Works client-side (`onPageChange`) or server-side with a
 * Laravel paginator (`pageHref(page)` returns the URL for a page).
 */
export default function TablePagination({
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    perPage = 10,
    onPageChange,
    pageHref,
    onPerPageChange,
    itemLabel = "results",
    className = "",
}) {
    if (!totalItems) return null;

    const lastPage = Math.max(1, totalPages);
    const page = Math.min(Math.max(1, currentPage), lastPage);
    const from = (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, totalItems);
    const nav = { pageHref, onPageChange };

    return (
        <div className={cn("flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between", className)}>
            <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
                Showing {from.toLocaleString()} to {to.toLocaleString()} of {totalItems.toLocaleString()} {itemLabel}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {onPerPageChange && <RowsPerPage rowsPerPage={perPage} setRowsPerPage={onPerPageChange} />}

                {/* Shown even for a single page (arrows disabled) so people can see the
                    table is paged; hiding it read as "pagination is broken". */}
                <nav className="flex items-center gap-1.5" aria-label="Pagination">
                    <PageControl page={page - 1} label="Previous page" disabled={page <= 1} {...nav}>
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </PageControl>

                    {/* Phones: compact "2 / 5"; larger screens: numbered pages */}
                    <span className="min-w-14 px-1 text-center text-sm tabular-nums text-muted-foreground sm:hidden">
                        {page} / {lastPage}
                    </span>
                    <ul className="hidden items-center gap-1.5 sm:flex">
                        {pageWindow(page, lastPage).map((item, i) => (
                            <li key={item === "gap" ? `gap-${i}` : item}>
                                {item === "gap" ? (
                                    <span className="px-1 text-sm text-muted-foreground" aria-hidden="true">…</span>
                                ) : (
                                    <PageControl page={item} label={`Page ${item}`} active={item === page} {...nav}>
                                        {item}
                                    </PageControl>
                                )}
                            </li>
                        ))}
                    </ul>

                    <PageControl page={page + 1} label="Next page" disabled={page >= lastPage} {...nav}>
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </PageControl>
                </nav>
            </div>
        </div>
    );
}

/** Props for a Laravel LengthAwarePaginator (keeps the current query string). */
export const laravelPagination = (paginator) => ({
    currentPage: paginator.current_page,
    totalPages: paginator.last_page,
    totalItems: paginator.total,
    perPage: Number(paginator.per_page),
    pageHref: (page) => {
        const url = new URL(paginator.first_page_url || paginator.path, window.location.origin);
        url.searchParams.set("page", page);
        return url.toString();
    },
});
