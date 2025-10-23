import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // <-- 1. Change this import
import { FileText } from "lucide-react";

export default function DownloadPDFButton({
    data = [],
    fileName = "export",
    title = "Report",
}) {
    const handleDownload = () => {
        if (!data || data.length === 0) {
            alert("No data available to export.");
            return;
        }

        const doc = new jsPDF();

        // ✅ Remove id, user_id, updated_by fields
        const filteredData = data.map((item) => {
            const newItem = { ...item };
            delete newItem.id;
            delete newItem.user_id;
            delete newItem.updated_by;
            return newItem;
        });

        // Ensure there is data after filtering before creating headers
        if (filteredData.length === 0) {
            alert("No data to export after filtering.");
            return;
        }

        const headers = Object.keys(filteredData[0]);
        const body = filteredData.map((row) => Object.values(row));

        doc.text(title, 14, 16);

        // v-- 2. Change how autoTable is called
        autoTable(doc, {
            head: [headers],
            body: body,
            startY: 20,
        });

        doc.save(`${fileName}.pdf`);
    };

    return (
        <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md shadow-sm hover:bg-blue-50 hover:border-blue-400 transition text-slate-700 text-sm"
        >
            <FileText size={16} />
            <span>PDF</span>
        </button>
    );
}
