// resources/js/Components/ui/SearchBar.jsx
import React, { useId } from "react";
import { SearchInput } from "@/Components/data/DataView";

/**
 * The same search box as the admin list toolbars (DataView's SearchInput, with a clear button),
 * at toolbar width. `onChange` runs when a suggestion is picked or on Enter, not on every
 * keystroke. `suggest(text)` returns [{ value, hint }] (see lib/searchSuggestions).
 */
export default function SearchBar({ value, onChange, placeholder = "Search...", suggest }) {
    const id = useId();

    return (
        <div className="w-full sm:max-w-sm">
            <SearchInput id={id} value={value} onChange={onChange} placeholder={placeholder} label={placeholder} suggest={suggest} />
        </div>
    );
}
