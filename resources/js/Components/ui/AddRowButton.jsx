import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Secondary button that adds a row to a table or list. Honours `disabled`, so rows
 * cannot be added while forms are closed (no active disaster, or paused).
 *
 * @param {function} props.onClick
 * @param {boolean} [props.disabled]
 * @param {string} [props.label='Add row']
 * @param {React.ReactNode} [props.icon] - Defaults to the Plus icon.
 * @param {React.ReactNode} [props.children] - Replaces icon and label entirely.
 */
export default function AddRowButton({ onClick, disabled = false, label = "Add row", icon, children, className }) {
    return (
        <Button
            type="button"
            variant="outline"
            onClick={onClick}
            disabled={disabled}
            className={cn("min-h-11 w-full sm:min-h-9 sm:w-auto", className)}
        >
            {children ?? (
                <>
                    {icon || <Plus className="h-4 w-4" aria-hidden="true" />}
                    {label}
                </>
            )}
        </Button>
    );
}
