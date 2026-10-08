import { forwardRef, useId, useState } from 'react';
import { Input } from '@/Components/ui/input';
import { cn } from '@/lib/utils';

// Barangay accounts use @barangay.local; office staff mostly sign in with Gmail.
const DOMAINS = ['barangay.local', 'gmail.com'];

function suggestionsFor(value) {
    const at = value.indexOf('@');
    if (at < 1 || value.indexOf('@', at + 1) !== -1) return [];

    const name = value.slice(0, at);
    const typed = value.slice(at + 1).toLowerCase();

    return DOMAINS.filter((domain) => domain.startsWith(typed) && domain !== typed).map((domain) => `${name}@${domain}`);
}

/**
 * Email input that offers to finish the domain once "@" is typed. Arrow keys move,
 * Enter or Tab accepts, Escape dismisses. Browser autofill (autoComplete) still works.
 */
const EmailAutocompleteInput = forwardRef(({ value, onValueChange, onKeyDown, onBlur, className, ...props }, ref) => {
    const listId = useId();
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);

    const suggestions = open ? suggestionsFor(value) : [];
    const expanded = suggestions.length > 0;
    const activeIndex = Math.min(active, suggestions.length - 1);

    const choose = (email) => {
        onValueChange(email);
        setOpen(false);
    };

    const handleKeyDown = (e) => {
        if (expanded) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const step = e.key === 'ArrowDown' ? 1 : -1;
                setActive((activeIndex + step + suggestions.length) % suggestions.length);
                return;
            }
            if ((e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) && activeIndex >= 0) {
                e.preventDefault();
                choose(suggestions[activeIndex]);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setOpen(false);
                return;
            }
        }
        onKeyDown?.(e);
    };

    return (
        <>
            <Input
                ref={ref}
                type="email"
                value={value}
                onChange={(e) => {
                    onValueChange(e.target.value);
                    setOpen(true);
                    setActive(0);
                }}
                onKeyDown={handleKeyDown}
                onBlur={(e) => {
                    setOpen(false);
                    onBlur?.(e);
                }}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={expanded}
                aria-controls={expanded ? listId : undefined}
                aria-activedescendant={expanded ? `${listId}-${activeIndex}` : undefined}
                className={className}
                {...props}
            />
            {expanded && (
                <ul
                    id={listId}
                    role="listbox"
                    aria-label="Email suggestions"
                    className="absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-lg bg-popover py-1 text-popover-foreground shadow-lg"
                >
                    {suggestions.map((email, index) => (
                        <li
                            key={email}
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            // mousedown, not click: keeps focus in the input so onBlur does not close the list first
                            onMouseDown={(e) => {
                                e.preventDefault();
                                choose(email);
                            }}
                            onMouseEnter={() => setActive(index)}
                            className={cn(
                                'flex min-h-11 cursor-pointer items-center truncate px-4 text-base',
                                index === activeIndex && 'bg-primary text-primary-foreground',
                            )}
                        >
                            {email}
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
});

EmailAutocompleteInput.displayName = 'EmailAutocompleteInput';

export default EmailAutocompleteInput;
