// Shared classes for the editable report tables. Semantic tokens only (design-system
// MASTER §3), so every form looks the same and follows light/dark mode.
// Use with STACKED_TABLE / CELL_LABEL from lib/responsiveTable on phones.

// The table's only frame: the form already sits inside the page card.
export const TABLE_WRAP = 'md:overflow-x-auto md:rounded-lg md:border md:border-border';
export const THEAD = 'bg-muted/60';
export const TH = 'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground';
export const ROW = 'md:border-t md:border-border md:hover:bg-muted/30';
export const TD = 'p-3 align-top';

// Inputs, selects and textareas: 44px tall and 16px text on phones (no iOS zoom).
export const FIELD =
    'w-full min-h-11 rounded-md border border-input bg-background px-3 py-2 text-base text-foreground shadow-sm ' +
    'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
    'disabled:cursor-not-allowed disabled:opacity-60 md:min-h-9 md:text-sm';
export const TEXTAREA = `${FIELD} resize-y`;
