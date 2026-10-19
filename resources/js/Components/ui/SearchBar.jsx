// resources/js/Components/ui/SearchBar.jsx
import React from "react";
import { Search } from "lucide-react";
import SearchSuggestions from "./SearchSuggestions";

/**
 * Search box with suggestions. `onChange` runs when a suggestion is picked or on Enter, not
 * on every keystroke. `suggest(text)` returns [{ value, hint }] (see lib/searchSuggestions).
 */
export default function SearchBar({
    value,
    onChange,
    placeholder = "Search...",
    suggest,
}) {
    return (
        <SearchSuggestions value={value} onChange={onChange} suggest={suggest}>
            {(inputProps) => (
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <input
                        type="search"
                        aria-label={placeholder}
                        placeholder={placeholder}
                        {...inputProps}
                        className="min-h-11 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-base text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-9 md:text-sm"
                    />
                </div>
            )}
        </SearchSuggestions>
    );
}
