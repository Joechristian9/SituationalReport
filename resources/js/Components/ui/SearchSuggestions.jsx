import { useEffect, useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "./popover";
import { cn } from "@/lib/utils";

/** The suggestion text with the typed part in bold. */
function Highlight({ text, term }) {
    const query = term.trim().toLowerCase();
    const at = text.toLowerCase().indexOf(query);
    if (!query || at < 0) return text;
    return (
        <>
            {text.slice(0, at)}
            <mark className="bg-transparent font-semibold text-foreground">{text.slice(at, at + query.length)}</mark>
            {text.slice(at + query.length)}
        </>
    );
}

/**
 * Wraps a search box with a suggestion list (an ARIA combobox). Typing only updates the box
 * and the list; the search runs (`onChange`) when a suggestion is picked, on Enter, or when
 * the box is emptied, so tables and servers aren't re-filtered on every keystroke.
 *
 * `value` is the search in effect; `suggest(text)` returns [{ value, hint }] for typed text
 * (see lib/searchSuggestions). `children(inputProps, clear)` returns the box; its root element
 * anchors the list. Up / Down move, Enter picks or searches, Escape closes.
 * The list renders in a portal, so cards with overflow-hidden don't clip it.
 */
export default function SearchSuggestions({ value: applied, onChange, suggest, children }) {
    const value = applied ?? "";
    const listId = useId();
    const [draft, setDraft] = useState(value);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);

    // The search can change from outside (a "Clear search" link, a new row): show it.
    useEffect(() => setDraft(value), [value]);

    const typed = draft.trim();
    const options = useMemo(() => {
        if (!open || !typed) return [];
        // First row runs the typed text as it is, unless that is already the search.
        const runTyped = typed !== value.trim() ? [{ value: typed, search: true }] : [];
        return [...runTyped, ...(suggest?.(typed) ?? [])];
    }, [open, typed, value, suggest]);

    const expanded = options.length > 0;
    const activeIndex = active < options.length ? active : -1;

    const close = () => {
        setOpen(false);
        setActive(-1);
    };
    const run = (text) => {
        setDraft(text);
        onChange(text);
        close();
    };
    const clear = () => run("");

    const inputProps = {
        value: draft,
        role: "combobox",
        "aria-autocomplete": "list",
        "aria-expanded": expanded,
        "aria-controls": expanded ? listId : undefined,
        "aria-activedescendant": activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined,
        // Our own list replaces the browser's list of things typed before.
        autoComplete: "off",
        enterKeyHint: "search",
        onChange: (e) => {
            setDraft(e.target.value);
            setOpen(true);
            setActive(-1);
            // Emptying the box (or its built-in clear button) shows everything again right away.
            if (e.target.value === "" && value !== "") onChange("");
        },
        onFocus: () => setOpen(true),
        onBlur: close,
        onKeyDown: (e) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                if (expanded) setActive((activeIndex + 1) % options.length);
                else setOpen(true);
            } else if (e.key === "ArrowUp" && expanded) {
                e.preventDefault();
                setActive(activeIndex <= 0 ? options.length - 1 : activeIndex - 1);
            } else if (e.key === "Enter") {
                e.preventDefault();
                run(activeIndex >= 0 ? options[activeIndex].value : typed);
            } else if (e.key === "Escape" && expanded) {
                // First Escape closes the list; the next one clears the box as usual.
                e.preventDefault();
                close();
            }
        },
    };

    return (
        <Popover open={expanded} onOpenChange={(next) => !next && close()}>
            <PopoverAnchor asChild>{children(inputProps, clear)}</PopoverAnchor>
            <PopoverContent
                align="start"
                sideOffset={4}
                // Focus stays in the search box while the list is open.
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
                // Clicking back into the focused box is not "outside".
                onInteractOutside={(e) => e.target === document.activeElement && e.preventDefault()}
                className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-1"
            >
                <ul id={listId} role="listbox" aria-label="Suggestions">
                    {options.map((option, i) => (
                        <li
                            key={option.search ? "search" : `${option.hint}-${option.value}`}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={i === activeIndex}
                            // Keep focus in the box so the tap doesn't close the list first.
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => run(option.value)}
                            onMouseEnter={() => setActive(i)}
                            className={cn(
                                "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-1.5 text-sm md:min-h-9",
                                i === activeIndex ? "bg-accent text-accent-foreground" : "text-foreground"
                            )}
                        >
                            {option.search ? (
                                <span className="flex min-w-0 items-center gap-2">
                                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                    <span className="truncate">
                                        Search for <span className="font-semibold">“{option.value}”</span>
                                    </span>
                                </span>
                            ) : (
                                <>
                                    <span className="min-w-0 truncate">
                                        <Highlight text={option.value} term={typed} />
                                    </span>
                                    {option.hint && <span className="shrink-0 text-xs text-muted-foreground">{option.hint}</span>}
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </PopoverContent>
        </Popover>
    );
}
