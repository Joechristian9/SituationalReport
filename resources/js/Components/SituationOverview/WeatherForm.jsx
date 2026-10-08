// resources/js/Components/SituationOverview/WeatherForm.jsx

import { useCallback } from "react";
import { Cloud } from "lucide-react";
import FormHeader from "@/Components/forms/FormHeader";
import FormActions from "@/Components/forms/FormActions";
import RecordFields from "@/Components/forms/RecordFields";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";

const FIELDS = [
    { name: "municipality", label: "Location", placeholder: "City of Ilagan", wide: true },
    { name: "sky_condition", label: "Sky condition", placeholder: "e.g. Cloudy, partly cloudy, clear skies" },
    { name: "wind", label: "Wind", placeholder: "e.g. Light winds, moderate winds" },
    { name: "precipitation", label: "Precipitation", placeholder: "e.g. No rain in the last 12 hours" },
    { name: "sea_condition", label: "Sea condition", placeholder: "e.g. N/A, calm, moderate waves" },
];

const blankRow = () => ({ municipality: "City of Ilagan", sky_condition: "", wind: "", precipitation: "", sea_condition: "" });

const validate = (rows) => (rows.some((row) => !String(row.municipality ?? "").trim()) ? "Enter the location." : null);

export default function WeatherForm({ data, setData, errors, disabled = false }) {
    const reports = data?.reports ?? [];
    const setRows = useCallback((rows) => setData("reports", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.weather");
    const { updateRow, save, saving, hasChanges } = useRowEditor({
        rows: reports,
        setRows,
        blankRow,
        url: route("weather-reports.store"),
        key: "reports",
        historyKey,
        successMessage: "Weather report saved.",
        disabled,
        validate,
    });
    // One weather report per disaster: the form edits the first (and normally only) record.
    const record = reports[0] ?? { id: "new-0", ...blankRow() };

    return (
        <div className="space-y-5">
            <FormHeader icon={Cloud} title="Weather conditions" description="One report per disaster. Update it as conditions change; every change is kept in the history." />

            <RecordFields fields={FIELDS} record={record} onChange={updateRow} getFieldHistory={getFieldHistory} disabled={disabled} />
            {errors?.reports && <p className="text-sm text-destructive">{errors.reports}</p>}

            <FormActions onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save weather report" />
        </div>
    );
}
