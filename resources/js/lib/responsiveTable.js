// Phone layout for the editable form tables. Put STACKED_TABLE on a <table>: below
// the md breakpoint the header row is hidden, each row becomes a card and each cell
// a full-width block, so nothing scrolls sideways. From md up the table is unchanged.
// Each cell then shows its column name with a CELL_LABEL element (hidden from md up).
export const STACKED_TABLE = [
    'max-md:block',
    'max-md:[&_thead]:hidden',
    'max-md:[&_tbody]:flex max-md:[&_tbody]:flex-col max-md:[&_tbody]:gap-3',
    'max-md:[&_tfoot]:block',
    'max-md:[&_tr]:block max-md:[&_tr]:rounded-lg max-md:[&_tr]:border max-md:[&_tr]:border-border max-md:[&_tr]:bg-card',
    'max-md:[&_td]:block max-md:[&_td]:w-full max-md:[&_td]:border-r-0',
].join(' ');

// For label/value tables (a label cell beside an input cell): stack them on phones.
export const STACKED_KEY_VALUE = [
    'max-md:block',
    'max-md:[&_tbody]:block',
    'max-md:[&_tr]:block',
    'max-md:[&_td]:block max-md:[&_td]:w-full max-md:[&_td]:border-r-0',
].join(' ');

export const CELL_LABEL = 'mb-1 block text-xs font-semibold text-muted-foreground md:hidden';
