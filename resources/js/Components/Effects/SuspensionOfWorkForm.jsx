// resources/js/Components/Effects/SuspensionOfWorkForm.jsx

import { useCallback } from "react";
import { Briefcase } from "lucide-react";
import TablePagination from "@/Components/ui/TablePagination";
import useTableFilter from "@/hooks/useTableFilter";
import FormHeader from "@/Components/forms/FormHeader";
import FormToolbar from "@/Components/forms/FormToolbar";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";

const COLUMNS = [
    { name: "province_city_municipality", label: "Province / city / municipality" },
    { name: "date_of_suspension", label: "Date of suspension", type: "date", className: "w-44" },
    { name: "remarks", label: "Remarks", type: "textarea" },
];

const blankRow = () => ({ province_city_municipality: "", date_of_suspension: "", remarks: "" });

export default function SuspensionOfWorkForm({ data, setData, errors, disabled = false }) {
    const suspensionList = data?.suspension_of_work ?? [];
    const setRows = useCallback((rows) => setData("suspension_of_work", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.suspension-work");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: suspensionList,
        setRows,
        blankRow,
        url: route("suspension-work-reports.store"),
        key: "suspension_of_work",
        historyKey,
        successMessage: "Work suspensions saved.",
        disabled,
    });
    const { paginatedData, searchTerm, setSearchTerm, pagination, showNewRow } = useTableFilter(suspensionList, ["province_city_municipality"], 5);

    return (
        <div className="space-y-5">
            <FormHeader icon={Briefcase} title="F.2 Suspension of work" description="Work suspensions per municipality." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                searchPlaceholder="Search municipality"
                excel={{ data: suspensionList, fileName: "Suspension_Of_Work", sheetName: "Suspension of Work" }}
            />

            <ReportTable
                caption="Suspension of work"
                columns={COLUMNS}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={Briefcase}
                emptyText="No work suspensions recorded."
                minWidth="md:min-w-[44rem]"
            />
            {errors?.suspension_of_work && <p className="text-sm text-destructive">{errors.suspension_of_work}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save work suspensions" />
        </div>
    );
}
