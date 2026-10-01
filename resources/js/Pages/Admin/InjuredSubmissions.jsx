import React from 'react';
import PersonSubmissions from '@/Components/shared/PersonSubmissions';

const config = {
    category: 'injured',
    title: 'Injured Submissions',
    description: 'Injured persons reported by each office, with who submitted each record and when.',
    statLabel: 'Reported injured',
    listTitle: 'Injured records',
    emptyTitle: 'No injured persons reported yet',
    searchPlaceholder: 'Name, address or diagnosis',
    columns: [
        { key: 'diagnosis', label: 'Diagnosis' },
        { key: 'date_admitted', label: 'Admitted', type: 'date' },
    ],
    details: [
        { key: 'diagnosis', label: 'Diagnosis' },
        { key: 'date_admitted', label: 'Date admitted', type: 'date' },
        { key: 'place_of_incident', label: 'Place of incident' },
        { key: 'remarks', label: 'Remarks' },
    ],
};

export default function InjuredSubmissions({ injured, users, filters, stats, disaster }) {
    return (
        <PersonSubmissions
            config={config}
            records={injured}
            users={users}
            filters={filters}
            stats={stats}
            disaster={disaster}
        />
    );
}
