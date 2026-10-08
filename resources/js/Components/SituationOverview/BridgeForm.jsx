// resources/js/Components/SituationOverview/BridgeForm.jsx

import { useCallback } from "react";
import { Landmark } from "lucide-react";
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
    { name: "name_of_bridge", label: "Name of bridge" },
    { name: "status", label: "Status", placeholder: "e.g. Not passable", className: "w-40" },
    { name: "areas_affected", label: "Areas / barangays affected", type: "textarea" },
    { name: "re_routing", label: "Re-routing", type: "textarea" },
    { name: "remarks", label: "Remarks", type: "textarea" },
];

const blankRow = () => ({ road_classification: "", name_of_bridge: "", status: "", areas_affected: "", re_routing: "", remarks: "" });

export default function BridgeForm({ data, setData, errors, disabled = false }) {
    const bridges = data?.bridges ?? [];
    const setRows = useCallback((rows) => setData("bridges", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.bridge");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: bridges,
        setRows,
        blankRow,
        url: route("bridge-reports.store"),
        key: "bridges",
        historyKey,
        successMessage: "Bridge report saved.",
        disabled,
    });
    const { paginatedData, searchTerm, setSearchTerm, pagination, showNewRow } = useTableFilter(bridges, ["name_of_bridge", "areas_affected"], 5);

    return (
        <div className="space-y-5">
            <FormHeader icon={Landmark} title="Bridges and overflow bridges" description="One list per disaster. Update it anytime; every change is kept in the history." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                searchPlaceholder="Search bridge or area"
                excel={{ data: bridges, fileName: "Bridges_Report", sheetName: "Bridges" }}
            />

            <ReportTable
                caption="Bridges and overflow bridges"
                columns={COLUMNS}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={Landmark}
                emptyText="No bridges recorded."
                minWidth="md:min-w-[64rem]"
            />
            {errors?.bridges && <p className="text-sm text-destructive">{errors.bridges}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} addLabel="Add bridge" onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save bridges" />
        </div>
    );
}
