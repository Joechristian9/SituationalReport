import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// xlsx is ~280 KB, so it is fetched only when someone is about to export,
// not on every page that shows this button.
const loadXlsx = () => import("xlsx");

/**
 * Reusable Excel download button
 *
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - File name for the Excel file (without extension)
 * @param {string} sheetName - Optional sheet name (defaults to 'Sheet1')
 * @param {Array<string>} excludeFields - Optional array of fields to exclude from export
 * @param {string} label - Optional button label text (defaults to "Download Excel")
 * @param {string} className - Optional custom Tailwind classes for button styling
 */
export default function DownloadExcelButton({
    data = [],
    fileName = "Exported_Data",
    sheetName = "Sheet1",
    excludeFields = ["id", "user_id", "updated_by"],
    label = "Download Excel",
    className = "",
}) {
    const [busy, setBusy] = useState(false);

    const handleDownload = async () => {
        if (!data || data.length === 0 || busy) return;

        // ✅ Clean the data by removing unwanted fields
        const cleanedData = data.map((item) => {
            const newItem = { ...item };
            excludeFields.forEach((field) => delete newItem[field]);
            return newItem;
        });

        setBusy(true);
        try {
            const XLSX = await loadXlsx();

            // ✅ Generate and download Excel file
            const worksheet = XLSX.utils.json_to_sheet(cleanedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        } finally {
            setBusy(false);
        }
    };

    const Icon = busy ? Loader2 : Download;

    return (
        <button
            type="button"
            onClick={handleDownload}
            onPointerEnter={loadXlsx}
            onFocus={loadXlsx}
            disabled={busy || !data?.length}
            aria-busy={busy}
            className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:min-h-9",
                busy && "disabled:cursor-wait",
                className,
            )}
        >
            <Icon className={cn("h-4 w-4 text-success", busy && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
            <span>{label}</span>
        </button>
    );
}
