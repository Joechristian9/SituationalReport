// resources/js/Components/Effects/CasualtyForm.jsx

import { useCallback } from "react";
import { UserX } from "lucide-react";
import TablePagination from "@/Components/ui/TablePagination";
import useTableFilter from "@/hooks/useTableFilter";
import FormHeader from "@/Components/forms/FormHeader";
import FormToolbar from "@/Components/forms/FormToolbar";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";

const SEX = ["Male", "Female"];

const COLUMNS = [
    { name: "name", label: "Name", placeholder: "Full name" },
    { name: "age", label: "Age", type: "number", min: 0, step: 1, className: "w-24" },
    { name: "sex", label: "Sex", type: "select", options: SEX, className: "w-32" },
    { name: "address", label: "Address" },
    { name: "cause_of_death", label: "Cause of death" },
    { name: "date_died", label: "Date died", type: "date", className: "w-40" },
    { name: "place_of_incident", label: "Place of incident" },
];

const blankRow = () => ({ name: "", age: "", sex: "", address: "", cause_of_death: "", date_died: "", place_of_incident: "" });

export default function CasualtyForm({ data, setData, errors, disabled = false }) {
    const casualties = data?.casualties ?? [];
    const setRows = useCallback((rows) => setData("casualties", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.casualties");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: casualties,
        setRows,
        blankRow,
        url: route("casualties.store"),
        key: "casualties",
        historyKey,
        successMessage: "Casualties saved.",
        disabled,
    });
    const { paginatedData, searchTerm, setSearchTerm, pagination, showNewRow } = useTableFilter(casualties, ["name", "address"], 5);

    return (
        <div className="space-y-5">
            <FormHeader icon={UserX} title="Casualties: dead" description="Record the details of each person who died." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                searchPlaceholder="Search by name or address"
                excel={{ data: casualties, fileName: "Casualties_Dead_Report", sheetName: "Casualties" }}
            />

            <ReportTable
                caption="Casualties: dead"
                columns={COLUMNS}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={UserX}
                emptyText="No casualties recorded."
                minWidth="md:min-w-[64rem]"
            />
            {errors?.casualties && <p className="text-sm text-destructive">{errors.casualties}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save casualties" />
        </div>
    );
}
