// resources/js/Components/Effects/MissingForm.jsx

import { useCallback, useMemo } from "react";
import { UserSearch } from "lucide-react";
import TablePagination from "@/Components/ui/TablePagination";
import useTableFilter from "@/hooks/useTableFilter";
import FormHeader from "@/Components/forms/FormHeader";
import FormToolbar from "@/Components/forms/FormToolbar";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";
import useBarangays from "@/hooks/useBarangays";

const columnsFor = (barangays) => [
    { name: "name", label: "Name", placeholder: "Full name" },
    { name: "age", label: "Age", type: "number", min: 0, step: 1, className: "w-24" },
    { name: "sex", label: "Sex", type: "select", options: ["Male", "Female"], className: "w-32" },
    { name: "barangay", label: "Barangay", type: "select", options: barangays, placeholder: "Select barangay…", className: "w-48" },
    { name: "address", label: "Address (purok / street)" },
    { name: "cause", label: "Cause" },
    { name: "remarks", label: "Remarks", type: "textarea" },
];

const BLANK = { name: "", age: "", sex: "", barangay: "", address: "", cause: "", remarks: "" };

export default function MissingForm({ data, setData, errors, disabled = false }) {
    const missingList = data?.missing ?? [];
    const setRows = useCallback((rows) => setData("missing", rows), [setData]);
    const { barangays, own } = useBarangays();
    const columns = useMemo(() => columnsFor(barangays), [barangays]);
    // New rows start under the reporting barangay; a city office picks one.
    const blankRow = useCallback(() => ({ ...BLANK, barangay: own }), [own]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.missing");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: missingList,
        setRows,
        blankRow,
        url: route("missing.store"),
        key: "missing",
        historyKey,
        successMessage: "Missing persons saved.",
        disabled,
    });
    const { paginatedData, searchTerm, suggest, setSearchTerm, pagination, showNewRow } = useTableFilter(missingList, ["name", "barangay", "address"], 5);

    return (
        <div className="space-y-5">
            <FormHeader icon={UserSearch} title="Casualties: missing" description="Record the details of each missing person." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                suggest={suggest}
                searchPlaceholder="Search by name, barangay or address"
                excel={{ data: missingList, fileName: "Casualties_Missing_Report", sheetName: "Missing" }}
            />

            <ReportTable
                caption="Casualties: missing"
                columns={columns}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={UserSearch}
                emptyText="No missing persons recorded."
            />
            {errors?.missing && <p className="text-sm text-destructive">{errors.missing}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save missing" />
        </div>
    );
}
