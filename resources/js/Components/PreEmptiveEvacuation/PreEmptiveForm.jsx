// resources/js/Components/PreEmptiveEvacuation/PreEmptiveForm.jsx

import { useCallback, useMemo } from "react";
import { Users } from "lucide-react";
import TablePagination from "@/Components/ui/TablePagination";
import useTableFilter from "@/hooks/useTableFilter";
import FormHeader from "@/Components/forms/FormHeader";
import FormToolbar from "@/Components/forms/FormToolbar";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";

const count = (value) => parseInt(value, 10) || 0;
const people = (label) => ({ type: "number", min: 0, step: 1, align: "right", placeholder: "0", className: "w-28", label });
// The server stores the same sums; these only show them while typing.
const totalFamilies = (row) => count(row.families) + count(row.outside_families);
const totalPersons = (row) => count(row.persons) + count(row.outside_persons);

const COLUMNS = [
    { name: "barangay", label: "Barangay" },
    { name: "evacuation_center", label: "Evacuation center" },
    { name: "families", ...people("Families in center") },
    { name: "persons", ...people("Persons in center") },
    { name: "outside_center", label: "Staying outside center (where)" },
    { name: "outside_families", ...people("Families outside") },
    { name: "outside_persons", ...people("Persons outside") },
    { name: "total_families", label: "Total families", type: "computed", compute: totalFamilies, align: "right", className: "w-28" },
    { name: "total_persons", label: "Total persons", type: "computed", compute: totalPersons, align: "right", className: "w-28" },
];

const blankRow = () => ({ barangay: "", evacuation_center: "", families: "", persons: "", outside_center: "", outside_families: "", outside_persons: "" });

export default function PreEmptiveForm({ data, setData, errors, disabled = false }) {
    const reports = data?.reports ?? [];
    const setRows = useCallback((rows) => setData("reports", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.pre-emptive");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: reports,
        setRows,
        blankRow,
        url: route("pre-emptive-reports.store"),
        key: "reports",
        historyKey,
        successMessage: "Pre-emptive evacuation saved.",
        disabled,
    });
    const { paginatedData, searchTerm, setSearchTerm, pagination, showNewRow } = useTableFilter(reports, ["barangay", "evacuation_center"], 5);

    const footer = useMemo(() => {
        const total = (field) => reports.reduce((sum, row) => sum + count(row[field]), 0);
        return {
            barangay: "Total, all barangays",
            families: total("families"),
            persons: total("persons"),
            outside_families: total("outside_families"),
            outside_persons: total("outside_persons"),
            total_families: reports.reduce((sum, row) => sum + totalFamilies(row), 0),
            total_persons: reports.reduce((sum, row) => sum + totalPersons(row), 0),
        };
    }, [reports]);

    return (
        <div className="space-y-5">
            <FormHeader icon={Users} title="Pre-emptive evacuation" description="Families and persons evacuated, inside and outside evacuation centers." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                searchPlaceholder="Search barangay or evacuation center"
                excel={{ data: reports, fileName: "Pre_Emptive_Evacuation_Reports", sheetName: "Pre-Emptive Evacuation" }}
            />

            <ReportTable
                caption="Pre-emptive evacuation per barangay"
                columns={COLUMNS}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={Users}
                emptyText="No evacuations recorded."
                minWidth="md:min-w-[76rem]"
                footer={footer}
            />
            {errors?.reports && <p className="text-sm text-destructive">{errors.reports}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} addLabel="Add barangay" onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save pre-emptive evacuation" />
        </div>
    );
}
