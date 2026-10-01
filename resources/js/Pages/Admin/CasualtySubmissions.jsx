import React from 'react';
import PersonSubmissions from '@/Components/shared/PersonSubmissions';

const config = {
    category: 'casualties',
    title: 'Casualty Submissions',
    description: 'Deaths reported by each office, with who submitted each record and when.',
    statLabel: 'Reported dead',
    listTitle: 'Casualty records',
    emptyTitle: 'No casualties reported yet',
    searchPlaceholder: 'Name, address or cause of death',
    columns: [{ key: 'cause_of_death', label: 'Cause of death' }],
    details: [
        { key: 'cause_of_death', label: 'Cause of death' },
        { key: 'date_died', label: 'Date of death', type: 'date' },
        { key: 'place_of_incident', label: 'Place of incident' },
    ],
};

export default function CasualtySubmissions({ casualties, users, filters, stats, disaster }) {
    return (
        <PersonSubmissions
            config={config}
            records={casualties}
            users={users}
            filters={filters}
            stats={stats}
            disaster={disaster}
        />
    );
}
