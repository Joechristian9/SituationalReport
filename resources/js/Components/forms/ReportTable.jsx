import { memo, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import ModificationIndicator from '@/Components/shared/ModificationIndicator';
import { Button } from '@/Components/ui/button';
import { CELL_LABEL, STACKED_TABLE } from '@/lib/responsiveTable';
import { cn } from '@/lib/utils';
import TableEmptyRow from './TableEmptyRow';
import { isNewRow } from './useRowEditor';
import { FIELD, ROW, TABLE_WRAP, TD, TEXTAREA, TH, THEAD } from './formStyles';

/**
 * Editable report table driven by a column list. Below md each row becomes a card
 * with labelled fields; from md up it is a normal table.
 *
 * Column: { name, label, type?: 'text'|'number'|'date'|'datetime-local'|'textarea'|'select'|'computed',
 *           options?: string[], compute?: (row) => value (for 'computed', read-only),
 *           align?: 'right' (numbers), placeholder?, className? (th width), min?, max?, step?,
 *           prefillOnFocus?: () => string (fills an empty field when it is first focused) }
 *
 * `footer` (optional): values keyed by column name for a totals row, e.g.
 * { barangay: 'Total', partially: 12 }.
 * `onRemove` (optional): shows a remove button on rows not saved yet. Saved rows
 * cannot be deleted from these forms, so they never get one.
 */
export default function ReportTable({
    columns,
    rows,
    onChange,
    onRemove,
    getFieldHistory,
    disabled = false,
    searchTerm,
    onClearSearch,
    emptyIcon,
    emptyText,
    minWidth = 'md:min-w-[56rem]',
    caption,
    footer,
}) {
    // Stable handlers, so memoized rows skip re-rendering when another row changes.
    const handlers = useRef({ onChange, onRemove });
    handlers.current = { onChange, onRemove };
    const handleChange = useCallback((id, name, value) => handlers.current.onChange(id, name, value), []);
    const handleRemove = useCallback((id) => handlers.current.onRemove(id), []);
    const colSpan = columns.length + (onRemove ? 1 : 0);

    return (
        <div className={TABLE_WRAP}>
            <table className={cn('w-full border-collapse text-sm', STACKED_TABLE, minWidth)}>
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead className={THEAD}>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.name} scope="col" className={cn(TH, column.align === 'right' && 'text-right', column.className)}>
                                {column.label}
                            </th>
                        ))}
                        {onRemove && (
                            <th scope="col" className={cn(TH, 'w-14')}>
                                <span className="sr-only">Remove</span>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <TableEmptyRow colSpan={colSpan} icon={emptyIcon} searchTerm={searchTerm} onClearSearch={onClearSearch} emptyText={emptyText} />
                    ) : (
                        rows.map((row) => (
                            <ReportRow
                                key={row.id}
                                row={row}
                                columns={columns}
                                onChange={handleChange}
                                onRemove={onRemove ? handleRemove : undefined}
                                getFieldHistory={getFieldHistory}
                                disabled={disabled}
                            />
                        ))
                    )}
                </tbody>
                {footer && (
                    <tfoot className="bg-muted/60 font-semibold text-foreground">
                        <tr className="md:border-t md:border-border">
                            {columns.map((column, index) => (
                                <td key={column.name} className={cn(TD, 'tabular-nums', column.align === 'right' && 'md:text-right')}>
                                    {index > 0 && <span className={CELL_LABEL}>{column.label}</span>}
                                    {footer[column.name] ?? ''}
                                </td>
                            ))}
                            {onRemove && <td className="max-md:hidden" />}
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}

const ReportRow = memo(function ReportRow({ row, columns, onChange, onRemove, getFieldHistory, disabled }) {
    return (
        <tr className={ROW}>
            {columns.map((column) => {
                if (column.type === 'computed') {
                    return (
                        <td key={column.name} className={cn(TD, 'bg-muted/30 font-semibold tabular-nums text-foreground', column.align === 'right' && 'md:text-right')}>
                            <span className={CELL_LABEL}>{column.label}</span>
                            <output aria-label={column.label}>{column.compute(row)}</output>
                        </td>
                    );
                }

                const id = `${column.name}-${row.id}`;
                return (
                    <td key={column.name} className={TD}>
                        <label htmlFor={id} className={CELL_LABEL}>
                            {column.label}
                        </label>
                        <Field id={id} column={column} value={row[column.name]} disabled={disabled} onChange={(value) => onChange(row.id, column.name, value)} />
                        {getFieldHistory && (
                            <ModificationIndicator recordId={row.id} fieldName={column.name} getFieldHistory={getFieldHistory} currentValue={row[column.name]} />
                        )}
                    </td>
                );
            })}
            {onRemove && (
                <td className={cn(TD, 'max-md:pt-0 max-md:text-right md:text-center')}>
                    {isNewRow(row) && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemove(row.id)}
                            disabled={disabled}
                            aria-label="Remove this unsaved row"
                            title="Remove this unsaved row"
                            className="h-11 w-11 text-muted-foreground hover:text-destructive md:h-9 md:w-9"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    )}
                </td>
            )}
        </tr>
    );
});

export function Field({ id, column, value, disabled, onChange }) {
    const common = {
        id,
        name: column.name,
        value: value ?? '',
        disabled,
        // On md+ the column header is the visible label; the cell label is hidden there.
        'aria-label': column.label,
        onChange: (e) => onChange(e.target.value),
        // e.g. remarks that start with "As of <now>: " the first time they are focused.
        onFocus: column.prefillOnFocus && !value ? () => onChange(column.prefillOnFocus()) : undefined,
    };

    if (column.type === 'select') {
        // Stored values may differ in case ("male"); match them to an option so they still show.
        const stored = String(value ?? '');
        const selected = column.options.find((option) => option.toLowerCase() === stored.toLowerCase()) ?? stored;
        return (
            <select {...common} value={selected} className={FIELD}>
                <option value="">{column.placeholder ?? 'Select…'}</option>
                {column.options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        );
    }

    if (column.type === 'textarea') {
        return <textarea {...common} rows={2} placeholder={column.placeholder} className={TEXTAREA} />;
    }

    // The database returns "YYYY-MM-DD HH:mm:ss", which datetime-local cannot show.
    if (column.type === 'datetime-local' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(common.value)) {
        common.value = common.value.slice(0, 16).replace(' ', 'T');
    }

    return (
        <input
            {...common}
            type={column.type ?? 'text'}
            inputMode={column.type === 'number' ? (column.step === 1 ? 'numeric' : 'decimal') : undefined}
            min={column.min}
            max={column.max}
            step={column.step}
            placeholder={column.placeholder}
            className={cn(FIELD, column.align === 'right' && 'tabular-nums md:text-right')}
        />
    );
}
