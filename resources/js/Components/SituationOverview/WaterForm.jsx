// resources/js/Components/SituationOverview/WaterForm.jsx

import { useCallback, useMemo } from "react";
import { usePage } from "@inertiajs/react";
import { Droplet } from "lucide-react";
import FormHeader from "@/Components/forms/FormHeader";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor, { isNewRow } from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";
import asOfNow from "@/Components/forms/asOfNow";

const blankRow = () => ({ source_of_water: "", barangays_served: "", status: "", remarks: "" });

export default function WaterForm({ data, setData, errors, disabled = false }) {
    const { auth } = usePage().props;
    // Every entry is listed: the form used to show only the first and hide the rest.
    const services = data?.waterServices ?? [];
    const setRows = useCallback((rows) => setData("waterServices", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.water-service");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: services,
        setRows,
        blankRow,
        url: route("water-service-reports.store"),
        key: "waterServices",
        historyKey,
        successMessage: "Water services saved.",
        disabled,
    });

    const columns = useMemo(
        () => [
            {
                name: "created_by",
                label: "Created by",
                type: "computed",
                className: "w-36",
                compute: (row) => {
                    if (isNewRow(row)) return "You (not saved yet)";
                    const name = row.user?.name ?? "Unknown";
                    return row.user_id === auth.user.id ? `${name} (you)` : name;
                },
            },
            { name: "source_of_water", label: "Source of water", placeholder: "e.g. Deep well, spring, water district", className: "w-56" },
            { name: "barangays_served", label: "Barangays served", type: "textarea" },
            { name: "status", label: "Status", type: "textarea", placeholder: "e.g. Fully operational, intermittent supply" },
            { name: "remarks", label: "Remarks", type: "textarea", placeholder: "Starts with today's date and time", prefillOnFocus: asOfNow },
        ],
        [auth.user.id],
    );

    return (
        <div className="space-y-5">
            <FormHeader
                icon={Droplet}
                title="Water services"
                description="Shared with the water district: anyone with access can update any entry. Every change is kept in the history."
            />

            <ReportTable
                caption="Water services"
                columns={columns}
                rows={services}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                emptyIcon={Droplet}
                emptyText="No water services recorded."
                minWidth="md:min-w-[64rem]"
            />
            {errors?.waterServices && <p className="text-sm text-destructive">{errors.waterServices}</p>}

            <FormActions onAdd={addRow} addLabel="Add water source" onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save water services" />
        </div>
    );
}
