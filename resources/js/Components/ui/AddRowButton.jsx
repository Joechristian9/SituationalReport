import React from "react";
import { Plus } from "lucide-react";

/**
 * A reusable button for adding new rows to a table or list.
 *
 * @param {object} props - The component's props.
 * @param {function} props.onClick - The function to execute when the button is clicked.
 * @param {string} [props.label='Add New Row'] - The text label for the button.
 * @param {React.ReactNode} [props.icon] - An optional icon to display. Defaults to the Plus icon.
 */
export default function AddRowButton({ onClick, label = "Add New Row", icon }) {
    return (
        <div className="flex items-center pt-4 border-t border-gray-200">
            <button
                type="button"
                onClick={onClick}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
            >
                {icon || <Plus size={18} />}
                {label}
            </button>
        </div>
    );
}
