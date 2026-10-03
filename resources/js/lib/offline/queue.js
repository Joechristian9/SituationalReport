import { allItems, newKey, putItem, removeItem } from './store';
import { currentDisaster, currentSession, currentUser } from './context';

// Report endpoints whose saves can be queued offline, with a readable name.
// Paths are matched at the end of the URL so a sub-folder install still works.
const ENDPOINTS = [
    ['/weather-reports', 'Weather'],
    ['/water-level-reports', 'Water level'],
    ['/electricity-reports', 'Electricity'],
    ['/water-service-reports', 'Water service'],
    ['/communication-reports', 'Communication'],
    ['/road-reports', 'Roads'],
    ['/bridge-reports', 'Bridges'],
    ['/pre-emptive-reports', 'Pre-emptive evacuation'],
    ['/declaration-usc', 'Declaration (USC)'],
    ['/pre-positioning', 'Pre-positioning'],
    ['/incident-monitored', 'Incidents monitored'],
    ['/casualties', 'Dead'],
    ['/injured', 'Injured'],
    ['/missing', 'Missing'],
    ['/affected-tourists-reports', 'Affected tourists'],
    ['/affected-tourists', 'Affected tourists'],
    ['/damaged-houses-reports', 'Damaged houses'],
    ['/damaged-houses', 'Damaged houses'],
    ['/assistance-extendeds', 'Assistance extended'],
    ['/assistance-provided-lgus', 'Assistance provided by LGUs'],
    ['/suspension-classes-reports', 'Suspension of classes'],
    ['/suspension-work-reports', 'Suspension of work'],
    ['/response-operations-reports', 'Response operations'],
    ['/agriculture-reports', 'Agriculture'],
];

export const QUEUED_MESSAGE = 'No internet: saved on this device. It will be sent automatically when you are back online.';

/** A form's success message, or the offline one if the save was only queued on the device. */
export const savedMessage = (response, onlineMessage) => (response?.data?.queued ? QUEUED_MESSAGE : onlineMessage);

/** The endpoint path for a URL if it is a queueable report save, else null. */
export function endpointFor(url) {
    if (!url) return null;
    const pathname = new URL(url, window.location.origin).pathname.replace(/\/$/, '');
    const match = ENDPOINTS.find(([path]) => pathname.endsWith(path));
    return match ? match[0] : null;
}

export const labelFor = (path) => ENDPOINTS.find(([p]) => p === path)?.[1] ?? 'Report';

const isOpen = (item) => item.status === 'pending' || item.status === 'waiting';

/** The unsent save for this form by this user, if any (failed ones are left alone). */
export async function openItemFor(path, userId) {
    return (await allItems()).find((item) => item.userId === userId && item.path === path && isOpen(item));
}

/**
 * Combine an older unsent save with a newer one from a different page. Rows that
 * have a server id keep their newest version; rows without one are all kept,
 * because the newer page never saw the older page's new rows.
 */
export function mergePayloads(older, newer) {
    const merged = { ...older, ...newer };
    Object.keys(newer).forEach((key) => {
        if (!Array.isArray(older?.[key]) || !Array.isArray(newer[key])) return;
        const withId = new Map();
        const withoutId = [];
        [...older[key], ...newer[key]].forEach((row) => {
            if (row && row.id !== null && row.id !== undefined && row.id !== '' && !Number.isNaN(Number(row.id))) {
                withId.set(String(row.id), row);
            } else {
                withoutId.push(row);
            }
        });
        merged[key] = [...withId.values(), ...withoutId];
    });
    return merged;
}

/**
 * Store a save that could not reach the server. `replacesPending` is set when the
 * payload was already merged with the pending save (an online save that then failed).
 */
export async function enqueue({ url, payload, replacesPending = null }) {
    const path = endpointFor(url);
    const user = currentUser();
    const disaster = currentDisaster();
    const session = currentSession();
    const existing = await openItemFor(path, user?.id);

    // Same page: the newer save already contains everything from the older one.
    // Different page: the forms started from server data, so keep both.
    const sameSession = existing && (existing.session === session || existing.id === replacesPending);
    // Always a new key: the server may already know the old one (if a send went
    // through but the reply was lost) and would skip this newer content.
    if (existing) await removeItem(existing.id);
    const item = {
        id: newKey(),
        userId: user?.id ?? null,
        userName: user?.name ?? null,
        disasterId: disaster?.id ?? null,
        disasterName: disaster?.name ?? null,
        path,
        url,
        label: labelFor(path),
        payload: existing && !sameSession ? mergePayloads(existing.payload, payload) : payload,
        session,
        savedAt: Date.now(),
        status: 'pending',
        message: null,
    };
    await putItem(item);
    window.dispatchEvent(new CustomEvent('offline:queued', { detail: item }));
    return item;
}

export const dropItem = removeItem;
