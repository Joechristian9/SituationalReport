// resources/js/Components/Effects/DamagedHousesForm.jsx

import { useCallback, useMemo } from "react";
import { Home } from "lucide-react";
import TablePagination from "@/Components/ui/TablePagination";
import useTableFilter from "@/hooks/useTableFilter";
import FormHeader from "@/Components/forms/FormHeader";
import FormToolbar from "@/Components/forms/FormToolbar";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";

const count = (value) => parseInt(value, 10) || 0;
// The server stores the same sum; this only shows it while typing.
const rowTotal = (row) => count(row.partially) + count(row.totally);

const COLUMNS = [
    { name: "barangay", label: "Barangay" },
    { name: "partially", label: "Partially damaged", type: "number", min: 0, step: 1, align: "right", className: "w-40" },
    { name: "totally", label: "Totally damaged", type: "number", min: 0, step: 1, align: "right", className: "w-40" },
    { name: "total", label: "Total", type: "computed", compute: rowTotal, align: "right", className: "w-28" },
];

const blankRow = () => ({ barangay: "", partially: "", totally: "" });

export default function DamagedHousesForm({ data, setData, errors, disabled = false }) {
    const reports = data?.damaged_houses ?? [];
    const setRows = useCallback((rows) => setData("damaged_houses", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.damaged-houses");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: reports,
        setRows,
        blankRow,
        url: route("damaged-houses-reports.store"),
        key: "damaged_houses",
        historyKey,
        successMessage: "Damaged houses saved.",
        disabled,
    });
    const { paginatedData, searchTerm, setSearchTerm, pagination, showNewRow } = useTableFilter(reports, ["barangay"], 5);

    const footer = useMemo(() => {
        const partially = reports.reduce((sum, row) => sum + count(row.partially), 0);
        const totally = reports.reduce((sum, row) => sum + count(row.totally), 0);
        return { barangay: "Total, all barangays", partially, totally, total: partially + totally };
    }, [reports]);

    return (
        <div className="space-y-5">
            <FormHeader icon={Home} title="Damaged houses" description="Partially and totally damaged houses per barangay." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                searchPlaceholder="Search barangay"
                excel={{ data: reports, fileName: "Damaged_Houses", sheetName: "Damaged Houses" }}
            />

            <ReportTable
                caption="Damaged houses per barangay"
                columns={COLUMNS}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={Home}
                emptyText="No damaged houses recorded."
                minWidth="md:min-w-[40rem]"
                footer={footer}
            />
            {errors?.damaged_houses && <p className="text-sm text-destructive">{errors.damaged_houses}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} addLabel="Add barangay" onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save damaged houses" />
        </div>
    );
}
