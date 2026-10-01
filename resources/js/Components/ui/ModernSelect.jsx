import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * ModernSelect - An enhanced dropdown component with consistent UI/UX (like RowsPerPage)
 * @param {Object} props
 * @param {string} props.value - Current selected value
 * @param {Function} props.onChange - Change handler function
 * @param {Array} props.options - Array of options {value, label}
 * @param {string} props.placeholder - Placeholder text
 * @param {React.ReactNode} props.icon - Optional icon to display
 * @param {string} props.className - Additional CSS classes
 */
export default function ModernSelect({
    value,
    onChange,
    options = [],
    placeholder = 'Select an option',
    icon = null,
    className = '',
    ariaLabel,
}) {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Escape closes the list and returns focus to the trigger.
    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && showDropdown) {
            e.stopPropagation();
            setShowDropdown(false);
            triggerRef.current?.focus();
        }
    };

    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption ? selectedOption.label : placeholder;

    return (
        <div className={`relative ${className}`} ref={dropdownRef} onKeyDown={handleKeyDown}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-haspopup="true"
                aria-expanded={showDropdown}
                aria-label={ariaLabel ? `${ariaLabel}: ${displayText}` : undefined}
                className={`
                    flex items-center justify-between gap-2
                    ${icon ? 'pl-10' : 'pl-4'} pr-3 py-2
                    text-sm font-medium text-slate-700
                    bg-white
                    border border-slate-300 rounded-lg
                    shadow-sm
                    hover:bg-slate-50 hover:shadow-md
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                    transition-all duration-200
                    cursor-pointer
                    w-full
                `}
            >
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {icon}
                    </div>
                )}
                <span className="flex-1 text-left">{displayText}</span>
                <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`text-slate-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                />
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-full min-w-[160px] bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={value === option.value}
                            onClick={() => {
                                onChange(option.value);
                                setShowDropdown(false);
                                triggerRef.current?.focus();
                            }}
                            className={`
                                w-full text-left px-4 py-2 text-sm
                                flex items-center justify-between
                                hover:bg-blue-50 transition-colors
                                focus:outline-none focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500
                                ${value === option.value
                                    ? 'text-blue-600 font-medium bg-blue-50' 
                                    : 'text-slate-700'
                                }
                            `}
                        >
                            <span>{option.label}</span>
                            {value === option.value && (
                                <Check size={16} className="text-blue-500" aria-hidden="true" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
