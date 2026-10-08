/** "As of October 8, 2026, 9:30 PM: " — the usual opening of a status remark. */
export default function asOfNow() {
    const now = new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    return `As of ${now}: `;
}
