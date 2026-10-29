import { describe, expect, it, vi } from "vitest";

vi.mock("@inertiajs/react", () => ({ router: { push: vi.fn(), on: vi.fn() } }));
vi.mock("react-hot-toast", () => ({ toast: { error: vi.fn() } }));

// Tests run without a browser: an in-memory localStorage and the app's route() helper.
const storage = new Map();
vi.stubGlobal("localStorage", {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
});
vi.stubGlobal("route", (name) => `/${name}`);

const { router } = await import("@inertiajs/react");
const { savePrepared } = await import("./prepared");
const { offlineSession, startOfflineSession } = await import("./offlineSession");

describe("startOfflineSession", () => {
    it("opens the forms page as the account, with blank forms, and keeps other pages shut", () => {
        const user = { id: 7, name: "Fugu", email: "fugu@barangay.local", permissions: [{ name: "access-road-form" }] };
        savePrepared({
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            iterations: 1000,
            accounts: [{ user, salt: "c2FsdA==", hash: "aGFzaA==" }],
            template: { barangays: ["Fugu", "Rugao"], typhoon: { active: { id: 3 }, hasActive: true }, communicationServices: { cellphone: [] } },
        });
        const queryClient = { setQueryData: vi.fn() };

        startOfflineSession({ user }, "correct-horse-battery", queryClient);

        const page = router.push.mock.calls[0][0];
        expect(page.component).toBe("SituationReports/Index");
        expect(page.props.auth.user).toBe(user);
        expect(page.props.barangays).toEqual(["Fugu", "Rugao"]);
        // No report rows of anyone: only the shared lists.
        expect(Object.keys(page.props).sort()).toEqual(["auth", "barangays", "errors", "flash", "typhoon"]);
        expect(queryClient.setQueryData).toHaveBeenCalledWith(["communication-services"], { cellphone: [] });
        expect(offlineSession().password).toBe("correct-horse-battery");

        // Opening any page would show this phone's saved copies, maybe another account's.
        const [event, beforeVisit] = router.on.mock.calls[0];
        expect(event).toBe("before");
        expect(beforeVisit({ detail: { visit: { method: "get" } } })).toBe(false);
        expect(beforeVisit({ detail: { visit: { method: "post" } } })).toBeUndefined();
    });
});
