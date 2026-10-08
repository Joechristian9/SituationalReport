import { useCallback } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

/**
 * Change history for a form's fields, for ModificationIndicator. If it fails to load
 * the form still works; it just shows no history (it used to replace the whole form).
 *
 * @param {string} routeName e.g. 'modifications.road'
 * @returns {{ getFieldHistory: Function, historyKey: Array }} pass historyKey to useRowEditor
 */
export default function useFieldHistory(routeName) {
    const historyKey = ['modifications', routeName];

    const { data } = useQuery({
        queryKey: historyKey,
        queryFn: async () => (await axios.get(route(routeName))).data,
        staleTime: 5 * 60 * 1000,
    });

    const history = data?.history;
    const getFieldHistory = useCallback((recordId, fieldName) => history?.[`${recordId}_${fieldName}`] ?? [], [history]);

    return { getFieldHistory, historyKey };
}
