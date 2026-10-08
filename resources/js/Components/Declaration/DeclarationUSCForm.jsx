// resources/js/Components/Declaration/DeclarationUSCForm.jsx

import { useCallback } from "react";
import { FileText } from "lucide-react";
import TablePagination from "@/Components/ui/TablePagination";
import useTableFilter from "@/hooks/useTableFilter";
import FormHeader from "@/Components/forms/FormHeader";
import FormToolbar from "@/Components/forms/FormToolbar";
import FormActions from "@/Components/forms/FormActions";
import ReportTable from "@/Components/forms/ReportTable";
import useRowEditor from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";

const COLUMNS = [
    { name: "declared_by", label: "Declared by", placeholder: "e.g. City of Ilagan" },
    { name: "resolution_number", label: "Resolution number" },
    { name: "date_approved", label: "Date approved", type: "date", className: "w-44" },
];

const blankRow = () => ({ declared_by: "", resolution_number: "", date_approved: "" });

export default function DeclarationUSCForm({ data, setData, errors, disabled = false }) {
    const declarations = data?.usc_declarations ?? [];
    const setRows = useCallback((rows) => setData("usc_declarations", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.usc-declaration");
    const { updateRow, addRow, removeRow, save, saving, hasChanges } = useRowEditor({
        rows: declarations,
        setRows,
        blankRow,
        url: route("declaration-usc.store"),
        key: "usc_declarations",
        responseKey: "declarations",
        historyKey,
        successMessage: "Declarations saved.",
        disabled,
    });
    const { paginatedData, searchTerm, setSearchTerm, pagination, showNewRow } = useTableFilter(declarations, ["declared_by", "resolution_number"], 5);

    return (
        <div className="space-y-5">
            <FormHeader icon={FileText} title="Declarations of a state of calamity" description="Resolutions declaring a state of calamity, and when they were approved." />

            <FormToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                searchPlaceholder="Search declared by or resolution number"
                excel={{ data: declarations, fileName: "USC_Declarations", sheetName: "Declarations" }}
            />

            <ReportTable
                caption="Declarations of a state of calamity"
                columns={COLUMNS}
                rows={paginatedData}
                onChange={updateRow}
                onRemove={removeRow}
                getFieldHistory={getFieldHistory}
                disabled={disabled}
                searchTerm={searchTerm}
                onClearSearch={setSearchTerm}
                emptyIcon={FileText}
                emptyText="No declarations recorded."
                minWidth="md:min-w-[40rem]"
            />
            {errors?.usc_declarations && <p className="text-sm text-destructive">{errors.usc_declarations}</p>}

            <TablePagination {...pagination} />

            <FormActions onAdd={() => { addRow(); showNewRow(); }} addLabel="Add declaration" onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save declarations" />
        </div>
    );
}
