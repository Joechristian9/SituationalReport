import { useCallback, useState } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { savedMessage } from '@/lib/offline/queue';

let sequence = 0;

// Forms (by save URL) with edits not yet saved. Module-level so the flag survives the
// form unmounting when the user goes back to form selection and opens it again.
const unsavedForms = new Set();

/** Id for a row that exists only in the browser until it is saved. */
export const newRowId = () => `new-${Date.now()}-${++sequence}`;

export const isNewRow = (row) => typeof row?.id === 'string' && row.id.startsWith('new-');

/** Rows ready to post: unsaved rows go up with a null id so the server creates them. */
export const withServerIds = (rows) => rows.map((row) => (isNewRow(row) ? { ...row, id: null } : row));

const hasAnyValue = (row) =>
    Object.entries(row).some(([key, value]) => key !== 'id' && value !== null && value !== undefined && String(value).trim() !== '');

/** The message to show when a save fails: the first validation error if there is one. */
export function saveErrorMessage(error, fallback = 'Could not save. Please try again.') {
    if (error?.offlineReloadRequired) return error.message;
    const errors = error?.response?.data?.errors;
    const first = errors && Object.values(errors)[0];
    return (Array.isArray(first) ? first[0] : first) || error?.response?.data?.message || fallback;
}

/**
 * State and saving for an editable report table.
 *
 * Rows are edited by id, never by position: positions shift under search and
 * pagination, and editing by index once wrote into the wrong record while a search
 * was on. Saving drops untouched new rows, posts unsaved rows with a null id, and
 * keeps the rows on screen when the save was queued offline.
 *
 * @param {object} options
 * @param {Array} options.rows           current rows; each needs a unique id (see newRowId)
 * @param {Function} options.setRows     replaces the rows, e.g. (rows) => setData('roads', rows)
 * @param {Function} options.blankRow    returns the fields of an empty row
 * @param {string} options.url           where to post, e.g. route('road-reports.store')
 * @param {string} options.key           payload key, e.g. 'roads'
 * @param {string} [options.responseKey] key of the fresh rows in the response (defaults to key)
 * @param {Array} [options.historyKey]   react-query key of the change history to refresh
 * @param {string} [options.successMessage]
 * @param {boolean} [options.disabled]   forms closed (no active disaster, or paused)
 * @param {Function} [options.validate]  (rowsToSend) => message to block the save, or null
 * @param {Function} [options.onSaved]   called after a successful save
 */
export default function useRowEditor({ rows, setRows, blankRow, url, key, responseKey = key, historyKey, successMessage = 'Saved.', disabled = false, validate, onSaved }) {
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChangesState] = useState(() => unsavedForms.has(url));

    const setHasChanges = useCallback(
        (value) => {
            if (value) unsavedForms.add(url);
            else unsavedForms.delete(url);
            setHasChangesState(value);
        },
        [url],
    );

    const updateRow = useCallback(
        (id, name, value) => {
            setRows(rows.map((row) => (row.id === id ? { ...row, [name]: value } : row)));
            setHasChanges(true);
        },
        [rows, setRows, setHasChanges],
    );

    const addRow = useCallback(() => {
        setRows([...rows, { ...blankRow(), id: newRowId() }]);
        setHasChanges(true);
    }, [rows, setRows, blankRow, setHasChanges]);

    // Only rows that were never saved: these forms have no server-side delete.
    const removeRow = useCallback((id) => setRows(rows.filter((row) => row.id !== id || !isNewRow(row))), [rows, setRows]);

    const save = useCallback(async () => {
        if (disabled || saving) return;

        const toSend = rows.filter((row) => !isNewRow(row) || hasAnyValue(row));
        if (toSend.length === 0) {
            toast.error('Fill in at least one row before saving.');
            return;
        }
        const problem = validate?.(toSend);
        if (problem) {
            toast.error(problem);
            return;
        }

        setSaving(true);
        try {
            const response = await axios.post(url, { [key]: withServerIds(toSend) }, { headers: { Accept: 'application/json' } });
            const fresh = response.data?.[responseKey];
            // A queued (offline) save or an empty reply keeps what is on screen.
            if (Array.isArray(fresh) && fresh.length > 0) setRows(fresh);
            setHasChanges(false);
            if (historyKey) queryClient.invalidateQueries({ queryKey: historyKey });
            onSaved?.(response);
            toast.success(savedMessage(response, response.data?.message || successMessage));
        } catch (error) {
            toast.error(saveErrorMessage(error));
        } finally {
            setSaving(false);
        }
    }, [disabled, saving, rows, url, key, responseKey, setRows, setHasChanges, historyKey, queryClient, successMessage, validate, onSaved]);

    return { updateRow, addRow, removeRow, save, saving, hasChanges };
}
