import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const NOUN = { dead: 'death', injured: 'injury', missing: 'missing person' };

export function reporterLabel(item) {
    return item.office ? `${item.reporter} (office)` : `Brgy. ${item.reporter}`;
}

/**
 * Returns the keys of human impact reports that arrived through a live refresh
 * (not the ones already there when the page opened) and announces them with a toast.
 * Call it in the page, not the feed, so it keeps working while another tab is shown.
 */
export default function useNewImpactReports(items) {
    const known = useRef(null);
    const latest = useRef('');
    const [fresh, setFresh] = useState(() => new Set());

    useEffect(() => {
        const newest = items.reduce((max, i) => (i.reportedAt > max ? i.reportedAt : max), '');

        if (known.current === null) {
            known.current = new Set(items.map((i) => i.key));
            latest.current = newest;
            return;
        }

        // Only newer reports count: if one is deleted, an older one slides back
        // into the list and must not look new.
        const arrived = items.filter((i) => !known.current.has(i.key) && i.reportedAt >= latest.current);
        items.forEach((i) => known.current.add(i.key));
        if (newest > latest.current) latest.current = newest;
        if (arrived.length === 0) return;

        setFresh((prev) => new Set([...prev, ...arrived.map((i) => i.key)]));
        const first = arrived[0];
        toast(arrived.length === 1 ? `New ${NOUN[first.type]} reported` : `${arrived.length} new human impact reports`, {
            description:
                arrived.length === 1
                    ? [reporterLabel(first), first.detail].filter(Boolean).join(' · ')
                    : `Latest from ${reporterLabel(first)}`,
        });
    }, [items]);

    return fresh;
}
