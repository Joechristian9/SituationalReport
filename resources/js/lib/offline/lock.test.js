import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDLE_MS, MAX_TRIES, canLock, forgetPassword, isLocked, lock, noteActivity, rememberPassword, triesLeft, unlock } from "./lock";

// Tests run without a browser: a plain in-memory localStorage.
const storage = new Map();
vi.stubGlobal("localStorage", {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
});

describe("offline sign-in", () => {
    beforeEach(async () => {
        storage.clear();
        await rememberPassword(" Fugu@Barangay.local ", "correct horse");
    });
    afterEach(() => vi.useRealTimers());

    it("keeps a check of the password, never the password itself", () => {
        expect(storage.get("offline-lock")).not.toContain("correct horse");
        expect(canLock("fugu@barangay.local")).toBe(true);
        expect(canLock("rugao@barangay.local")).toBe(false);
    });

    it("unlocks with the right password and stays locked with a wrong one", async () => {
        lock();
        expect(isLocked("fugu@barangay.local")).toBe(true);

        expect(await unlock("wrong")).toBe("wrong");
        expect(isLocked("fugu@barangay.local")).toBe(true);
        expect(triesLeft()).toBe(MAX_TRIES - 1);

        expect(await unlock("correct horse")).toBe("ok");
        expect(isLocked("fugu@barangay.local")).toBe(false);
        expect(triesLeft()).toBe(MAX_TRIES);
    });

    it("refuses even the right password after too many wrong ones", async () => {
        for (let i = 1; i < MAX_TRIES; i++) expect(await unlock("wrong")).toBe("wrong");
        expect(await unlock("wrong")).toBe("blocked");

        expect(await unlock("correct horse")).toBe("blocked");
        expect(isLocked("fugu@barangay.local")).toBe(true);
    });

    it("locks after the idle time, and a tap after that does not lift it", () => {
        vi.useFakeTimers();
        vi.setSystemTime(Date.now() + IDLE_MS + 1000);

        noteActivity();

        expect(isLocked("fugu@barangay.local")).toBe(true);
        // Admin screens lock only by hand.
        expect(isLocked("fugu@barangay.local", { idleLock: false })).toBe(false);
    });

    it("never locks an account whose password this phone doesn't know", () => {
        forgetPassword();
        lock();

        expect(canLock("fugu@barangay.local")).toBe(false);
        expect(isLocked("fugu@barangay.local")).toBe(false);
    });
});
