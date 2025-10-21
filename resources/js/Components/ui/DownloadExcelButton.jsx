import React from "react";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

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
    const handleDownload = () => {
        if (!data || data.length === 0) return;

        // ✅ Clean the data by removing unwanted fields
        const cleanedData = data.map((item) => {
            const newItem = { ...item };
            excludeFields.forEach((field) => delete newItem[field]);
            return newItem;
        });

        // ✅ Generate and download Excel file
        const worksheet = XLSX.utils.json_to_sheet(cleanedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    return (
        <button
            onClick={handleDownload}
            className={`flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg shadow hover:bg-green-700 active:scale-95 transition-transform ${className}`}
        >
            <Download className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}
