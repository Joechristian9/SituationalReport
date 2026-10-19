/**
 * Search suggestions from rows already on the page: distinct values of the searched fields
 * that contain the typed text, values that start with it first.
 * `fields` = field names, or { get: (row) => value, label } for nested values.
 * Returns [{ value, hint }], where hint names the field the value came from.
 */
export function buildSuggestions(rows, fields, term, limit = 6) {
    const query = term.trim().toLowerCase();
    if (!query) return [];

    const getters = fields.map((field) =>
        typeof field === "string" ? { get: (row) => row[field], label: field.replace(/_/g, " ") } : field
    );
    const seen = new Set();
    const startsWith = [];
    const contains = [];

    for (const row of rows) {
        for (const { get, label } of getters) {
            const value = String(get(row) ?? "").trim();
            const lower = value.toLowerCase();
            // The exact text is already in the box; suggesting it again adds nothing.
            if (!value || lower === query || seen.has(lower) || !lower.includes(query)) continue;
            seen.add(lower);
            (lower.startsWith(query) ? startsWith : contains).push({ value, hint: label });
            if (startsWith.length >= limit) return startsWith;
        }
    }
    return [...startsWith, ...contains].slice(0, limit);
}
