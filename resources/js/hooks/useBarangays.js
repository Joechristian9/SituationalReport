import { usePage } from "@inertiajs/react";

/** Barangay names for report forms (from the server), and the signed-in account's own barangay, if it is one. */
export default function useBarangays() {
    const { barangays = [], auth } = usePage().props;
    const own = barangays.includes(auth?.user?.name) ? auth.user.name : "";
    return { barangays, own };
}
