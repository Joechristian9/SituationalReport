// resources/js/Components/SituationOverview/WaterLevelForm.jsx
// Not in the form menu at the moment (commented out in SituationReports/Index.jsx).

import { useCallback } from "react";
import { Droplets } from "lucide-react";
import TablePagination from "@/Components/ui/TablePagination";
import useTableFilter from "@/hooks/useTableFilter";
import FormHeader from "@/Components/forms/FormHeader";
import FormToolbar from "@/Components/forms/FormToolbar";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";

const level = (label) => ({ type: "number", step: 0.01, align: "right", className: "w-36", label });

const COLUMNS = [
    { name: "gauging_station", label: "Gauging station" },
    { name: "current_level", ...level("Current level (m)") },
    { name: "alarm_level", ...level("Alarm level (m)") },
    { name: "critical_level", ...level("Critical level (m)") },
    { name: "affected_areas", label: "Affected areas", type: "textarea" },
];

const blankRow = () => ({ gauging_station: "", current_level: "", alarm_level: "", critical_level: "", affected_areas: "" });

// The server requires a station on every row; say which row instead of a raw validation key.
const validate = (rows) => {
    const index = rows.findIndex((row) => !String(row.gauging_station ?? "").trim());
    return index === -1 ? null : `Row ${index + 1}: enter the gauging station.`;
};

export default function WaterLevelForm({ data, setData, errors, disabled = false }) {
    const levels = data?.waterLevels ?? [];
    const setRows = useCallback((rows) => setData("waterLevels", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.water-level");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: levels,
        setRows,
        blankRow,
        url: route("water-level-reports.store"),
        key: "reports",
        historyKey,
        successMessage: "Water levels saved.",
        disabled,
        validate,
    });
    const { paginatedData, searchTerm, setSearchTerm, pagination, showNewRow } = useTableFilter(levels, ["gauging_station"], 5);

    return (
        <div className="space-y-5">
            <FormHeader icon={Droplets} title="Water levels" description="River and stream levels per gauging station, in metres." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                searchPlaceholder="Search gauging station"
                excel={{ data: levels, fileName: "Water_Level_Reports", sheetName: "Water Levels" }}
            />

            <ReportTable
                caption="Water levels"
                columns={COLUMNS}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={Droplets}
                emptyText="No water levels recorded."
            />
            {errors?.waterLevels && <p className="text-sm text-destructive">{errors.waterLevels}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} addLabel="Add station" onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save water levels" />
        </div>
    );
}
