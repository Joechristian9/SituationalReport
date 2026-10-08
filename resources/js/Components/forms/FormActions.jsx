import { Loader2, Save } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import AddRowButton from '@/Components/ui/AddRowButton';

/**
 * Footer of a report form: "Add row" on the left, the one primary Save on the right.
 * The Save label says why it is unavailable (saving, forms closed, nothing changed).
 */
export default function FormActions({
    onAdd,
    addLabel = 'Add row',
    onSave,
    saving = false,
    disabled = false,
    hasChanges = true,
    saveLabel = 'Save report',
    children,
}) {
    const label = saving ? 'Saving…' : disabled ? 'Forms closed' : hasChanges ? saveLabel : 'No changes';

    return (
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
                {onAdd && <AddRowButton onClick={onAdd} disabled={disabled} label={addLabel} />}
                {children}
            </div>
            <Button
                type="button"
                onClick={onSave}
                disabled={saving || disabled || !hasChanges}
                aria-busy={saving}
                className="min-h-11 w-full sm:min-h-9 sm:w-auto"
            >
                {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                )}
                {label}
            </Button>
        </div>
    );
}
