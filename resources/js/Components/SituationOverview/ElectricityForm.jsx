// resources/js/Components/SituationOverview/ElectricityForm.jsx

import { useCallback, useMemo } from "react";
import { usePage } from "@inertiajs/react";
import { Zap } from "lucide-react";
import FormHeader from "@/Components/forms/FormHeader";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor, { isNewRow } from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";
import asOfNow from "@/Components/forms/asOfNow";

const blankRow = () => ({ status: "", barangays_affected: "", remarks: "" });

export default function ElectricityForm({ data, setData, errors, disabled = false }) {
    const { auth } = usePage().props;
    const services = data?.electricityServices ?? [];
    const setRows = useCallback((rows) => setData("electricityServices", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.electricity");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: services,
        setRows,
        blankRow,
        url: route("electricity-reports.store"),
        key: "electricityServices",
        historyKey,
        successMessage: "Electricity report saved.",
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
            { name: "status", label: "Status of electricity services", type: "textarea", placeholder: "e.g. 66 barangays energized in the City of Ilagan" },
            { name: "barangays_affected", label: "Barangays affected", type: "textarea", placeholder: "List affected barangays" },
            { name: "remarks", label: "Remarks", type: "textarea", placeholder: "Starts with today's date and time", prefillOnFocus: asOfNow },
        ],
        [auth.user.id],
    );

    return (
        <div className="space-y-5">
            <FormHeader
                icon={Zap}
                title="Electricity services"
                description="Shared by every office: anyone with access can update any entry. Clear an entry you created and save to remove it."
            />

            <ReportTable
                caption="Electricity services"
                columns={columns}
                rows={services}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                emptyIcon={Zap}
                emptyText="No electricity status recorded."
            />
            {errors?.electricityServices && <p className="text-sm text-destructive">{errors.electricityServices}</p>}

            <FormActions onAdd={addRow} addLabel="Add status entry" onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save electricity" />
        </div>
    );
}
