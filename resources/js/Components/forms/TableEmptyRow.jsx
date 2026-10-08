import { Button } from '@/Components/ui/button';

/**
 * The single row a form table shows when it has nothing to list: either the search
 * matched nothing (with a way out), or no rows exist yet (with the next step).
 */
export default function TableEmptyRow({ colSpan, icon: Icon, searchTerm, onClearSearch, emptyText = 'Nothing recorded yet.' }) {
    const searching = Boolean(searchTerm);

    return (
        <tr>
            <td colSpan={colSpan} className="px-4 py-10 text-center">
                {Icon && <Icon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" aria-hidden="true" />}
                <p className="font-medium text-foreground">
                    {searching ? <>No results for “{searchTerm}”</> : emptyText}
                </p>
                {searching ? (
                    <Button type="button" variant="link" onClick={() => onClearSearch('')} className="mt-1 min-h-11 md:min-h-9">
                        Clear search
                    </Button>
                ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Select “Add row” to start.</p>
                )}
            </td>
        </tr>
    );
}
