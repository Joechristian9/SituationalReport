// resources/js/components/Breadcrumbs.jsx

import React from "react";
import { Link } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A reusable breadcrumbs component. On phones only the current page is shown, on
 * one line (truncated if needed), so the header never wraps or pushes its
 * right-hand badges off screen; the full trail shows from sm up.
 * @param {object} props
 * @param {Array<{href?: string, label: string}>} props.crumbs - An array of breadcrumb objects.
 */
export default function Breadcrumbs({ crumbs }) {
    const last = crumbs.length - 1;

    return (
        <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex min-w-0 items-center gap-2">
                {crumbs.map((crumb, index) => (
                    <li
                        key={index}
                        className={cn("flex min-w-0 items-center gap-2", index < last && "hidden shrink-0 sm:flex")}
                    >
                        {index < last ? (
                            <>
                                {crumb.href ? (
                                    <Link
                                        href={crumb.href}
                                        className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="whitespace-nowrap text-muted-foreground">{crumb.label}</span>
                                )}
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            </>
                        ) : (
                            <span aria-current="page" title={crumb.label} className="truncate font-semibold text-foreground">
                                {crumb.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
