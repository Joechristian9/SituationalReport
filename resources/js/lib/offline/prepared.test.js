import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearPrepared, preparedAccount, preparedPhone, removePrepared, savePrepared } from "./prepared";

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
