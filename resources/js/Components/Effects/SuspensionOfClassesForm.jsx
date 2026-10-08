// resources/js/Components/Effects/SuspensionOfClassesForm.jsx

import { useCallback } from "react";
import { School } from "lucide-react";
import TablePagination from "@/Components/ui/TablePagination";
import useTableFilter from "@/hooks/useTableFilter";
import FormHeader from "@/Components/forms/FormHeader";
import FormToolbar from "@/Components/forms/FormToolbar";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";

const LEVELS = [
    "Pre-school",
    "Elementary",
    "Junior High School",
    "Senior High School",
    "All Levels (K-12)",
    "College",
    "All Levels (including College)",
];

const COLUMNS = [
    { name: "province_city_municipality", label: "Province / city / municipality" },
    { name: "level", label: "Level", type: "select", options: LEVELS, placeholder: "Select level…", className: "w-56" },
    { name: "date_of_suspension", label: "Date of suspension", type: "date", className: "w-44" },
    { name: "remarks", label: "Remarks", type: "textarea" },
];

const blankRow = () => ({ province_city_municipality: "", level: "", date_of_suspension: "", remarks: "" });

export default function SuspensionOfClassesForm({ data, setData, errors, disabled = false }) {
    const suspensionList = data?.suspension_of_classes ?? [];
    const setRows = useCallback((rows) => setData("suspension_of_classes", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.suspension-classes");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: suspensionList,
        setRows,
        blankRow,
        url: route("suspension-classes-reports.store"),
        key: "suspension_of_classes",
        historyKey,
        successMessage: "Class suspensions saved.",
        disabled,
    });
    const { paginatedData, searchTerm, setSearchTerm, pagination, showNewRow } = useTableFilter(suspensionList, ["province_city_municipality", "level"], 5);

    return (
        <div className="space-y-5">
            <FormHeader icon={School} title="F.1 Suspension of classes" description="Class suspensions per municipality and level." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                searchPlaceholder="Search municipality or level"
                excel={{ data: suspensionList, fileName: "Suspension_Of_Classes", sheetName: "Suspension of Classes" }}
            />

            <ReportTable
                caption="Suspension of classes"
                columns={COLUMNS}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={School}
                emptyText="No class suspensions recorded."
            />
            {errors?.suspension_of_classes && <p className="text-sm text-destructive">{errors.suspension_of_classes}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save class suspensions" />
        </div>
    );
}
