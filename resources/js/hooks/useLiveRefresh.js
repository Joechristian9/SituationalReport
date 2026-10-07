import { useCallback, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

/**
 * Keeps an Inertia page live by re-fetching only the listed props on an interval.
 * Polling, not websockets, so it works on shared hosting.
 *
 * Own loop instead of Inertia's usePoll: that one only throttles hidden tabs,
 * captures its options on first render, and cannot skip a tick while the
 * previous request is still running.
 *
 * `enabled: false` stops polling entirely, e.g. disaster pages when no disaster is
 * active: nothing new can arrive, so the requests would only cost data in the field.
 */
export default function useLiveRefresh({ only, interval = 15000, enabled = true }) {
    const [paused, setPaused] = useState(false);
    const [updatedAt, setUpdatedAt] = useState(() => Date.now());
    const propsKey = only.join(',');

    useEffect(() => {
        if (paused || !enabled) return undefined;

        let inFlight = false;
        const refresh = () => {
            if (document.hidden || inFlight) return;
            inFlight = true;
            router.reload({
                only: propsKey.split(','),
                onSuccess: () => setUpdatedAt(Date.now()),
                onFinish: () => {
                    inFlight = false;
                },
            });
        };

        const timer = setInterval(refresh, interval);
        // Catch up right away when the tab becomes visible again.
        document.addEventListener('visibilitychange', refresh);

        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [paused, enabled, interval, propsKey]);

    const toggle = useCallback(() => setPaused((value) => !value), []);

    return { paused, updatedAt, interval, toggle, enabled };
}
