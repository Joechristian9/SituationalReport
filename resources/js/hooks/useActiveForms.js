import { useState, useEffect } from 'react';

const STORAGE_KEY = 'active_forms';

export const useActiveForms = () => {
    const [activeForms, setActiveForms] = useState([]);

    // Load active forms from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setActiveForms(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load active forms:', error);
        }
    }, []);

    // Save to localStorage whenever activeForms changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(activeForms));
        } catch (error) {
            console.error('Failed to save active forms:', error);
        }
    }, [activeForms]);

    const addForm = (form) => {
        setActiveForms(prev => {
            // Check if form already exists
            const exists = prev.some(f => f.id === form.id);
            if (exists) return prev;
            
            // Add new form to the beginning
            return [form, ...prev];
        });
    };

    const removeForm = (formId) => {
        setActiveForms(prev => prev.filter(f => f.id !== formId));
    };

    const clearAll = () => {
        setActiveForms([]);
    };

    return {
        activeForms,
        addForm,
        removeForm,
        clearAll
    };
};
