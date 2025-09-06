// resources/js/components/Breadcrumbs.jsx

import React from "react";
import { Link } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";

/**
 * A reusable breadcrumbs component.
 * @param {object} props
 * @param {Array<{href?: string, label: string}>} props.crumbs - An array of breadcrumb objects.
 */
export default function Breadcrumbs({ crumbs }) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2">
            {crumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                    {/* Render a link for all but the last crumb */}
                    {index < crumbs.length - 1 ? (
                        <Link
                            href={crumb.href}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    ) : (
                        // Render plain text for the current page (the last crumb)
                        <span className="font-semibold text-gray-800">
                            {crumb.label}
                        </span>
                    )}

                    {/* Render a separator for all but the last crumb */}
                    {index < crumbs.length - 1 && (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}
