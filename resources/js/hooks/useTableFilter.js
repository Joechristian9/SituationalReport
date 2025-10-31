// resources/js/hooks/useTableFilter.js
import { useState, useMemo } from 'react';

/**
 * Custom hook for enhanced table filtering and pagination
 * 
 * @param {Array} data - The data array to filter
 * @param {Array<string>} searchFields - Array of field names to search across
 * @param {number} initialRowsPerPage - Initial rows per page (default: 5)
 * @returns {Object} - { filteredData, paginatedData, searchTerm, setSearchTerm, currentPage, setCurrentPage, rowsPerPage, setRowsPerPage, totalPages }
 */
export default function useTableFilter(data = [], searchFields = [], initialRowsPerPage = 5) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

    // Enhanced filtering: searches across multiple fields with OR logic
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return data;

        const lowerSearchTerm = searchTerm.toLowerCase();

        return data.filter((item) => {
            // Check if any of the specified fields contains the search term
            return searchFields.some((field) => {
                const value = item[field];
                
                // Handle null/undefined values
                if (value == null) return false;
                
                // Convert to string and search (handles numbers too)
                return value.toString().toLowerCase().includes(lowerSearchTerm);
            });
        });
    }, [data, searchTerm, searchFields]);

    // Calculate pagination
    const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
    
    // Reset to page 1 if current page exceeds total pages
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

    return {
        // Filtered and paginated data
        filteredData,
        paginatedData,
        
        // Search state
        searchTerm,
        setSearchTerm: (value) => {
            setSearchTerm(value);
            setCurrentPage(1); // Reset to first page when searching
        },
        
        // Pagination state
        currentPage,
        setCurrentPage,
        rowsPerPage,
        setRowsPerPage,
        totalPages,
        
        // Metadata
        totalFilteredItems: filteredData.length,
        totalItems: data.length,
        startIndex,
        endIndex: Math.min(startIndex + rowsPerPage, filteredData.length),
    };
}
