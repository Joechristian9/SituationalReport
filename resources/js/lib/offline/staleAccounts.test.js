import { beforeEach, describe, expect, it, vi } from "vitest";

const page = vi.hoisted(() => ({ user: null }));

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
vi.mock("./context", () => ({ currentUser: () => page.user }));
vi.mock("./offlineSession", () => ({ offlineSession: vi.fn(() => null), endOfflineSession: vi.fn() }));

// Tests run without a browser: an in-memory localStorage, the app's route() helper.
const storage = new Map();
vi.stubGlobal("localStorage", {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
});
vi.stubGlobal("route", (name) => `/${name}`);
vi.stubGlobal("caches", { keys: vi.fn(async () => ["sitrep-pages-v2", "sitrep-assets-v2"]), delete: vi.fn() });

const axios = (await import("axios")).default;
const { offlineSession, endOfflineSession } = await import("./offlineSession");
const { hasAccount, rememberAccount, setSavedPagesOwner } = await import("./accounts");
const { coverNotice, isCovered, setSignedInHere } = await import("./lock");
const { CHECK_EVERY_MS, forgetStaleAccounts } = await import("./staleAccounts");

const fugu = { id: 7, name: "Fugu", email: "fugu@barangay.local", roles: [{ name: "user" }], permissions: [], offline_stamp: "s1" };
const rugao = { id: 8, name: "Rugao", email: "rugao@barangay.local", roles: [{ name: "user" }], permissions: [], offline_stamp: "r1" };
const serverSays = (current) => axios.post.mockResolvedValue({ status: 200, data: { current } });

describe("forgetStaleAccounts", () => {
    beforeEach(async () => {
        storage.clear();
        vi.clearAllMocks();
        page.user = null;
        offlineSession.mockReturnValue(null);
        vi.stubGlobal("navigator", { onLine: true });
        await rememberAccount(fugu, "correct horse");
        await rememberAccount(rugao, "battery staple");
    });

    it("forgets only the accounts the server says are not current", async () => {
        serverSays([8]);

        await forgetStaleAccounts();

        expect(axios.post).toHaveBeenCalledWith(
            "/offline.accounts.check",
            { accounts: [{ id: 7, stamp: "s1" }, { id: 8, stamp: "r1" }] },
            expect.objectContaining({ offlineSync: true, timeout: 10000 }),
        );
        expect(hasAccount(fugu.email)).toBe(false);
        expect(hasAccount(rugao.email)).toBe(true);
        expect(CHECK_EVERY_MS).toBe(5 * 60 * 1000);
    });

    it("forgets nothing when the server cannot be reached", async () => {
        axios.post.mockRejectedValue(new Error("Network Error"));

        await forgetStaleAccounts();

        expect(hasAccount(fugu.email)).toBe(true);
        expect(hasAccount(rugao.email)).toBe(true);
    });

    it("forgets nothing when the server answers with an error", async () => {
        axios.post.mockRejectedValue({ response: { status: 429, data: { message: "Too Many Attempts." } } });

        await forgetStaleAccounts();

        expect(hasAccount(fugu.email)).toBe(true);
    });

    it("forgets nothing when the answer is not the server's", async () => {
        axios.post.mockResolvedValue({ status: 200, data: "<html>no load</html>" });

        await forgetStaleAccounts();

        expect(hasAccount(fugu.email)).toBe(true);
        expect(hasAccount(rugao.email)).toBe(true);
    });

    it("does not ask while the phone says it has no connection, or remembers nobody", async () => {
        vi.stubGlobal("navigator", { onLine: false });
        await forgetStaleAccounts();

        vi.stubGlobal("navigator", { onLine: true });
        storage.clear();
        await forgetStaleAccounts();

        expect(axios.post).not.toHaveBeenCalled();
    });

    it("covers the app with the notice when the account in use is no longer current", async () => {
        page.user = fugu;
        setSignedInHere(fugu.email);
        serverSays([8]);

        await forgetStaleAccounts();

        expect(isCovered(fugu)).toBe(true);
        expect(coverNotice()).toBe("changed");
    });

    it("ends that account's offline session and clears its saved pages", async () => {
        offlineSession.mockReturnValue({ user: fugu, blank: false });
        setSavedPagesOwner(7);
        serverSays([8]);

        await forgetStaleAccounts();

        expect(endOfflineSession).toHaveBeenCalled();
        expect(caches.delete).toHaveBeenCalledWith("sitrep-pages-v2");
        expect(caches.delete).not.toHaveBeenCalledWith("sitrep-assets-v2");
    });

    it("leaves another account's login alone", async () => {
        page.user = rugao;
        setSignedInHere(rugao.email);
        setSavedPagesOwner(8);
        serverSays([8]);

        await forgetStaleAccounts();

        expect(isCovered(rugao)).toBe(false);
        expect(coverNotice()).toBeNull();
        expect(endOfflineSession).not.toHaveBeenCalled();
        expect(caches.delete).not.toHaveBeenCalled();
    });
});
