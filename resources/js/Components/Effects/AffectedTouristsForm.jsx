// resources/js/Components/Effects/AffectedTouristsForm.jsx

import { useCallback } from "react";
import { Plane } from "lucide-react";
import TablePagination from "@/Components/ui/TablePagination";
import useTableFilter from "@/hooks/useTableFilter";
import FormHeader from "@/Components/forms/FormHeader";
import FormToolbar from "@/Components/forms/FormToolbar";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";

const COLUMNS = [
    { name: "province_city_municipality", label: "Province / city / municipality" },
    { name: "location", label: "Location" },
    { name: "local_tourists", label: "Local tourists", type: "number", min: 0, step: 1, align: "right", className: "w-36" },
    { name: "foreign_tourists", label: "Foreign tourists", type: "number", min: 0, step: 1, align: "right", className: "w-36" },
    { name: "remarks", label: "Remarks", type: "textarea" },
];

const blankRow = () => ({ province_city_municipality: "", location: "", local_tourists: "", foreign_tourists: "", remarks: "" });

export default function AffectedTouristsForm({ data, setData, errors, disabled = false }) {
    const touristsList = data?.affected_tourists ?? [];
    const setRows = useCallback((rows) => setData("affected_tourists", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.affected-tourists");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: touristsList,
        setRows,
        blankRow,
        url: route("affected-tourists-reports.store"),
        key: "affected_tourists",
        historyKey,
        successMessage: "Affected tourists saved.",
        disabled,
    });
    const { paginatedData, searchTerm, setSearchTerm, pagination, showNewRow } = useTableFilter(touristsList, ["province_city_municipality", "location"], 5);

    return (
        <div className="space-y-5">
            <FormHeader icon={Plane} title="Affected tourists" description="Local and foreign tourists affected, by location." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                searchPlaceholder="Search location or municipality"
                excel={{ data: touristsList, fileName: "Affected_Tourists", sheetName: "Affected Tourists" }}
            />

            <ReportTable
                caption="Affected tourists"
                columns={COLUMNS}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={Plane}
                emptyText="No affected tourists recorded."
            />
            {errors?.affected_tourists && <p className="text-sm text-destructive">{errors.affected_tourists}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save affected tourists" />
        </div>
    );
}
