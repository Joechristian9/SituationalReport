// resources/js/Components/SituationOverview/CommunicationForm.jsx

import { useCallback, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { usePage } from "@inertiajs/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Radio, X } from "lucide-react";
import ModificationIndicator from "@/Components/shared/ModificationIndicator";
import { Button } from "@/Components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import FormHeader from "@/Components/forms/FormHeader";
import FormActions from "@/Components/forms/FormActions";
import { Field } from "@/Components/forms/ReportTable";
import { FIELD } from "@/Components/forms/formStyles";
import useRowEditor, { saveErrorMessage } from "@/Components/forms/useRowEditor";
import useFieldHistory from "@/Components/forms/useFieldHistory";
import asOfNow from "@/Components/forms/asOfNow";

// Columns stored on the report itself; any other service is added by CDRRMO and stored as a service value.
const GROUPS = [
    { key: "cellphone", title: "Cellphone (SMS & call)", placeholder: "e.g. Serviceable", fixed: [["globe", "Globe"], ["smart", "Smart"]] },
    { key: "internet", title: "Internet", placeholder: "e.g. Serviceable", fixed: [["pldt_internet", "Polaris"]] },
    { key: "radio", title: "Radio", placeholder: "e.g. Functional", fixed: [["vhf", "VHF"]] },
];
const CATEGORY_LABEL = { cellphone: "Cellphone (SMS & call)", internet: "Internet", radio: "Radio" };

const REMARKS = { name: "remarks", label: "Remarks", type: "textarea", placeholder: "Starts with today's date and time", prefillOnFocus: asOfNow };
const SERVICES_KEY = ["communication-services"];

const blankRow = () => ({ globe: "", smart: "", pldt_landline: "", pldt_internet: "", vhf: "", remarks: "", service_values: [] });

export default function CommunicationForm({ data, setData, errors, disabled = false }) {
    const { auth } = usePage().props;
    const queryClient = useQueryClient();
    const canManageServices =
        auth?.user?.permissions?.some((p) => p.name === "access-communication-form") || auth?.user?.roles?.some((r) => r.name === "admin");

    const reports = data?.communications ?? [];
    const setRows = useCallback((rows) => setData("communications", rows), [setData]);
    const { getFieldHistory, historyKey } = useFieldHistory("modifications.communication");
    const { data: services = {} } = useQuery({
        queryKey: SERVICES_KEY,
        queryFn: async () => (await axios.get(route("communication-services.index"))).data.services ?? {},
        staleTime: 5 * 60 * 1000,
    });
    const { updateRow, save, saving, hasChanges } = useRowEditor({
        rows: reports,
        setRows,
        blankRow,
        url: route("communication-reports.store"),
        key: "communications",
        historyKey,
        successMessage: "Communication report saved.",
        disabled,
    });

    // One communication report per disaster: the form edits the first (and normally only) record.
    const record = reports[0] ?? { id: "new-0", ...blankRow() };
    const extraServices = (group) => {
        const fixedNames = group.fixed.map(([, label]) => label.toUpperCase());
        return (services[group.key] ?? []).filter((service) => !fixedNames.includes(service.name.toUpperCase()));
    };
    const statusOf = (serviceId) => record.service_values?.find((value) => value.service_id === serviceId)?.status ?? "";
    const setStatus = (serviceId, status) => {
        const values = record.service_values ?? [];
        const next = values.some((value) => value.service_id === serviceId)
            ? values.map((value) => (value.service_id === serviceId ? { ...value, status } : value))
            : [...values, { service_id: serviceId, status }];
        updateRow(record.id, "service_values", next);
    };

    const [adding, setAdding] = useState(null); // { name, category } while the add dialog is open
    const [removing, setRemoving] = useState(null); // the service being confirmed for removal
    const [busy, setBusy] = useState(false);

    const refreshServices = () => queryClient.invalidateQueries({ queryKey: SERVICES_KEY });

    const addService = async (event) => {
        event.preventDefault();
        if (!adding.name.trim()) {
            toast.error("Enter a service name.");
            return;
        }
        setBusy(true);
        try {
            await axios.post(route("communication-services.store"), adding);
            await refreshServices();
            toast.success(`${adding.name.trim().toUpperCase()} added.`);
            setAdding(null);
        } catch (error) {
            toast.error(saveErrorMessage(error, "Could not add the service."));
        } finally {
            setBusy(false);
        }
    };

    const removeService = async () => {
        setBusy(true);
        try {
            await axios.delete(route("communication-services.destroy", removing.id));
            await refreshServices();
            toast.success(`${removing.name} removed.`);
            setRemoving(null);
        } catch (error) {
            toast.error(saveErrorMessage(error, "Could not remove the service."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-6">
            <FormHeader icon={Radio} title="Communication services" description="One report per disaster. Update it as service changes; every change is kept in the history." />

            {GROUPS.map((group) => {
                const headingId = `comm-${group.key}`;
                return (
                    <section key={group.key} aria-labelledby={headingId} className="space-y-3">
                        <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                            <h3 id={headingId} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                {group.title}
                            </h3>
                            {canManageServices && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setAdding({ name: "", category: group.key })}
                                    disabled={disabled}
                                    className="min-h-11 text-primary md:min-h-8"
                                >
                                    <Plus className="h-4 w-4" aria-hidden="true" />
                                    Add service
                                </Button>
                            )}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {group.fixed.map(([name, label]) => {
                                const id = `comm-${name}`;
                                return (
                                    <div key={name} className="min-w-0">
                                        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
                                            {label}
                                        </label>
                                        <Field
                                            id={id}
                                            column={{ name, label, placeholder: group.placeholder }}
                                            value={record[name]}
                                            disabled={disabled}
                                            onChange={(value) => updateRow(record.id, name, value)}
                                        />
                                        <ModificationIndicator recordId={record.id} fieldName={name} getFieldHistory={getFieldHistory} currentValue={record[name]} />
                                    </div>
                                );
                            })}
                            {extraServices(group).map((service) => {
                                const id = `comm-service-${service.id}`;
                                return (
                                    <div key={service.id} className="min-w-0">
                                        <div className="mb-1.5 flex items-center justify-between gap-2">
                                            <label htmlFor={id} className="truncate text-sm font-medium text-foreground">
                                                {service.name}
                                            </label>
                                            {canManageServices && (
                                                <button
                                                    type="button"
                                                    onClick={() => setRemoving(service)}
                                                    disabled={disabled}
                                                    aria-label={`Remove ${service.name}`}
                                                    title={`Remove ${service.name}`}
                                                    className="-my-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                                                >
                                                    <X className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            id={id}
                                            type="text"
                                            value={statusOf(service.id)}
                                            onChange={(e) => setStatus(service.id, e.target.value)}
                                            disabled={disabled}
                                            placeholder={group.placeholder}
                                            className={FIELD}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}

            <div>
                <label htmlFor="comm-remarks" className="mb-1.5 block text-sm font-medium text-foreground">
                    Remarks
                </label>
                <Field id="comm-remarks" column={REMARKS} value={record.remarks} disabled={disabled} onChange={(value) => updateRow(record.id, "remarks", value)} />
                <ModificationIndicator recordId={record.id} fieldName="remarks" getFieldHistory={getFieldHistory} currentValue={record.remarks} />
            </div>
            {errors?.communications && <p className="text-sm text-destructive">{errors.communications}</p>}

            <FormActions onSave={save} saving={saving} disabled={disabled} hasChanges={hasChanges} saveLabel="Save communication report" />

            <Dialog open={Boolean(adding)} onOpenChange={(open) => !open && !busy && setAdding(null)}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={addService} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">Add a service</DialogTitle>
                            <DialogDescription>It becomes a new field for every disaster report.</DialogDescription>
                        </DialogHeader>
                        <div>
                            <label htmlFor="new-service-name" className="mb-1.5 block text-sm font-medium text-foreground">
                                Service name
                            </label>
                            <input
                                id="new-service-name"
                                value={adding?.name ?? ""}
                                onChange={(e) => setAdding((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. TM, DITO, Sky Cable"
                                autoFocus
                                className={FIELD}
                            />
                        </div>
                        <div>
                            <label htmlFor="new-service-category" className="mb-1.5 block text-sm font-medium text-foreground">
                                Category
                            </label>
                            <select
                                id="new-service-category"
                                value={adding?.category ?? "cellphone"}
                                onChange={(e) => setAdding((prev) => ({ ...prev, category: e.target.value }))}
                                className={FIELD}
                            >
                                {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setAdding(null)} disabled={busy} className="min-h-11 sm:min-h-9">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={busy} className="min-h-11 sm:min-h-9">
                                {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                                Add service
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(removing)} onOpenChange={(open) => !open && !busy && setRemoving(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Remove {removing?.name}?</DialogTitle>
                        <DialogDescription>
                            The field disappears from the form. Statuses already recorded for it are kept in past reports.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setRemoving(null)} disabled={busy} className="min-h-11 sm:min-h-9">
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={removeService} disabled={busy} className="min-h-11 sm:min-h-9">
                            {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
