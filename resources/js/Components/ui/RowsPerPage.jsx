import React, { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";

const OPTIONS = [5, 10, 20, 50];

export default function RowsPerPage({ rowsPerPage, setRowsPerPage, choices = OPTIONS, label = "Rows per page" }) {
    const id = useId();
    const current = Number(rowsPerPage);
    const options = choices.includes(current) ? choices : [...choices, current].sort((a, b) => a - b);

    return (
        <div className="flex items-center gap-2 text-sm">
            <label htmlFor={id} className="whitespace-nowrap text-muted-foreground">
                {label}
            </label>
            <Select value={String(current)} onValueChange={(value) => setRowsPerPage(Number(value))}>
                <SelectTrigger id={id} className="h-10 w-[4.5rem] bg-card tabular-nums md:h-9">
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
