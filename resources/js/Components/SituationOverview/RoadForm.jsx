// resources/js/Components/SituationOverview/RoadForm.jsx

import { useCallback } from "react";
import { Route } from "lucide-react";
import TablePagination from "@/Components/ui/TablePagination";
import useTableFilter from "@/hooks/useTableFilter";
import FormHeader from "@/Components/forms/FormHeader";
import FormToolbar from "@/Components/forms/FormToolbar";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";

const COLUMNS = [
    { name: "road_classification", label: "Road classification", className: "w-44" },
    { name: "name_of_road", label: "Name of road" },
    { name: "status", label: "Status", placeholder: "e.g. Passable", className: "w-40" },
    { name: "areas_affected", label: "Areas / barangays affected", type: "textarea" },
    { name: "re_routing", label: "Re-routing", type: "textarea" },
    { name: "remarks", label: "Remarks", type: "textarea" },
];

const blankRow = () => ({ road_classification: "", name_of_road: "", status: "", areas_affected: "", re_routing: "", remarks: "" });

export default function RoadForm({ data, setData, errors, disabled = false }) {
    const roads = data?.roads ?? [];
    const setRows = useCallback((rows) => setData("roads", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.road");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: roads,
        setRows,
        blankRow,
        url: route("road-reports.store"),
        key: "roads",
        historyKey,
        successMessage: "Road report saved.",
        disabled,
    });
    const { paginatedData, searchTerm, setSearchTerm, pagination, showNewRow } = useTableFilter(roads, ["name_of_road", "areas_affected"], 5);

    return (
        <div className="space-y-5">
            <FormHeader icon={Route} title="Roads" description="One list per disaster. Update it anytime; every change is kept in the history." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                searchPlaceholder="Search road or area"
                excel={{ data: roads, fileName: "Roads_Report", sheetName: "Roads" }}
            />

            <ReportTable
                caption="Roads"
                columns={COLUMNS}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={Route}
                emptyText="No roads recorded."
                minWidth="md:min-w-[64rem]"
            />
            {errors?.roads && <p className="text-sm text-destructive">{errors.roads}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} addLabel="Add road" onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save roads" />
        </div>
    );
}
