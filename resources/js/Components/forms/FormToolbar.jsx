import SearchBar from '@/Components/ui/SearchBar';
import DownloadExcelButton from '@/Components/ui/DownloadExcelButton';

/**
 * Search on the left, export (and any extra actions) on the right. Stacks on phones.
 * Pass `excel={{ data, fileName, sheetName }}` to show the Excel download.
 */
export default function FormToolbar({ searchTerm, onSearch, searchPlaceholder, excel, children }) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {onSearch ? <SearchBar value={searchTerm} onChange={onSearch} placeholder={searchPlaceholder} /> : <span />}
            <div className="flex flex-wrap items-center gap-2">
                {children}
                {excel && <DownloadExcelButton {...excel} />}
            </div>
        </div>
    );
}
