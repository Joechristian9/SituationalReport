import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@inertiajs/react", () => ({ router: { push: vi.fn(), on: vi.fn() } }));
vi.mock("react-hot-toast", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("./sync", () => ({ syncNow: vi.fn() }));

// Tests run without a browser: an in-memory localStorage, the app's route() helper, a window.
const storage = new Map();
vi.stubGlobal("localStorage", {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
});
vi.stubGlobal("route", (name) => `/${name}`);
vi.stubGlobal("window", { addEventListener: vi.fn(), location: {} });
vi.stubGlobal("setInterval", vi.fn());

const { router } = await import("@inertiajs/react");
const axios = (await import("axios")).default;
const { syncNow } = await import("./sync");
const { canLock } = await import("./lock");
const { preparedAccount, savePrepared } = await import("./prepared");
const { offlineSession, signInToServer, startOfflineSession } = await import("./offlineSession");

// The page guard is installed once, with the first session: keep hold of it.
let beforeVisit;
router.on.mockImplementation((event, handler) => {
    if (event === "before") beforeVisit = handler;
});

const user = { id: 7, name: "Fugu", email: "fugu@barangay.local", permissions: [{ name: "access-road-form" }] };
const queryClient = { setQueryData: vi.fn() };

function signInOffline() {
    savePrepared({
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        iterations: 1000,
        accounts: [{ user, salt: "c2FsdA==", hash: "aGFzaA==" }],
        template: { barangays: ["Fugu", "Rugao"], typhoon: { active: { id: 3 }, hasActive: true }, communicationServices: { cellphone: [] } },
    });
    startOfflineSession({ user }, "correct-horse-battery", queryClient);
}

describe("signing in without internet", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("navigator", { onLine: true });
    });

    it("opens the forms page as the account, with blank forms, and keeps other pages shut", () => {
        signInOffline();

        const page = router.push.mock.calls[0][0];
        expect(page.component).toBe("SituationReports/Index");
        expect(page.props.auth.user).toBe(user);
        expect(page.props.barangays).toEqual(["Fugu", "Rugao"]);
        // No report rows of anyone: only the shared lists.
        expect(Object.keys(page.props).sort()).toEqual(["auth", "barangays", "errors", "flash", "typhoon"]);
        expect(queryClient.setQueryData).toHaveBeenCalledWith(["communication-services"], { cellphone: [] });
        expect(offlineSession().password).toBe("correct-horse-battery");
        // Opening any page would show this phone's saved copies, maybe another account's.
        expect(beforeVisit({ detail: { visit: { method: "get" } } })).toBe(false);
        expect(beforeVisit({ detail: { visit: { method: "post" } } })).toBeUndefined();
    });

    it("signs in to the server once the connection returns, then sends the reports", async () => {
        signInOffline();
        axios.get.mockResolvedValue({});
        axios.post.mockResolvedValue({ status: 200 });

        await signInToServer();

        expect(axios.post).toHaveBeenCalledWith("/login", { email: user.email, password: "correct-horse-battery", remember: true }, expect.anything());
        expect(offlineSession()).toBeNull();
        expect(syncNow).toHaveBeenCalled();
        // The usual lock works from now on, as after any online sign-in.
        expect(canLock(user.email)).toBe(true);
    });

    it("keeps the reports and forgets the preparation when the server refuses the password", async () => {
        signInOffline();
        axios.get.mockResolvedValue({});
        axios.post.mockRejectedValue({ response: { status: 422 } });

        await signInToServer();

        expect(offlineSession().refused).toBe(true);
        expect(preparedAccount(user.email)).toBeNull();
        // syncNow shows "Log in to send…"; the sign-in page must then be reachable.
        expect(syncNow).toHaveBeenCalled();
        expect(beforeVisit({ detail: { visit: { method: "get" } } })).toBeUndefined();
    });

    it("changes nothing while the connection is too weak to answer, and tries again later", async () => {
        signInOffline();
        axios.get.mockResolvedValue({});
        axios.post.mockRejectedValue(new Error("Network Error"));

        await signInToServer();

        expect(offlineSession().refused).toBeUndefined();
        expect(preparedAccount(user.email)).not.toBeNull();
        expect(syncNow).not.toHaveBeenCalled();
    });
});
