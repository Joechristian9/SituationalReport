// resources/js/Components/Effects/InjuredForm.jsx

import { useCallback, useMemo } from "react";
import { UserPlus } from "lucide-react";
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
    { name: "diagnosis", label: "Diagnosis" },
    { name: "date_admitted", label: "Date admitted", type: "date", className: "w-40" },
    { name: "place_of_incident", label: "Place of incident" },
    { name: "remarks", label: "Remarks", type: "textarea" },
];

const BLANK = { name: "", age: "", sex: "", barangay: "", address: "", diagnosis: "", date_admitted: "", place_of_incident: "", remarks: "" };

export default function InjuredForm({ data, setData, errors, disabled = false }) {
    const injuredList = data?.injured ?? [];
    const setRows = useCallback((rows) => setData("injured", rows), [setData]);
    const { barangays, own } = useBarangays();
    const columns = useMemo(() => columnsFor(barangays), [barangays]);
    // New rows start under the reporting barangay; a city office picks one.
    const blankRow = useCallback(() => ({ ...BLANK, barangay: own }), [own]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.injured");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: injuredList,
        setRows,
        blankRow,
        url: route("injured.store"),
        key: "injured",
        historyKey,
        successMessage: "Injured persons saved.",
        disabled,
    });
    const { paginatedData, searchTerm, suggest, setSearchTerm, pagination, showNewRow } = useTableFilter(injuredList, ["name", "barangay", "address"], 5);

    return (
        <div className="space-y-5">
            <FormHeader icon={UserPlus} title="Casualties: injured" description="Record the details of each injured person." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                suggest={suggest}
                searchPlaceholder="Search by name, barangay or address"
                excel={{ data: injuredList, fileName: "Casualties_Injured_Report", sheetName: "Injured" }}
            />

            <ReportTable
                caption="Casualties: injured"
                columns={columns}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={UserPlus}
                emptyText="No injured persons recorded."
                minWidth="md:min-w-[72rem]"
            />
            {errors?.injured && <p className="text-sm text-destructive">{errors.injured}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save injured" />
        </div>
    );
}
