import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkPrepared, clearPrepared, preparedAccount, preparedPhone, preparedTriesLeft, removePrepared, savePrepared } from "./prepared";

// Tests run without a browser: a plain in-memory localStorage.
const storage = new Map();
vi.stubGlobal("localStorage", {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
});

const DAY = 24 * 60 * 60 * 1000;
const download = (names, expiresInDays = 30) => ({
    expiresAt: new Date(Date.now() + expiresInDays * DAY).toISOString(),
    iterations: 310000,
    accounts: names.map((name) => ({ user: { id: name.length, name, email: `${name.toLowerCase()}@barangay.local` }, salt: "c2FsdA==", hash: "aGFzaA==" })),
    template: { barangays: names },
});

describe("prepared accounts", () => {
    beforeEach(() => clearPrepared());
    afterEach(() => vi.useRealTimers());

    it("adds a download's accounts to the ones already prepared, renewing repeats", () => {
        savePrepared(download(["Fugu", "Rugao"]));
        savePrepared(download(["Rugao", "Alibagu"], 10));

        expect(Object.keys(preparedPhone().accounts)).toEqual(["fugu@barangay.local", "rugao@barangay.local", "alibagu@barangay.local"]);
        expect(preparedAccount(" RUGAO@barangay.local ").expiresAt).toBe(preparedAccount("alibagu@barangay.local").expiresAt);
        // The newest forms template replaces the old one.
        expect(preparedPhone().template.barangays).toEqual(["Rugao", "Alibagu"]);
    });

    it("forgets accounts once their 30 days are over", () => {
        savePrepared(download(["Fugu"], 30));
        savePrepared(download(["Rugao"], 2));

        vi.useFakeTimers();
        vi.setSystemTime(Date.now() + 3 * DAY);

        expect(preparedAccount("rugao@barangay.local")).toBeNull();
        expect(preparedAccount("fugu@barangay.local")).not.toBeNull();
    });

    it("removes one account, and the whole preparation with the last one", () => {
        savePrepared(download(["Fugu", "Rugao"]));

        removePrepared("fugu@barangay.local");
        expect(preparedAccount("fugu@barangay.local")).toBeNull();

        removePrepared("rugao@barangay.local");
        expect(preparedPhone()).toBeNull();
        expect(storage.has("offline-prepared")).toBe(false);
    });
});

/** A check made the way the server makes it (User::rememberOfflinePassword), with fewer rounds for speed. */
async function serverCheck(password, iterations = 1000) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
    const base64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
    return { salt: base64(salt), hash: base64(bits), iterations };
}

describe("signing in with no internet", () => {
    beforeEach(async () => {
        clearPrepared();
        const { salt, hash, iterations } = await serverCheck("correct-horse-battery");
        savePrepared({
            expiresAt: new Date(Date.now() + 30 * DAY).toISOString(),
            iterations,
            accounts: [{ user: { id: 7, name: "Fugu", email: "fugu@barangay.local" }, salt, hash }],
            template: {},
        });
    });

    it("lets a prepared account in with its password only", async () => {
        expect(await checkPrepared("Fugu@barangay.local", "correct-horse-battery")).toBe("ok");
        expect(await checkPrepared("fugu@barangay.local", "wrong-horse-battery")).toBe("wrong");
        expect(preparedTriesLeft("fugu@barangay.local")).toBe(4);
        expect(await checkPrepared("rugao@barangay.local", "correct-horse-battery")).toBe("unknown");
    });

    it("refuses even the right password after five wrong ones", async () => {
        for (let i = 1; i < 5; i++) expect(await checkPrepared("fugu@barangay.local", "wrong")).toBe("wrong");
        expect(await checkPrepared("fugu@barangay.local", "wrong")).toBe("blocked");

        expect(await checkPrepared("fugu@barangay.local", "correct-horse-battery")).toBe("blocked");
    });
});
