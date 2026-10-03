import axios from 'axios';
import { allItems, putItem, removeItem } from './store';
import { currentSession, currentUser } from './context';

// Sends queued saves, oldest first, once the server is reachable again.

const state = { running: false, loginNeeded: false, reloadNeeded: false };
const listeners = new Set();
// Forms whose queued save from this very page was just sent: their rows now have
// server ids the page doesn't know, so saving again before a reload would duplicate them.
const sentFromThisPage = new Set();

function emit() {
    listeners.forEach((listener) => listener({ ...state }));
}

export function subscribeSync(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export const syncState = () => ({ ...state });

/** True if saving this form now could duplicate rows that were just sent from this page. */
export const needsReloadBeforeSaving = (path) => sentFromThisPage.has(`${currentSession()}|${path}`);

export async function syncNow() {
    const user = currentUser();
    if (state.running || !user || !navigator.onLine) return;
    state.running = true;
    emit();

    try {
        const items = (await allItems()).filter(
            (item) => item.userId === user.id && (item.status === 'pending' || item.status === 'waiting'),
        );

        for (const item of items) {
            try {
                await axios.post(item.url, item.payload, {
                    offlineSync: true,
                    headers: {
                        Accept: 'application/json',
                        'X-Offline-Key': item.id,
                        'X-Offline-Disaster': item.disasterId ?? '',
                    },
                });
                await removeItem(item.id);
                state.loginNeeded = false;
                if (item.session === currentSession()) {
                    sentFromThisPage.add(`${item.session}|${item.path}`);
                    state.reloadNeeded = true;
                }
                window.dispatchEvent(new CustomEvent('offline:sent', { detail: item }));
            } catch (error) {
                const response = error.response;
                if (!response) break; // still unreachable; try again later
                if (response.status === 401 || response.status === 419) {
                    state.loginNeeded = true;
                    break;
                }
                if (response.status >= 500) break; // server trouble; keep it and retry later
                if (response.status === 403 && response.data?.isPaused) {
                    await putItem({ ...item, status: 'waiting', message: response.data.message });
                    continue;
                }
                // Disaster ended or changed, or the data was rejected: keep it, never drop silently.
                await putItem({ ...item, status: 'failed', message: response.data?.message || `The server refused this report (${response.status}).` });
            }
        }
    } finally {
        state.running = false;
        emit();
    }
}
