import { beforeEach, describe, expect, it, vi } from "vitest";

const page = vi.hoisted(() => ({ user: null }));

vi.mock("@inertiajs/react", () => ({ router: { push: vi.fn(), visit: vi.fn(), on: vi.fn() } }));
vi.mock("react-hot-toast", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("./context", () => ({ currentUser: () => page.user }));
vi.mock("./sync", () => ({
    holdSync: vi.fn(),
    syncNow: vi.fn(),
    refreshPage: vi.fn(),
    syncState: () => ({ reloadNeeded: false }),
    canRefreshWithoutLosingEdits: () => true,
    SEND_TIMEOUT_MS: 30000,
}));

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
vi.stubGlobal("caches", { keys: vi.fn(async () => ["sitrep-pages-v2", "sitrep-assets-v2"]), delete: vi.fn() });

const PASSWORD = "correct-horse-battery";
const user = { id: 7, name: "Fugu", email: "fugu@barangay.local", roles: [{ name: "user" }], permissions: [{ name: "access-road-form" }], offline_stamp: "s1" };
const queryClient = { setQueryData: vi.fn() };

/** A fresh app start (no session yet) on a phone that remembers the account. */
async function phone({ pagesOwner = 99, pageUser = null } = {}) {
    storage.clear();
    page.user = pageUser;
    vi.resetModules();
    const app = {
        accounts: await import("./accounts"),
        lock: await import("./lock"),
        sync: await import("./sync"),
        axios: (await import("axios")).default,
        router: (await import("@inertiajs/react")).router,
        ...(await import("./offlineSession")),
    };
    app.router.on.mockImplementation((event, handler) => {
        if (event === "before") app.beforeVisit = handler;
    });
    await app.accounts.rememberAccount(user, PASSWORD);
    app.accounts.setSavedPagesOwner(pagesOwner);
    app.accounts.saveTemplate({ barangays: ["Fugu", "Rugao"], typhoon: { active: { id: 3 }, hasActive: true }, communicationServices: { cellphone: [] } });
    app.start = () => app.startOfflineSession(app.accounts.account(user.email), PASSWORD, queryClient);
    // The server, reachable and accepting, unless a test says otherwise.
    app.axios.get.mockResolvedValue({ status: 204 });
    app.axios.post.mockImplementation((url) =>
        Promise.resolve(url === "/logout" ? { status: 204 } : { status: 200, data: { user: { ...user, offline_stamp: "new" }, home: "/situation-reports" } }),
    );
    return app;
}

const postedTo = (app) => app.axios.post.mock.calls.map(([url]) => url);

describe("an offline session", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("navigator", { onLine: true });
    });

    it("opens blank forms for an account whose rows are not saved on this phone", async () => {
        const app = await phone({ pagesOwner: 99 });

        app.start();

        expect(app.router.push).toHaveBeenCalledTimes(1);
        const pushed = app.router.push.mock.calls[0][0];
        expect(pushed.component).toBe("SituationReports/Index");
        expect(pushed.url).toBe("/situation-reports.index");
        expect(pushed.props.auth.user).toEqual(user);
        expect(pushed.props.barangays).toEqual(["Fugu", "Rugao"]);
        // No report rows of anyone: only the shared lists.
        expect(Object.keys(pushed.props).sort()).toEqual(["auth", "barangays", "errors", "flash", "typhoon"]);
        expect(queryClient.setQueryData).toHaveBeenCalledWith(["communication-services"], { cellphone: [] });
        expect(app.sync.holdSync).toHaveBeenLastCalledWith(true);
        expect(app.lock.signedInHere()).toBe(user.email);
        expect(app.offlineSession()).toEqual({ user, blank: true });
    });

    it("keeps other pages and background data shut during a blank session", async () => {
        const app = await phone({ pagesOwner: 99 });

        app.start();

        expect(app.beforeVisit({ detail: { visit: { method: "get" } } })).toBe(false);
        expect(app.beforeVisit({ detail: { visit: { method: "post" } } })).toBeUndefined();
        expect(app.blocksRequest({ method: "get" })).toBe(true);
        expect(app.blocksRequest({ method: "get", offlineSync: true })).toBe(false);
        expect(app.blocksRequest({ method: "post" })).toBe(false);
    });

    it("opens the saved pages for the account they belong to", async () => {
        const app = await phone({ pagesOwner: 7 });

        app.start();

        expect(app.router.visit).toHaveBeenCalledWith("/situation-reports.index");
        expect(app.router.push).not.toHaveBeenCalled();
        expect(app.offlineSession().blank).toBe(false);
        expect(app.blocksRequest({ method: "get" })).toBe(false);
        expect(app.beforeVisit({ detail: { visit: { method: "get" } } })).toBeUndefined();
    });

    it("just uncovers the page when the account's own saved page is already showing", async () => {
        const app = await phone({ pagesOwner: 7, pageUser: user });

        app.start();

        expect(app.router.visit).not.toHaveBeenCalled();
        expect(app.router.push).not.toHaveBeenCalled();
    });

    it("blocks nothing before anyone logs in offline", async () => {
        const app = await phone();

        expect(app.offlineSession()).toBeNull();
        expect(app.blocksRequest({ method: "get" })).toBe(false);
    });

    it("logs in to the server when the connection returns, then sends", async () => {
        const app = await phone({ pagesOwner: 7 });
        app.start();

        await app.signInToServer();

        expect(app.axios.get).toHaveBeenCalledWith("/sanctum.csrf-cookie", expect.objectContaining({ offlineSync: true, timeout: 30000 }));
        expect(postedTo(app)).toEqual(["/logout", "/login"]);
        const [, body, config] = app.axios.post.mock.calls[1];
        expect(body).toEqual({ email: user.email, password: PASSWORD, remember: true });
        expect(config).toMatchObject({ offlineSync: true, timeout: 30000, headers: { Accept: "application/json" } });
        expect(app.offlineSession()).toBeNull();
        expect(app.sync.holdSync).toHaveBeenLastCalledWith(false);
        expect(app.sync.syncNow).toHaveBeenCalledWith();
        expect(app.accounts.account(user.email).stamp).toBe("new");
        expect(await app.accounts.checkPassword(user.email, PASSWORD)).toBe("ok");
    });

    it("sends the logged-out account's reports before logging it out", async () => {
        const app = await phone({ pagesOwner: 7 });
        app.lock.setPendingLogout(3);
        app.start();

        await app.signInToServer();

        expect(app.sync.syncNow).toHaveBeenCalledWith({ userId: 3, evenIfHeld: true });
        expect(app.sync.syncNow.mock.invocationCallOrder[0]).toBeLessThan(app.axios.post.mock.invocationCallOrder[0]);
        expect(app.lock.pendingLogout()).toBeNull();
    });

    it("takes over the saved pages after a blank session logs in", async () => {
        const app = await phone({ pagesOwner: 99 });
        app.start();

        await app.signInToServer();

        expect(caches.delete).toHaveBeenCalledWith("sitrep-pages-v2");
        expect(caches.delete).not.toHaveBeenCalledWith("sitrep-assets-v2");
        expect(app.accounts.savedPagesBelongTo(7)).toBe(true);
        expect(app.sync.refreshPage).toHaveBeenCalled();
    });

    it("stays offline and tries again when the server cannot be reached", async () => {
        const app = await phone({ pagesOwner: 7 });
        app.start();
        app.axios.get.mockRejectedValue(new Error("Network Error"));

        await app.signInToServer();
        expect(app.offlineSession()).not.toBeNull();
        expect(app.axios.post).not.toHaveBeenCalled();

        await app.signInToServer();
        expect(app.axios.get).toHaveBeenCalledTimes(2);
    });

    it("does not treat a page that is not the server's answer as a login or a logout", async () => {
        const app = await phone({ pagesOwner: 7 });
        app.lock.setPendingLogout(3);
        app.start();
        app.axios.post.mockResolvedValue({ status: 200, data: "<html>no load</html>" });

        await app.signInToServer();

        expect(app.offlineSession()).not.toBeNull();
        expect(app.lock.pendingLogout()).toBe(3);
        expect(app.sync.syncNow).not.toHaveBeenCalledWith();
    });

    it("covers the app and keeps the reports when the server refuses the password", async () => {
        const app = await phone({ pagesOwner: 7, pageUser: user });
        app.start();
        app.axios.post.mockImplementation((url) =>
            url === "/logout" ? Promise.resolve({ status: 204 }) : Promise.reject({ response: { status: 422, data: { errors: { email: ["x"] } } } }),
        );

        await app.signInToServer();

        expect(app.accounts.hasAccount(user.email)).toBe(false);
        expect(app.accounts.accountsGone()).toEqual([7]);
        expect(app.lock.coverNotice()).toBe("changed");
        expect(app.lock.isCovered(user)).toBe(true);
        expect(app.offlineSession()).toBeNull();
        expect(caches.delete).toHaveBeenCalledWith("sitrep-pages-v2");
    });

    it("does nothing while the phone says it has no connection", async () => {
        const app = await phone({ pagesOwner: 7 });
        app.start();
        vi.stubGlobal("navigator", { onLine: false });

        await app.signInToServer();

        expect(app.axios.get).not.toHaveBeenCalled();
    });
});
