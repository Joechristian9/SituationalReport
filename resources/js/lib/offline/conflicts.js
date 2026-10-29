// Rows changed on two devices of one account. The server turns such a save down (409) with the
// ids and times of the rows changed elsewhere (see RejectStaleEdits.php); the person then picks,
// per row, which version to keep in EditConflictDialog, and the save is sent again.

const listeners = new Set();
let question = null;

/** Opens the dialog. Resolves with { [rowId]: 'mine' | 'theirs' }, or null when cancelled. */
export function askAboutConflicts({ label, rows, conflicts }) {
    question?.resolve(null);
    return new Promise((resolve) => {
        question = { label, rows, conflicts, resolve };
        listeners.forEach((listener) => listener(question));
    });
}

export function answerConflicts(choices) {
    const asked = question;
    question = null;
    listeners.forEach((listener) => listener(null));
    asked?.resolve(choices);
}

export function subscribeConflicts(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * The rows to send again. "mine" takes the time of the other change, so the server now saves
 * over it; "theirs" drops this device's edit, so the server keeps (and sends back) its version.
 */
export function applyChoices(rows, conflicts, choices) {
    const byId = new Map(conflicts.map((conflict) => [String(conflict.id), conflict]));
    return rows.map((row) => {
        const conflict = byId.get(String(row.id));
        if (!conflict) return row;
        return choices[conflict.id] === 'mine' ? { ...row, updated_at: conflict.changedAt } : { ...row, _changed: false };
    });
}

const HIDDEN = new Set(['id', 'updated_at', 'created_at', '_changed', 'user_id', 'updated_by', 'disaster_id', 'user']);

/** A few of the row's own values, to recognise it by: "Rugao · Rugao Gym · 12". */
export function rowSummary(row) {
    const values = Object.entries(row ?? {})
        .filter(([key, value]) => !HIDDEN.has(key) && (typeof value === 'string' || typeof value === 'number') && String(value).trim() !== '')
        .map(([, value]) => String(value).trim());
    return values.slice(0, 3).join(' · ') || 'A row';
}
