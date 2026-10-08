// resources/js/Components/Effects/IncidentMonitoredForm.jsx

import { useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import TablePagination from "@/Components/ui/TablePagination";
import useTableFilter from "@/hooks/useTableFilter";
import FormHeader from "@/Components/forms/FormHeader";
import FormToolbar from "@/Components/forms/FormToolbar";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";

const COLUMNS = [
    { name: "kinds_of_incident", label: "Kind of incident", placeholder: "e.g. Flooding, landslide", className: "w-48" },
    { name: "date_time", label: "Date & time", type: "datetime-local", className: "w-52" },
    { name: "location", label: "Location", placeholder: "e.g. 33 barangays flooded" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "remarks", label: "Remarks", type: "textarea" },
];

const blankRow = () => ({ kinds_of_incident: "", date_time: "", location: "", description: "", remarks: "" });

export default function IncidentMonitoredForm({ data, setData, errors, disabled = false }) {
    const incidents = data?.incidents ?? [];
    const setRows = useCallback((rows) => setData("incidents", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.incident-monitored");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: incidents,
        setRows,
        blankRow,
        url: route("incident-monitored.store"),
        key: "incidents",
        historyKey,
        successMessage: "Incidents saved.",
        disabled,
    });
    const { paginatedData, searchTerm, setSearchTerm, pagination, showNewRow } = useTableFilter(incidents, ["kinds_of_incident", "location"], 5);

    return (
        <div className="space-y-5">
            <FormHeader icon={AlertTriangle} title="Incidents monitored" description="One list per disaster. Update it anytime; every change is kept in the history." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                searchPlaceholder="Search kind of incident or location"
                excel={{ data: incidents, fileName: "Incidents_Monitored", sheetName: "Incidents" }}
            />

            <ReportTable
                caption="Incidents monitored"
                columns={COLUMNS}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={AlertTriangle}
                emptyText="No incidents recorded."
                minWidth="md:min-w-[64rem]"
            />
            {errors?.incidents && <p className="text-sm text-destructive">{errors.incidents}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} addLabel="Add incident" onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save incidents" />
        </div>
    );
}
