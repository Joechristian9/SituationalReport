import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    MAX_TRIES,
    account,
    checkPassword,
    forgetAccount,
    hasAccount,
    matchesCheck,
    notePage,
    rememberAccount,
    rememberUser,
    rememberedAccounts,
    savedPagesBelongTo,
    setSavedPagesOwner,
    takeOldLock,
    template,
    triesLeft,
} from "./accounts";

// Tests run without a browser: a plain in-memory localStorage and Cache storage.
const storage = new Map();
vi.stubGlobal("localStorage", {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
});
vi.stubGlobal("window", { caches: true });
vi.stubGlobal("caches", { keys: vi.fn(async () => ["sitrep-pages-v2", "sitrep-pages-data-v2", "sitrep-assets-v2"]), delete: vi.fn() });

const fugu = { id: 7, name: "Fugu", email: "Fugu@Barangay.local", roles: [{ name: "user" }], permissions: [], offline_stamp: "s1" };
const rugao = { id: 8, name: "Rugao", email: "rugao@barangay.local", roles: [{ name: "user" }], permissions: [], offline_stamp: "r1" };

/** The single record the lock kept before several accounts were remembered. */
async function oldRecord(email, password, iterations) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
    const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
    return { email, salt: toBase64(salt), hash: toBase64(bits), iterations, locked: false, tries: 0, lastActive: Date.now() };
}

beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
});

describe("remembered accounts", () => {
    it("keeps a check of the password, never the password itself", async () => {
        await rememberAccount(fugu, "correct horse");

        expect(storage.get("offline-accounts")).not.toContain("correct horse");
        expect(hasAccount(" fugu@barangay.local ")).toBe(true);
        expect(hasAccount("rugao@barangay.local")).toBe(false);
    });

    it("remembers several accounts and counts wrong tries for each one", async () => {
        await rememberAccount(fugu, "correct horse");
        await rememberAccount(rugao, "battery staple");

        expect(await checkPassword(fugu.email, "wrong")).toBe("wrong");
        expect(triesLeft(fugu.email)).toBe(MAX_TRIES - 1);
        expect(triesLeft(rugao.email)).toBe(MAX_TRIES);
        expect(await checkPassword(rugao.email, "battery staple")).toBe("ok");
        expect(await checkPassword(fugu.email, "correct horse")).toBe("ok");
        expect(triesLeft(fugu.email)).toBe(MAX_TRIES);
    });

    it("refuses even the right password after five wrong ones, until the account is remembered again", async () => {
        await rememberAccount(fugu, "correct horse");
        for (let i = 1; i < MAX_TRIES; i++) expect(await checkPassword(fugu.email, "wrong")).toBe("wrong");
        expect(await checkPassword(fugu.email, "wrong")).toBe("blocked");
        expect(await checkPassword(fugu.email, "correct horse")).toBe("blocked");

        await rememberAccount(fugu, "correct horse");

        expect(await checkPassword(fugu.email, "correct horse")).toBe("ok");
    });

    it("does not know an account that never logged in on this phone", async () => {
        expect(await checkPassword("nobody@barangay.local", "x")).toBe("unknown");
        expect(await matchesCheck("nobody@barangay.local", "x")).toBe(false);
        expect(triesLeft("nobody@barangay.local")).toBe(0);
    });

    it("compares a password with the check without counting a try", async () => {
        await rememberAccount(fugu, "correct horse");

        expect(await matchesCheck(fugu.email, "wrong")).toBe(false);
        expect(await matchesCheck(fugu.email, "correct horse")).toBe(true);
        expect(triesLeft(fugu.email)).toBe(MAX_TRIES);
    });

    it("drops the check when the account's stamp changes, and keeps it when it does not", async () => {
        await rememberAccount(fugu, "correct horse");

        rememberUser({ ...fugu, name: "Fugu II" });
        expect(account(fugu.email).user.name).toBe("Fugu II");

        rememberUser({ ...fugu, offline_stamp: "s2" });
        expect(hasAccount(fugu.email)).toBe(false);

        await rememberAccount({ ...fugu, offline_stamp: "s2" }, "new password 123");
        expect(await checkPassword(fugu.email, "new password 123")).toBe("ok");
    });

    it("does not start remembering an account from its details alone", () => {
        rememberUser(fugu);

        expect(hasAccount(fugu.email)).toBe(false);
        expect(rememberedAccounts()).toEqual([]);
    });

    it("keeps the check of a phone signed in before this release", async () => {
        storage.set("offline-lock", JSON.stringify(await oldRecord("fugu@barangay.local", "correct horse", 1000)));

        expect(takeOldLock()).toMatchObject({ email: "fugu@barangay.local", locked: false });
        expect(storage.has("offline-lock")).toBe(false);
        expect(hasAccount(fugu.email)).toBe(false); // no account details yet

        rememberUser(fugu);

        expect(await checkPassword(fugu.email, "correct horse")).toBe("ok");
        expect(takeOldLock()).toBeNull();
    });

    it("forgets one account and leaves the others", async () => {
        await rememberAccount(fugu, "correct horse");
        await rememberAccount(rugao, "battery staple");

        forgetAccount(fugu.email);

        expect(hasAccount(fugu.email)).toBe(false);
        expect(rememberedAccounts().map((entry) => entry.user.id)).toEqual([8]);
        expect(rememberedAccounts()[0]).toMatchObject({ email: "rugao@barangay.local", stamp: "r1" });
    });
});

describe("notePage", () => {
    const formsPage = (user) => ({ component: "SituationReports/Index", props: { auth: { user }, typhoon: { hasActive: true, active: { id: 3 } }, barangays: ["Fugu"] } });

    it("keeps everything when the page has no user (logged out)", async () => {
        await rememberAccount(fugu, "correct horse");
        setSavedPagesOwner(7);

        notePage({ component: "Auth/Login", props: { auth: { user: null } } }, false);

        expect(hasAccount(fugu.email)).toBe(true);
        expect(savedPagesBelongTo(7)).toBe(true);
        expect(caches.delete).not.toHaveBeenCalled();
    });

    it("clears the saved pages when a different account's page arrives, and saves the forms template", async () => {
        setSavedPagesOwner(7);

        notePage(formsPage(rugao), false);
        await vi.waitFor(() => expect(caches.delete).toHaveBeenCalledWith("sitrep-pages-v2"));

        expect(caches.delete).toHaveBeenCalledWith("sitrep-pages-data-v2");
        expect(caches.delete).not.toHaveBeenCalledWith("sitrep-assets-v2");
        expect(savedPagesBelongTo(8)).toBe(true);
        expect(template()).toMatchObject({ barangays: ["Fugu"], typhoon: { hasActive: true } });
    });

    it("keeps the saved pages when their own account's page arrives", () => {
        setSavedPagesOwner(8);

        notePage(formsPage(rugao), false);

        expect(caches.delete).not.toHaveBeenCalled();
        expect(savedPagesBelongTo(8)).toBe(true);
    });

    it("changes nothing during an offline session", () => {
        setSavedPagesOwner(7);

        notePage(formsPage(rugao), true);

        expect(savedPagesBelongTo(7)).toBe(true);
        expect(caches.delete).not.toHaveBeenCalled();
        expect(template()).toEqual({});
    });
});
