import { useSyncExternalStore } from 'react';

// The spot in AppLayout's header where app-wide status (OfflineStatus) draws its chip. AppLayout
// mounts again on every page, but OfflineStatus stays mounted (app.jsx) to keep its messages.
let slot = null;
const listeners = new Set();

/** Ref callback for the header's slot element (null when the page has no AppLayout). */
export function setHeaderSlot(node) {
    slot = node;
    listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const useHeaderSlot = () => useSyncExternalStore(subscribe, () => slot);
