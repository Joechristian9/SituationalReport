// resources/js/Components/DeploymentOfResponseAssets/PrePositioningForm.jsx

import { useCallback } from "react";
import { Shield } from "lucide-react";
import TablePagination from "@/Components/ui/TablePagination";
import useTableFilter from "@/hooks/useTableFilter";
import FormHeader from "@/Components/forms/FormHeader";
import FormToolbar from "@/Components/forms/FormToolbar";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";

const COLUMNS = [
    { name: "team_units", label: "Team / units" },
    { name: "team_leader", label: "Team leader" },
    { name: "personnel_deployed", label: "Personnel deployed", type: "number", min: 0, step: 1, align: "right", className: "w-36" },
    { name: "response_assets", label: "Response assets" },
    { name: "capability", label: "Capability" },
    { name: "area_of_deployment", label: "Area of deployment" },
];

const blankRow = () => ({ team_units: "", team_leader: "", personnel_deployed: "", response_assets: "", capability: "", area_of_deployment: "" });

export default function PrePositioningForm({ data, setData, errors, disabled = false }) {
    const rows = data?.pre_positionings ?? [];
    const setRows = useCallback((next) => setData("pre_positionings", next), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.pre-positioning");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows,
        setRows,
        blankRow,
        url: route("pre-positioning.store"),
        key: "pre_positionings",
        historyKey,
        successMessage: "Pre-positioning saved.",
        disabled,
    });
    const { paginatedData, searchTerm, setSearchTerm, pagination, showNewRow } = useTableFilter(rows, ["team_units", "area_of_deployment"], 5);

    return (
        <div className="space-y-5">
            <FormHeader icon={Shield} title="Pre-positioning of response assets" description="Teams and response assets deployed, and where." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                searchPlaceholder="Search team or area"
                excel={{ data: rows, fileName: "PrePositioning_Report", sheetName: "Pre-Positioning" }}
            />

            <ReportTable
                caption="Pre-positioning of response assets"
                columns={COLUMNS}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={Shield}
                emptyText="No teams or assets recorded."
                minWidth="md:min-w-[64rem]"
            />
            {errors?.pre_positionings && <p className="text-sm text-destructive">{errors.pre_positionings}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} addLabel="Add team" onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save pre-positioning" />
        </div>
    );
}
