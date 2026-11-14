import { beforeEach, describe, expect, it, vi } from "vitest";

const page = vi.hoisted(() => ({ user: null }));

vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("./context", () => ({ currentUser: () => page.user }));
vi.mock("./sync", () => ({ syncNow: vi.fn() }));
vi.mock("./offlineSession", () => ({ offlineSession: vi.fn(() => null), startOfflineSession: vi.fn(), endOfflineSession: vi.fn() }));

// Tests run without a browser: an in-memory localStorage, the app's route() helper, a window.
const storage = new Map();
vi.stubGlobal("localStorage", {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
});
vi.stubGlobal("route", (name) => `/${name}`);
vi.stubGlobal("caches", { keys: vi.fn(async () => ["sitrep-pages-v2", "sitrep-assets-v2"]), delete: vi.fn() });

const axios = (await import("axios")).default;
const { syncNow } = await import("./sync");
const { offlineSession, startOfflineSession, endOfflineSession } = await import("./offlineSession");
const { account, accountsGone, hasAccount, rememberAccount, savedPagesBelongTo, setSavedPagesOwner } = await import("./accounts");
const { coverNotice, isCovered, pendingLogout, setPendingLogout, setSignedInHere, signOutHere, signedInHere } = await import("./lock");
const { SERVER_WAIT_MS, finishPendingLogout, logOut, signIn } = await import("./auth");

const fugu = { id: 7, name: "Fugu", email: "fugu@barangay.local", roles: [{ name: "user" }], permissions: [], offline_stamp: "s1" };
const rugao = { id: 8, name: "Rugao", email: "rugao@barangay.local", roles: [{ name: "user" }], permissions: [], offline_stamp: "r1" };
const admin = { id: 1, name: "Admin", email: "admin@cdrrmo.local", roles: [{ name: "admin" }], permissions: [], offline_stamp: "a1" };
const queryClient = {};
const UNKNOWN = "This account has not logged in on this phone before, so logging in needs internet.";

const offline = () => Object.assign(new Error("Network Error"), { code: "ERR_NETWORK" });
const refused = (status, data) => ({ response: { status, data } });

/** Nothing reaches the server: data on with no load, or no signal at all. */
function unreachable() {
    axios.get.mockRejectedValue(offline());
    axios.post.mockRejectedValue(offline());
}

/** The server answers; `login` and `logout` are a response to resolve or an error to reject. */
function server({ login = { status: 200, data: { user: fugu, home: "/situation-reports" } }, logout = { status: 204 } } = {}) {
    const answer = (value) => (value.response ? Promise.reject(value) : Promise.resolve(value));
    axios.get.mockResolvedValue({ status: 204 });
    axios.post.mockImplementation((url) => answer(url === "/logout" ? logout : login));
}

const postedTo = () => axios.post.mock.calls.map(([url]) => url);
const logIn = (email, password) => signIn({ email, password }, queryClient);

beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
    page.user = null;
    offlineSession.mockReturnValue(null);
    vi.stubGlobal("navigator", { onLine: true });
    vi.stubGlobal("window", { location: { assign: vi.fn(), href: "" } });
});

describe("signIn", () => {
    it("lets the account underneath back in with the phone's check, without asking the server", async () => {
        await rememberAccount(fugu, "correct horse");
        page.user = fugu;
        signOutHere({ pendingLogout: 7 });

        expect(await logIn(" Fugu@Barangay.local ", "correct horse")).toEqual({ ok: true });

        expect(axios.post).not.toHaveBeenCalled();
        expect(signedInHere()).toBe(fugu.email);
        expect(isCovered(fugu)).toBe(false);
        expect(pendingLogout()).toBeNull(); // the logout that was waiting is cancelled
    });

    it("refuses a wrong password for the account underneath and counts the try", async () => {
        await rememberAccount(fugu, "correct horse");
        page.user = fugu;
        signOutHere();

        expect(await logIn(fugu.email, "wrong")).toEqual({ ok: false, field: "password", message: "Wrong password. 4 tries left on this phone without internet." });
        expect(isCovered(fugu)).toBe(true);
        expect(axios.post).not.toHaveBeenCalled();
    });

    it("loads the account's home page when the server accepts the login", async () => {
        server();

        expect(await logIn(fugu.email, "correct horse")).toEqual({ ok: true });

        expect(postedTo()).toEqual(["/login"]);
        const [, body, config] = axios.post.mock.calls[0];
        expect(body).toEqual({ email: fugu.email, password: "correct horse", remember: true });
        expect(config).toMatchObject({ timeout: 10000, offlineSync: true, headers: { Accept: "application/json" } });
        expect(SERVER_WAIT_MS).toBe(10000);
        expect(window.location.assign).toHaveBeenCalledWith("/situation-reports");
        expect(hasAccount(fugu.email)).toBe(true);
        expect(savedPagesBelongTo(7)).toBe(true);
        expect(signedInHere()).toBe(fugu.email);
    });

    it("logs the other account out on the server before logging in, and clears its saved pages", async () => {
        page.user = rugao;
        setSavedPagesOwner(8);
        server();

        await logIn(fugu.email, "correct horse");

        expect(postedTo()).toEqual(["/logout", "/login"]);
        expect(caches.delete).toHaveBeenCalledWith("sitrep-pages-v2");
        expect(savedPagesBelongTo(7)).toBe(true);
    });

    it("forgets the phone's check when the server refuses a password the phone still accepts", async () => {
        await rememberAccount(fugu, "correct horse");
        setSavedPagesOwner(7);
        server({ login: refused(422, { errors: { email: ["These credentials do not match our records."] } }) });

        expect(await logIn(fugu.email, "correct horse")).toEqual({ ok: false, field: "email", message: "These credentials do not match our records." });

        expect(hasAccount(fugu.email)).toBe(false);
        expect(accountsGone()).toEqual([7]);
        expect(caches.delete).toHaveBeenCalledWith("sitrep-pages-v2");
        expect(startOfflineSession).not.toHaveBeenCalled();
    });

    it("keeps the phone's check when the refused password was simply mistyped", async () => {
        await rememberAccount(fugu, "correct horse");
        server({ login: refused(422, { errors: { email: ["These credentials do not match our records."] } }) });

        await logIn(fugu.email, "wrong");

        expect(hasAccount(fugu.email)).toBe(true);
        expect(caches.delete).not.toHaveBeenCalled();
    });

    it("does not fall back to the phone when the server answers \"too many attempts\" or an error", async () => {
        await rememberAccount(fugu, "correct horse");

        server({ login: refused(429, { message: "Too many login attempts." }) });
        expect(await logIn(fugu.email, "correct horse")).toEqual({ ok: false, field: "email", message: "Too many login attempts." });

        server({ login: refused(500, {}) });
        expect(await logIn(fugu.email, "correct horse")).toEqual({ ok: false, field: "email", message: "The server had a problem. Try again in a moment." });

        expect(startOfflineSession).not.toHaveBeenCalled();
        expect(hasAccount(fugu.email)).toBe(true);
    });

    it("starts an offline session when the server cannot be reached and the phone knows the password", async () => {
        await rememberAccount(fugu, "correct horse");
        unreachable();

        expect(await logIn(fugu.email, "correct horse")).toEqual({ ok: true });

        expect(startOfflineSession).toHaveBeenCalledWith(account(fugu.email), "correct horse", queryClient);
        expect(window.location.assign).not.toHaveBeenCalled();
    });

    it("treats a page that is not the server's answer as no connection", async () => {
        await rememberAccount(fugu, "correct horse");
        server({ login: { status: 200, data: "<html>no load</html>" } });

        expect(await logIn(fugu.email, "correct horse")).toEqual({ ok: true });

        expect(startOfflineSession).toHaveBeenCalled();
        expect(window.location.assign).not.toHaveBeenCalled();
    });

    it("says internet is needed for an account that never logged in on this phone", async () => {
        unreachable();

        expect(await logIn(fugu.email, "correct horse")).toEqual({ ok: false, field: "email", message: UNKNOWN });
        expect(startOfflineSession).not.toHaveBeenCalled();
    });

    it("never starts an offline session for an admin", async () => {
        await rememberAccount(admin, "correct horse");
        unreachable();

        expect(await logIn(admin.email, "correct horse")).toEqual({ ok: false, field: "email", message: UNKNOWN });
        expect(startOfflineSession).not.toHaveBeenCalled();
    });

    it("blocks the phone check after five wrong passwords", async () => {
        await rememberAccount(fugu, "correct horse");
        unreachable();

        for (let i = 4; i >= 1; i--) {
            expect((await logIn(fugu.email, "wrong")).message).toBe(`Wrong password. ${i} ${i === 1 ? "try" : "tries"} left on this phone without internet.`);
        }
        const blocked = { ok: false, field: "password", message: "Too many wrong passwords on this phone. Log in with internet to continue." };
        expect(await logIn(fugu.email, "wrong")).toEqual(blocked);
        expect(await logIn(fugu.email, "correct horse")).toEqual(blocked);
        expect(startOfflineSession).not.toHaveBeenCalled();
    });

    it("marks the open account for logout when someone else logs in offline over it", async () => {
        await rememberAccount(fugu, "correct horse");
        page.user = rugao;
        unreachable();

        await logIn(fugu.email, "correct horse");

        expect(pendingLogout()).toBe(8);
        expect(endOfflineSession).toHaveBeenCalled(); // rugao's offline session, if any, is over
        expect(startOfflineSession).toHaveBeenCalled();
    });

    it("logs the same account back in after a password change without reloading the page", async () => {
        page.user = fugu;
        signOutHere({ notice: "changed" });
        server({ login: { status: 200, data: { user: { ...fugu, offline_stamp: "s2" }, home: "/situation-reports" } }, logout: refused(401, {}) });

        expect(await logIn(fugu.email, "new password 123")).toEqual({ ok: true });

        expect(window.location.assign).not.toHaveBeenCalled();
        expect(syncNow).toHaveBeenCalled();
        expect(coverNotice()).toBeNull();
        expect(isCovered(fugu)).toBe(false);
        expect(account(fugu.email).stamp).toBe("s2");
    });
});

describe("logOut", () => {
    beforeEach(async () => {
        await rememberAccount(fugu, "correct horse");
        await rememberAccount(admin, "correct horse");
    });

    it("with no connection a report account is logged out on this phone and finished later", async () => {
        page.user = fugu;
        setSignedInHere(fugu.email);
        unreachable();

        expect(await logOut()).toBe("local");

        expect(axios.get).toHaveBeenCalledWith("/sanctum.csrf-cookie", expect.objectContaining({ timeout: 10000, offlineSync: true }));
        expect(isCovered(fugu)).toBe(true);
        expect(pendingLogout()).toBe(7);
        expect(hasAccount(fugu.email)).toBe(true);
    });

    it("an admin needs the server", async () => {
        page.user = admin;
        setSignedInHere(admin.email);
        unreachable();

        expect(await logOut()).toBe("needs-internet");

        expect(isCovered(admin, { idleLock: false })).toBe(false);
        expect(hasAccount(admin.email)).toBe(true);
    });

    it("online, a report account keeps its check and its saved pages", async () => {
        page.user = fugu;
        setSignedInHere(fugu.email);
        setPendingLogout(7);
        server();

        expect(await logOut()).toBe("done");

        expect(hasAccount(fugu.email)).toBe(true);
        expect(caches.delete).not.toHaveBeenCalled();
        expect(signedInHere()).toBeNull();
        expect(pendingLogout()).toBeNull();
        expect(window.location.href).toBe("/");
    });

    it("online, an admin's check and saved pages are removed", async () => {
        page.user = admin;
        setSignedInHere(admin.email);
        server();

        expect(await logOut()).toBe("done");

        expect(hasAccount(admin.email)).toBe(false);
        expect(accountsGone()).toEqual([]); // an ordinary logout, not an account the server dropped
        expect(caches.delete).toHaveBeenCalledWith("sitrep-pages-v2");
    });

    it("an offline session ends on the phone only", async () => {
        page.user = fugu;
        setSignedInHere(fugu.email);
        setPendingLogout(8);
        offlineSession.mockReturnValue({ user: fugu, blank: true });

        expect(await logOut()).toBe("local");

        expect(axios.post).not.toHaveBeenCalled();
        expect(endOfflineSession).toHaveBeenCalled();
        expect(signedInHere()).toBeNull();
        expect(pendingLogout()).toBe(8); // the account still open on the server is unchanged
    });
});

describe("finishPendingLogout", () => {
    it("sends that account's reports, logs it out, and clears the mark", async () => {
        setPendingLogout(7);
        server();

        await finishPendingLogout();

        expect(syncNow).toHaveBeenCalledWith({ userId: 7, evenIfHeld: true });
        expect(syncNow.mock.invocationCallOrder[0]).toBeLessThan(axios.post.mock.invocationCallOrder[0]);
        expect(postedTo()).toEqual(["/logout"]);
        expect(pendingLogout()).toBeNull();
    });

    it("stays pending while the server cannot be reached", async () => {
        setPendingLogout(7);
        unreachable();

        await finishPendingLogout();

        expect(pendingLogout()).toBe(7);
    });

    it("does nothing when no logout is waiting, or during an offline session", async () => {
        server();
        await finishPendingLogout();

        setPendingLogout(7);
        offlineSession.mockReturnValue({ user: rugao, blank: true });
        await finishPendingLogout();

        expect(axios.post).not.toHaveBeenCalled();
        expect(pendingLogout()).toBe(7);
    });
});
