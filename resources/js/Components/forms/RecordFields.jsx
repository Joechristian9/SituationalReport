import ModificationIndicator from '@/Components/shared/ModificationIndicator';
import { cn } from '@/lib/utils';
import { Field } from './ReportTable';

/**
 * Labelled fields for a single record (e.g. the weather report), using the same
 * column config and inputs as ReportTable. One column on phones, two from md.
 * A field with `wide: true` spans both columns.
 */
export default function RecordFields({ fields, record, onChange, getFieldHistory, disabled = false }) {
    return (
        <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
            {fields.map((field) => {
                const id = `${field.name}-${record.id}`;
                return (
                    <div key={field.name} className={cn('min-w-0', field.wide && 'md:col-span-2')}>
                        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
                            {field.label}
                        </label>
                        <Field id={id} column={field} value={record[field.name]} disabled={disabled} onChange={(value) => onChange(record.id, field.name, value)} />
                        {getFieldHistory && (
                            <ModificationIndicator recordId={record.id} fieldName={field.name} getFieldHistory={getFieldHistory} currentValue={record[field.name]} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
