import React from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet } from "lucide-react";

export default function DownloadExcelButton({
    data = [],
    fileName = "export",
    sheetName = "Sheet1",
}) {
    const handleDownload = () => {
        if (!data || data.length === 0) {
            alert("No data available to export.");
            return;
        }

        // ✅ Remove id, user_id, updated_by fields
        const filteredData = data.map((item) => {
            const newItem = { ...item };
            delete newItem.id;
            delete newItem.user_id;
            delete newItem.updated_by;
            return newItem;
        });

        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    return (
        <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md shadow-sm hover:bg-green-50 hover:border-green-400 transition text-slate-700 text-sm"
        >
            <FileSpreadsheet size={16} />
            <span>Excel</span>
        </button>
    );
}
