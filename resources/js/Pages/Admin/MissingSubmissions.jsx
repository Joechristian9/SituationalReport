import React from 'react';
import PersonSubmissions from '@/Components/shared/PersonSubmissions';

const config = {
    category: 'missing',
    title: 'Missing Persons Submissions',
    description: 'Missing persons reported by each office, with who submitted each record and when.',
    statLabel: 'Reported missing',
    listTitle: 'Missing person records',
    emptyTitle: 'No missing persons reported yet',
    searchPlaceholder: 'Name, address or cause',
    columns: [
        { key: 'cause', label: 'Cause' },
        { key: 'remarks', label: 'Remarks' },
    ],
    details: [
        { key: 'cause', label: 'Cause' },
        { key: 'remarks', label: 'Remarks' },
    ],
};

export default function MissingSubmissions({ missing, users, filters, stats, disaster }) {
    return (
        <PersonSubmissions
            config={config}
            records={missing}
            users={users}
            filters={filters}
            stats={stats}
            disaster={disaster}
        />
    );
}
