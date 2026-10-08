// resources/js/Components/Agriculture/AgricultureForm.jsx

import { useCallback, useMemo } from "react";
import { Sprout } from "lucide-react";
import FormHeader from "@/Components/forms/FormHeader";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";

const amount = (label) => ({ type: "number", min: 0, step: 0.01, align: "right", placeholder: "0.00", className: "w-40", label });

const COLUMNS = [
    { name: "crops_affected", label: "Crops affected", placeholder: "e.g. Rice, corn, HVCC" },
    { name: "standing_crop_ha", ...amount("Standing crop (ha)") },
    { name: "stage_of_crop", label: "Stage of crop", placeholder: "e.g. Vegetative", className: "w-44" },
    { name: "total_area_affected_ha", ...amount("Total area affected (ha)") },
    { name: "total_production_loss", ...amount("Total production loss") },
];

const blankRow = () => ({ crops_affected: "", standing_crop_ha: "", stage_of_crop: "", total_area_affected_ha: "", total_production_loss: "" });

const sum = (rows, field) => rows.reduce((total, row) => total + (parseFloat(row[field]) || 0), 0);
const twoDecimals = (value) => value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AgricultureForm({ data, setData, errors, disabled = false }) {
    const crops = data?.agriculture ?? [];
    const setRows = useCallback((rows) => setData("agriculture", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.agriculture");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: crops,
        setRows,
        blankRow,
        url: route("agriculture-reports.store"),
        key: "crops",
        responseKey: "agriculture",
        historyKey,
        successMessage: "Agriculture report saved.",
        disabled,
    });

    const footer = useMemo(
        () => ({
            crops_affected: "Total",
            standing_crop_ha: twoDecimals(sum(crops, "standing_crop_ha")),
            total_area_affected_ha: twoDecimals(sum(crops, "total_area_affected_ha")),
            total_production_loss: twoDecimals(sum(crops, "total_production_loss")),
        }),
        [crops],
    );

    return (
        <div className="space-y-5">
            <FormHeader
                icon={Sprout}
                title="Agriculture"
                description="One shared list per disaster. Clear a crop and save to remove it; every change is kept in the history."
            />

            <ReportTable
                caption="Crops affected"
                columns={COLUMNS}
                rows={crops}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                emptyIcon={Sprout}
                emptyText="No crops recorded."
                minWidth="md:min-w-[60rem]"
                footer={footer}
            />
            {errors?.agriculture && <p className="text-sm text-destructive">{errors.agriculture}</p>}

            <FormActions onAdd={addRow} addLabel="Add crop" onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save agriculture" />
        </div>
    );
}
