import React, { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";

const OPTIONS = [5, 10, 20, 50];

/** `shortLabel` replaces the visible label on phones (the full label stays for screen readers). */
export default function RowsPerPage({ rowsPerPage, setRowsPerPage, choices = OPTIONS, label = "Rows per page", shortLabel }) {
    const id = useId();
    const current = Number(rowsPerPage);
    const options = choices.includes(current) ? choices : [...choices, current].sort((a, b) => a - b);

    return (
        <div className="flex items-center gap-2 text-sm">
            <label htmlFor={id} className="whitespace-nowrap text-muted-foreground">
                {shortLabel ? (
                    <>
                        <span className="sr-only sm:not-sr-only">{label}</span>
                        <span aria-hidden="true" className="sm:hidden">{shortLabel}</span>
                    </>
                ) : (
                    label
                )}
            </label>
            <Select value={String(current)} onValueChange={(value) => setRowsPerPage(Number(value))}>
                <SelectTrigger id={id} className="h-11 w-[4.5rem] bg-card tabular-nums md:h-9">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((num) => (
                        <SelectItem key={num} value={String(num)} className="tabular-nums">
                            {num}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
